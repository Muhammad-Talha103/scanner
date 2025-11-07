import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

interface Props {
  params: { id: string };
}

export async function GET(req: Request, { params }: Props) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Invalid file request" }, { status: 400 });
  }

  try {
    const asset = await client.fetch(
      `*[_id == $id][0]{url, originalFilename}`,
      { id }
    );

    if (!asset?.url) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileRes = await fetch(asset.url);
    if (!fileRes.ok) throw new Error("Failed to fetch file");

    const buffer = await fileRes.arrayBuffer();

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${asset.originalFilename || "document.pdf"}"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error fetching file" }, { status: 500 });
  }
}
