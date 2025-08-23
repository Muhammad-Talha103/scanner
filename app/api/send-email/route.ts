// app/api/send-email/route.ts

import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import type { Attachment } from "nodemailer/lib/mailer"

export const config = {
  api: {
    bodyParser: false, // Disable default body parsing
  },
}

export const runtime = "nodejs" // Required to use Node APIs like nodemailer

const EMAIL_CONFIG = {
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "talhagp908@gmail.com", // Your Gmail address
    pass: "txjo bvhn cpmr cwyb",   // Your Gmail App Password
  },
}

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData()

    const to = formData.get("to") as string
    const subject = formData.get("subject") as string
    const message = formData.get("message") as string

    const attachment = formData.get("attachment") as File | null
    const pdfAttachment = formData.get("pdfAttachment") as File | null

    if (!to || !subject) {
      return NextResponse.json(
        { error: "Recipient and subject are required" },
        { status: 400 }
      )
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.secure,
      auth: EMAIL_CONFIG.auth,
    })

    // Prepare attachments
    const attachments: Attachment[] = []

    if (attachment) {
      const buffer = Buffer.from(await attachment.arrayBuffer())

      if (buffer.length > 25 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Attachment too large (Max 25MB allowed)" },
          { status: 400 }
        )
      }

      attachments.push({
        filename: attachment.name,
        content: buffer,
      })
    }

    if (pdfAttachment) {
      const buffer = Buffer.from(await pdfAttachment.arrayBuffer())

      if (buffer.length > 25 * 1024 * 1024) {
        return NextResponse.json(
          { error: "PDF too large (Max 25MB allowed)" },
          { status: 400 }
        )
      }

      attachments.push({
        filename: pdfAttachment.name,
        content: buffer,
        contentType: "application/pdf",
      })
    }

    // Build email
    const mailOptions = {
      from: EMAIL_CONFIG.auth.user,
      to,
      subject,
      text: message || "No message provided",
      html: message ? `<p>${message.replace(/\n/g, "<br>")}</p>` : "<p>No message provided</p>",
      attachments: attachments.length > 0 ? attachments : undefined,
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: "Email sent successfully",
    })
  } catch (error) {
    console.error("Email sending error:", error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 }
    )
  }
}
