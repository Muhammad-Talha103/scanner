import { NextResponse } from "next/server"
import { client } from "@/sanity/lib/client"

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }, // params is now async and must be awaited
) {
  const { id } = await context.params

  if (!id) {
    return NextResponse.json({ error: "Invalid file request: ID is missing" }, { status: 400 })
  }

  try {
    // Fetch asset metadata from Sanity
    const asset = await client.fetch(`*[_id == $id][0]{url, originalFilename, mimeType}`, { id })

    if (!asset?.url) {
      return NextResponse.json({ error: "File not found in Sanity" }, { status: 404 })
    }

    const fileRes = await fetch(asset.url)
    if (!fileRes.ok) throw new Error(`Failed to fetch file, status: ${fileRes.status}`)

    const buffer = await fileRes.arrayBuffer()
    const contentType = asset.mimeType || "application/pdf"
    const filename = asset.originalFilename || "document.pdf"

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (err) {
    console.error("PDF Route Error:", err)
    return NextResponse.json({ error: "Server error fetching file" }, { status: 500 })
  }
}
