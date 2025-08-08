import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // Set to false if statically generating pages, using ISR or tag-based revalidation
  token:"skcuVbXrIvwREVUFG1Ll2foc2XSe81NpREOWHQLLOeBhd0X3JuSkIW9raOxXfEzLvwfAUfhqoX9itD63H1MVzt4mXERI9Vk22csaiR52D5ac0IRUCQqH4QFL4VndyPMXJSwttWpq4MS1ExsjParQualNKzxwqUU2ANLR81S2zkDoBbodKNRr"
})
