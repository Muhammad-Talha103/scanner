// app/api/generate-pdf/route.ts
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "scanned-document";

  try {
    const doc = new PDFDocument();
    const chunks: Uint8Array[] = [];

    // PDF chunks collect
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {});

    // PDF content
    doc.fontSize(18).text("Scanned PDF", { align: "center" });
    doc.moveDown().fontSize(12).text("This is a generated PDF file.");
    doc.end();

    // Wait until PDF finishes
    const buffer = await new Promise<Uint8Array>((resolve) => {
      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${name}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
