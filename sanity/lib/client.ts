import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // Set to false if statically generating pages, using ISR or tag-based revalidation
  token:"sklkNShR2xMGdQNdA5zeCEiSfqZAmT7N2o5hCqrJmVFc7p4icwgcZts9J0fu5GZHSfak6TroknK1GH01nWw7SmGxfSc7I49Sj4nUnhobIDbBeqTtuuCR4KRXJpg2CWySt7RnHtFmVbWfDAptYASfYwuWGP1jmNAiW2wzlzfT3ZSBul44E6oB"
})
