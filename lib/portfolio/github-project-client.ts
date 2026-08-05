import type { ProjectV2Field, ProjectV2Item, ProjectsV2Client } from "./github-project-sync";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

type GraphQLError = Error & { status?: number };

async function graphql<T>(query: string, variables: Record<string, unknown>, token: string): Promise<T> {
  const response = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.errors) {
    const message = payload.errors?.[0]?.message ?? `GitHub GraphQL request failed (${response.status}).`;
    const error = new Error(message) as GraphQLError;
    error.status = response.status;
    throw error;
  }
  return payload.data as T;
}

/**
 * Real GitHub Projects v2 GraphQL adapter. Requires an OAuth/PAT token
 * with the `project` (write) or `read:project` (read-only) scope, which
 * the current audit found the deployed `gh` token does not have — see
 * docs/P0_LIFEOS_RECOVERY_RUNLOG.md. Every call here is exercised in
 * tests only through the `ProjectsV2Client` interface's fake
 * implementation; this file itself is not covered by live-network tests.
 */
type PageInfo = { hasNextPage: boolean; endCursor: string | null };

type ListFieldsResponse = {
  node: {
    fields: {
      pageInfo: PageInfo;
      nodes: Array<{ id: string; name: string; dataType?: string; options?: Array<{ id: string; name: string }> }>;
    };
  };
};

type ListItemsResponse = {
  node: {
    items: {
      pageInfo: PageInfo;
      nodes: Array<{
        id: string;
        fieldValues: {
          nodes: Array<{
            field?: { name?: string };
            text?: string;
            name?: string;
            date?: string;
          }>;
        };
      }>;
    };
  };
};

export function createGithubProjectsV2Client(token: string): ProjectsV2Client {
  return {
    async listFields(projectId) {
      const fields: ProjectV2Field[] = [];
      let after: string | null = null;
      do {
        const data: ListFieldsResponse = await graphql<ListFieldsResponse>(
          `query($projectId: ID!, $after: String) {
            node(id: $projectId) {
              ... on ProjectV2 {
                fields(first: 50, after: $after) {
                  pageInfo { hasNextPage endCursor }
                  nodes {
                    ... on ProjectV2FieldCommon { id name }
                    ... on ProjectV2SingleSelectField { id name options { id name } }
                  }
                }
              }
            }
          }`,
          { projectId, after },
          token,
        );
        const page = data.node.fields;
        for (const node of page.nodes) {
          fields.push({
            id: node.id,
            name: node.name,
            dataType: node.options ? "SINGLE_SELECT" : "TEXT",
            options: node.options,
          });
        }
        after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
      } while (after);
      return fields;
    },

    async listItems(projectId) {
      const items: ProjectV2Item[] = [];
      let after: string | null = null;
      do {
        const data: ListItemsResponse = await graphql<ListItemsResponse>(
          `query($projectId: ID!, $after: String) {
            node(id: $projectId) {
              ... on ProjectV2 {
                items(first: 50, after: $after) {
                  pageInfo { hasNextPage endCursor }
                  nodes {
                    id
                    fieldValues(first: 50) {
                      nodes {
                        ... on ProjectV2ItemFieldTextValue { field { ... on ProjectV2FieldCommon { name } } text }
                        ... on ProjectV2ItemFieldSingleSelectValue { field { ... on ProjectV2FieldCommon { name } } name }
                        ... on ProjectV2ItemFieldDateValue { field { ... on ProjectV2FieldCommon { name } } date }
                      }
                    }
                  }
                }
              }
            }
          }`,
          { projectId, after },
          token,
        );
        const page = data.node.items;
        for (const node of page.nodes) {
          items.push({
            id: node.id,
            fieldValues: node.fieldValues.nodes
              .filter((fv) => fv.field?.name)
              .map((fv) => ({
                fieldId: "",
                fieldName: fv.field!.name!,
                value: fv.text ?? fv.name ?? fv.date ?? "",
              })),
          });
        }
        after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
      } while (after);
      return items;
    },

    async createField(projectId, name, dataType, options) {
      const data = await graphql<{ createProjectV2Field: { projectV2Field: { id: string; name: string } } }>(
        `mutation($input: CreateProjectV2FieldInput!) {
          createProjectV2Field(input: $input) {
            projectV2Field { ... on ProjectV2FieldCommon { id name } }
          }
        }`,
        {
          input: {
            projectId,
            name,
            dataType,
            ...(options ? { singleSelectOptions: options.map((option) => ({ name: option, color: "GRAY", description: "" })) } : {}),
          },
        },
        token,
      );
      return { id: data.createProjectV2Field.projectV2Field.id, name, dataType, options: options?.map((o) => ({ id: o, name: o })) };
    },

    async createItem(projectId, title) {
      const data = await graphql<{ addProjectV2DraftIssue: { projectItem: { id: string } } }>(
        `mutation($input: AddProjectV2DraftIssueInput!) {
          addProjectV2DraftIssue(input: $input) { projectItem { id } }
        }`,
        { input: { projectId, title } },
        token,
      );
      return { id: data.addProjectV2DraftIssue.projectItem.id, fieldValues: [] };
    },

    async updateItemField(projectId, itemId, fieldId, value) {
      await graphql(
        `mutation($input: UpdateProjectV2ItemFieldValueInput!) {
          updateProjectV2ItemFieldValue(input: $input) { projectV2Item { id } }
        }`,
        { input: { projectId, itemId, fieldId, value: { text: value } } },
        token,
      );
    },
  };
}
