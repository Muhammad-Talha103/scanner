import { NextRequest, NextResponse } from "next/server"

import {client} from "@/sanity/lib/client"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("pdfFile") as File

    if (!file) throw new Error("No file uploaded")

    const buffer = Buffer.from(await file.arrayBuffer())

    const asset = await client.assets.upload("file", buffer, { filename: file.name })

    return NextResponse.json({ url: asset.url })
  } catch (err : unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
