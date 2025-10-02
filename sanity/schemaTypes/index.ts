import { type SchemaTypeDefinition } from 'sanity'
import User from './user'
import ForgetPassword from './forgetpassword'
import pdfDocument from './uploadpdf'
import admin from './admin'
import premiumUser from './payment'
import premium_user_ends from './premium_user_ends'
export const schema: { types: SchemaTypeDefinition[] } = {
  types: [User,ForgetPassword,pdfDocument,admin,premiumUser,premium_user_ends],
}
