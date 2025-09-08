import { client } from "./client"

// helper: upload file (pdf ya koi aur) and return url
export const uploadFileToSanity = async (file: Blob | File, filename: string): Promise<string> => {
  const asset = await client.assets.upload("file", file, { filename })
  return asset.url
}
