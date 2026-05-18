import { describe, expect, it } from 'vitest'
import { parseReshaprPromptsYaml } from './mcpPrompts'

const SAMPLE = `apiVersion: reshapr.io/v1alpha1
kind: Prompts
service:
  name: API Pastry - 2.0
  version: 2.0.0
prompts:
  list_pastries:
    title: List the pastries
    description: Browse the catalog to get all the pastries
    result: Get all the pastries from the catalog
  get_pastry:
    title: Get details of a pastry
    description: Get details for a specific pastry from the catalog
    arguments:
      - name: name
        description: The name of the pastry to get
        required: true
    result: Get pastry details
`

describe('parseReshaprPromptsYaml', () => {
  it('parses prompt keys and arguments', () => {
    const prompts = parseReshaprPromptsYaml(SAMPLE)
    expect(prompts).toHaveLength(2)
    expect(prompts[0]).toMatchObject({
      name: 'list_pastries',
      description: 'Browse the catalog to get all the pastries',
    })
    expect(prompts[1]).toMatchObject({
      name: 'get_pastry',
      arguments: [{ name: 'name', description: 'The name of the pastry to get', required: true }],
    })
  })

  it('returns empty for missing prompts block', () => {
    expect(parseReshaprPromptsYaml('kind: Prompts')).toEqual([])
  })
})
