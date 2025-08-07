
import { client } from '@/sanity/lib/client'

export interface SanityUser {
  _id: string; // ✅ Required
  username: string;
  email: string;
  userpassword: string;
  createdAt: string;
}

export interface Userr {
  id: string ;
  serial: number;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}


const query = `*[_type == "user"] | order(createdAt desc) {
  _id,
  username,
  email,
  userpassword,
  createdAt
}`

export async function fetchUsers(): Promise<SanityUser[]> {
  return await client.fetch(query)
}
