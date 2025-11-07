import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

// Define the interface for the dynamic route context.
// This structure is critical for Next.js to correctly type the second argument
// of the GET function in a dynamic route handler.
interface RouteContext {
  params: {
    id: string; // Must match the folder name: [id]
  };
}

/**
 * Route Handler to fetch an asset (e.g., PDF) from Sanity by ID and serve it.
 *
 * @param req The incoming Request object (unused here, but required).
 * @param context The context object containing dynamic route parameters.
 * @returns A NextResponse containing the file buffer or an error JSON.
 */
export async function GET(
  req: Request,
  context: RouteContext
) {
  const { id } = context.params;

  // Although the route structure ensures an ID exists, this check adds safety.
  if (!id) {
    return NextResponse.json({ error: "Invalid file request: ID is missing" }, { status: 400 });
  }

  try {
    // 1. Fetch asset metadata from Sanity, including mimeType for robust content delivery.
    const asset = await client.fetch(
      `*[_id == $id][0]{url, originalFilename, mimeType}`,
      { id }
    );

    if (!asset?.url) {
      return NextResponse.json({ error: "File not found in Sanity" }, { status: 404 });
    }

    // 2. Fetch the actual file content using the Sanity asset URL
    const fileRes = await fetch(asset.url);
    if (!fileRes.ok) {
      console.error(`Failed to fetch file from URL. Status: ${fileRes.status}`);
      throw new Error(`Failed to fetch file, status: ${fileRes.status}`);
    }

    // 3. Read the file content into an ArrayBuffer
    const buffer = await fileRes.arrayBuffer();

    // Determine Content-Type and Filename, using fallbacks if Sanity data is missing.
    const contentType = asset.mimeType || "application/octet-stream";
    const filename = asset.originalFilename || "document";

    // 4. Return the binary file as a NextResponse.
    // Converting ArrayBuffer to a Node.js Buffer is the most reliable way 
    // to pass binary data to NextResponse in the default Node.js runtime.
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": contentType,
        // 'inline' means display in the browser. Use 'attachment' to force a download.
        "Content-Disposition": `inline; filename="${filename}"`,
        // Recommended Cache control for static assets
        "Cache-Control": "public, max-age=31536000, immutable", 
      },
    });

  } catch (error) {
    console.error("Route Handler Error:", error);
    return NextResponse.json({ error: "Server error fetching file" }, { status: 500 });
  }
}