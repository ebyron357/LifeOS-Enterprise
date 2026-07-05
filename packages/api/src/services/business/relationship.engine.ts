/**
 * Relationship Engine
 *
 * Manages all relationships between a business and other LifeOS entities.
 * Supports: projects, knowledge, agents, automations, people, repositories,
 * meetings, documents, finance records, CRM records, dashboards.
 *
 * Relationships are stored as typed links: business ↔ entity_type:entity_key.
 * No entity data is duplicated — only the reference is stored here.
 */
import type { IBusinessRepository } from './business.repository.js'
import type { AddRelationshipData, BusinessRelationshipRecord } from './types.js'

export type RelationshipEntityType =
  | 'project'
  | 'knowledge'
  | 'agent'
  | 'automation'
  | 'person'
  | 'repository'
  | 'meeting'
  | 'document'
  | 'finance_account'
  | 'crm_contact'
  | 'dashboard'
  | 'sop'
  | 'workflow'

export const RELATIONSHIP_LABELS: Record<RelationshipEntityType, string> = {
  project: 'has project',
  knowledge: 'has knowledge object',
  agent: 'uses agent',
  automation: 'uses automation',
  person: 'employs / collaborates with',
  repository: 'has repository',
  meeting: 'has meeting',
  document: 'has document',
  finance_account: 'has finance account',
  crm_contact: 'has CRM contact',
  dashboard: 'has dashboard',
  sop: 'has SOP',
  workflow: 'has workflow',
}

export interface RelationshipSummary {
  entity_type: RelationshipEntityType
  entity_key: string
  relationship_label: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface BusinessRelationshipMap {
  projects: RelationshipSummary[]
  knowledge: RelationshipSummary[]
  agents: RelationshipSummary[]
  automations: RelationshipSummary[]
  people: RelationshipSummary[]
  repositories: RelationshipSummary[]
  meetings: RelationshipSummary[]
  documents: RelationshipSummary[]
  finance_accounts: RelationshipSummary[]
  crm_contacts: RelationshipSummary[]
  dashboards: RelationshipSummary[]
  sops: RelationshipSummary[]
  workflows: RelationshipSummary[]
  total: number
}

export class RelationshipEngine {
  constructor(private readonly repo: IBusinessRepository) {}

  async link(
    businessId: string,
    businessKey: string,
    orgId: string,
    entityType: RelationshipEntityType,
    entityKey: string,
    createdBy: string,
    metadata?: Record<string, unknown>,
  ): Promise<BusinessRelationshipRecord> {
    const data: AddRelationshipData = {
      business_id: businessId,
      business_key: businessKey as `BIZ-${string}`,
      org_id: orgId,
      entity_type: entityType,
      entity_key: entityKey,
      relationship_label: RELATIONSHIP_LABELS[entityType],
      metadata,
      created_by: createdBy,
    }

    return this.repo.addRelationship(data)
  }

  async unlink(
    businessId: string,
    entityType: RelationshipEntityType,
    entityKey: string,
    orgId: string,
  ): Promise<void> {
    return this.repo.removeRelationship(businessId, entityType, entityKey, orgId)
  }

  async getMap(businessId: string, orgId: string): Promise<BusinessRelationshipMap> {
    const all = await this.repo.listRelationships(businessId, orgId)

    const grouped: BusinessRelationshipMap = {
      projects: [],
      knowledge: [],
      agents: [],
      automations: [],
      people: [],
      repositories: [],
      meetings: [],
      documents: [],
      finance_accounts: [],
      crm_contacts: [],
      dashboards: [],
      sops: [],
      workflows: [],
      total: all.length,
    }

    for (const rel of all) {
      const summary: RelationshipSummary = {
        entity_type: rel.entity_type as RelationshipEntityType,
        entity_key: rel.entity_key,
        relationship_label: rel.relationship_label,
        metadata: rel.metadata,
        created_at: rel.created_at,
      }

      switch (rel.entity_type as RelationshipEntityType) {
        case 'project':
          grouped.projects.push(summary)
          break
        case 'knowledge':
          grouped.knowledge.push(summary)
          break
        case 'agent':
          grouped.agents.push(summary)
          break
        case 'automation':
          grouped.automations.push(summary)
          break
        case 'person':
          grouped.people.push(summary)
          break
        case 'repository':
          grouped.repositories.push(summary)
          break
        case 'meeting':
          grouped.meetings.push(summary)
          break
        case 'document':
          grouped.documents.push(summary)
          break
        case 'finance_account':
          grouped.finance_accounts.push(summary)
          break
        case 'crm_contact':
          grouped.crm_contacts.push(summary)
          break
        case 'dashboard':
          grouped.dashboards.push(summary)
          break
        case 'sop':
          grouped.sops.push(summary)
          break
        case 'workflow':
          grouped.workflows.push(summary)
          break
      }
    }

    return grouped
  }

  async listByType(
    businessId: string,
    orgId: string,
    entityType: RelationshipEntityType,
  ): Promise<RelationshipSummary[]> {
    const records = await this.repo.listRelationships(businessId, orgId, entityType)
    return records.map((r) => ({
      entity_type: r.entity_type as RelationshipEntityType,
      entity_key: r.entity_key,
      relationship_label: r.relationship_label,
      metadata: r.metadata,
      created_at: r.created_at,
    }))
  }
}
