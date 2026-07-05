import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryBusinessRepository } from '../services/business/business.repository.js'
import { RELATIONSHIP_LABELS, RelationshipEngine } from '../services/business/relationship.engine.js'

const ORG_ID = 'org-test-001'
const USER_ID = 'user-test-001'

describe('RelationshipEngine.getMap', () => {
  let repo: InMemoryBusinessRepository
  let engine: RelationshipEngine
  let businessId: string
  let businessKey: `BIZ-${string}`

  beforeEach(async () => {
    repo = new InMemoryBusinessRepository()
    engine = new RelationshipEngine(repo)

    const business = await repo.create({
      business_key: 'BIZ-TEST01',
      org_id: ORG_ID,
      name: 'Relationship Test Business',
      slug: 'relationship-test-business',
      status: 'Active',
      owner_id: USER_ID,
      tags: [],
      metadata: {},
      archived: false,
    })

    businessId = business.id
    businessKey = business.business_key
  })

  it('groups all supported relationship entity types into map buckets', async () => {
    const entries = [
      ['project', 'PRJ-001'],
      ['knowledge', 'KNO-001'],
      ['agent', 'AGT-001'],
      ['automation', 'AUT-001'],
      ['person', 'PER-001'],
      ['repository', 'REP-001'],
      ['meeting', 'MTG-001'],
      ['document', 'DOC-001'],
      ['finance_account', 'FIN-001'],
      ['crm_contact', 'CRM-001'],
      ['dashboard', 'DSH-001'],
      ['sop', 'SOP-001'],
      ['workflow', 'WFL-001'],
    ] as const

    for (const [entityType, entityKey] of entries) {
      await engine.link(
        businessId,
        businessKey,
        ORG_ID,
        entityType,
        entityKey,
        USER_ID,
        { source: 'test' },
      )
    }

    const grouped = await engine.getMap(businessId, ORG_ID)

    expect(grouped.total).toBe(13)
    expect(grouped.projects).toHaveLength(1)
    expect(grouped.knowledge).toHaveLength(1)
    expect(grouped.agents).toHaveLength(1)
    expect(grouped.automations).toHaveLength(1)
    expect(grouped.people).toHaveLength(1)
    expect(grouped.repositories).toHaveLength(1)
    expect(grouped.meetings).toHaveLength(1)
    expect(grouped.documents).toHaveLength(1)
    expect(grouped.finance_accounts).toHaveLength(1)
    expect(grouped.crm_contacts).toHaveLength(1)
    expect(grouped.dashboards).toHaveLength(1)
    expect(grouped.sops).toHaveLength(1)
    expect(grouped.workflows).toHaveLength(1)

    expect(grouped.projects[0]).toMatchObject({
      entity_type: 'project',
      entity_key: 'PRJ-001',
      relationship_label: RELATIONSHIP_LABELS.project,
      metadata: { source: 'test' },
    })
  })

  it('returns an empty map shape when no relationships exist', async () => {
    const grouped = await engine.getMap(businessId, ORG_ID)

    expect(grouped.total).toBe(0)
    expect(grouped.projects).toEqual([])
    expect(grouped.knowledge).toEqual([])
    expect(grouped.agents).toEqual([])
    expect(grouped.automations).toEqual([])
    expect(grouped.people).toEqual([])
    expect(grouped.repositories).toEqual([])
    expect(grouped.meetings).toEqual([])
    expect(grouped.documents).toEqual([])
    expect(grouped.finance_accounts).toEqual([])
    expect(grouped.crm_contacts).toEqual([])
    expect(grouped.dashboards).toEqual([])
    expect(grouped.sops).toEqual([])
    expect(grouped.workflows).toEqual([])
  })
})
