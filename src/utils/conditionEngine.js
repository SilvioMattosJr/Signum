/* ================================================================
   Signum Condition Engine
   Evaluates whether a field should be visible based on conditions
   set by the user.

   Condition shape:
   {
     id:         string,
     fieldId:    string,        // the field whose value to check
     operator:   'eq'|'neq'|'contains'|'not_contains'|'gt'|'lt'|'filled'|'empty',
     value:      string|boolean|number,   // the comparison value
     logic:      'and'|'or',   // how this condition combines with the previous one
   }

   A field's `conditions` array + `conditionMode` ('show'|'hide') controls visibility.
   - conditionMode='show': field is HIDDEN unless ALL (and) / ANY (or) conditions pass
   - conditionMode='hide': field is VISIBLE unless ALL (and) / ANY (or) conditions pass

   If conditions array is empty, the field is always visible.
   ================================================================ */

export const OPERATORS = [
  { value:'filled',       label:'está preenchido' },
  { value:'empty',        label:'está vazio' },
  { value:'eq',           label:'é igual a' },
  { value:'neq',          label:'é diferente de' },
  { value:'contains',     label:'contém' },
  { value:'not_contains', label:'não contém' },
  { value:'gt',           label:'é maior que' },
  { value:'lt',           label:'é menor que' },
]

// Operators that need a comparison value
export const OPERATORS_WITH_VALUE = ['eq','neq','contains','not_contains','gt','lt']

/**
 * Evaluate a single condition against a set of field values.
 * @param {object} condition
 * @param {object} values  - flat map { fieldId: value }
 */
export function evalCondition(condition, values) {
  const actual = values[condition.fieldId]
  const expected = condition.value

  switch (condition.operator) {
    case 'filled':
      return actual !== undefined && actual !== null && actual !== '' && actual !== false && actual !== 'false'
    case 'empty':
      return actual === undefined || actual === null || actual === '' || actual === false || actual === 'false'
    case 'eq':
      if (typeof actual === 'boolean') {
        return actual === (String(expected) === 'true')
      }
      return String(actual ?? '') === String(expected ?? '')
    case 'neq':
      if (typeof actual === 'boolean') {
        return actual !== (String(expected) === 'true')
      }
      return String(actual ?? '') !== String(expected ?? '')
    case 'contains':
      return String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase())
    case 'not_contains':
      return !String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase())
    case 'gt':
      return parseFloat(actual) > parseFloat(expected)
    case 'lt':
      return parseFloat(actual) < parseFloat(expected)
    default:
      return true
  }
}

/**
 * Evaluate all conditions for a field and return whether it should be VISIBLE.
 * @param {object} field   - the field definition (has .conditions, .conditionMode, .conditionLogic)
 * @param {object} values  - flat map { fieldId: value }
 */
export function isFieldVisible(field, values) {
  const conditions = field.conditions || []
  if (!conditions.length) return true  // no conditions = always visible

  const mode  = field.conditionMode  || 'show'  // 'show' = show when conditions met
  const logic = field.conditionLogic || 'and'   // 'and' | 'or'

  const results = conditions.map(c => evalCondition(c, values))
  const allPass = logic === 'and' ? results.every(Boolean) : results.some(Boolean)

  return mode === 'show' ? allPass : !allPass
}

/**
 * Filter a list of fields to only those that are currently visible.
 * @param {Array} fields
 * @param {object} values  - flat { fieldId: value }
 */
export function visibleFields(fields, values) {
  return (fields || []).filter(f => isFieldVisible(f, values))
}

/**
 * Create a blank condition.
 */
export function createCondition() {
  return {
    id:       `cond-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
    fieldId:  '',
    operator: 'filled',
    value:    '',
    logic:    'and',
  }
}
