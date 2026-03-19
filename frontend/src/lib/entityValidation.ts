import * as v from 'valibot'
import { entityConfig } from '@/config/entity'

export function buildAssetValidationSchema() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schema: Record<string, any> = {}

  for (const field of entityConfig.fields) {
    if (field.enabled === false) continue

    switch (field.type) {
      case 'string':
      case 'autocomplete':
        if (field.required) {
          schema[field.key] = v.pipe(
            v.string(),
            v.trim(),
            v.nonEmpty(`${field.label}不能为空`)
          )
        } else {
          schema[field.key] = v.optional(v.string())
        }
        break
      case 'number':
        if (field.required) {
          schema[field.key] = v.pipe(
            v.union([v.string(), v.number()]),
            v.transform((val) => typeof val === 'string' ? parseFloat(val) : val),
            v.number(),
            v.minValue(0)
          )
        } else {
          schema[field.key] = v.optional(v.pipe(
            v.union([v.string(), v.number(), v.undefined()]),
            v.transform((val) => val === undefined || val === '' ? undefined : (typeof val === 'string' ? parseFloat(val) : val)),
            v.optional(v.number())
          ))
        }
        break
      case 'date':
        schema[field.key] = v.optional(v.string())
        break
      case 'select':
        schema[field.key] = v.optional(v.string())
        break
      case 'textarea':
        schema[field.key] = v.optional(v.string())
        break
    }
  }

  return v.object(schema)
}

export const AssetFormSchema = buildAssetValidationSchema()
export type AssetFormData = v.InferOutput<typeof AssetFormSchema>
