import { client } from "@/sanity/lib/client";

export async function uploadFileToSanity(file: File | Blob, filename: string) {
  const asset = await client.assets.upload("file", file, {
    filename,
  });

  return {
    _id: asset._id,
    url: asset.url,
    originalFilename: asset.originalFilename || filename,
  };
}
