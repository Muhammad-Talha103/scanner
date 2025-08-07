import { type SchemaTypeDefinition } from 'sanity'
import User from './user'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [User],
}
