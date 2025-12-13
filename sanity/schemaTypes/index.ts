import { type SchemaTypeDefinition } from 'sanity'
import User from './user'
import ForgetPassword from './forgetpassword'
import pdfDocument from './uploadpdf'
import admin from './admin'
import premiumUser from './payment'
import Expired_premiumUser from './premium_end' 
import downloadMapping from './downloadMapping'
import paymentRecord from './paymentRecords'
export const schema: { types: SchemaTypeDefinition[] } = {
  types: [User,ForgetPassword,pdfDocument,admin,premiumUser,Expired_premiumUser,downloadMapping,paymentRecord],
}
