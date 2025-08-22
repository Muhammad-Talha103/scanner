import { type SchemaTypeDefinition } from 'sanity'
import User from './user'
import ForgetPassword from './forgetpassword'
export const schema: { types: SchemaTypeDefinition[] } = {
  types: [User,ForgetPassword],
}
