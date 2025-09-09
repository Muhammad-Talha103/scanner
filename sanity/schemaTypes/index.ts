import { type SchemaTypeDefinition } from 'sanity'
import User from './user'
import ForgetPassword from './forgetpassword'
import pdfDocument from './uploadpdf'
import admin from './admin'
export const schema: { types: SchemaTypeDefinition[] } = {
  types: [User,ForgetPassword,pdfDocument,admin],
}
