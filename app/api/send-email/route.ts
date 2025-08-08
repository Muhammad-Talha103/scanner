import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Email configuration - replace with your actual credentials
const EMAIL_CONFIG = {
  host: "smtp.gmail.com", 
  port: 465 ,
  secure: true,
  auth: {
    user: process.env.SMTP_USER, // Replace with your email
    pass: process.env.SMTP_PASS, // Replace with your app password
  },
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const to = formData.get("to") as string
    const subject = formData.get("subject") as string
    const message = formData.get("message") as string
    const attachment = formData.get("attachment") as File | null
    const pdfAttachment = formData.get("pdfAttachment") as File | null

    // Validate required fields
    if (!to || !subject) {
      return NextResponse.json({ error: "Recipient and subject are required" }, { status: 400 })
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.secure,
      auth: EMAIL_CONFIG.auth,
      logger: true,
      debug: true, // Enable debug output for troubleshooting
    })

    // Prepare attachments
    const attachments: any[] = []

    if (attachment) {
      const buffer = Buffer.from(await attachment.arrayBuffer())
      attachments.push({
        filename: attachment.name,
        content: buffer,
      })
    }

    if (pdfAttachment) {
      const buffer = Buffer.from(await pdfAttachment.arrayBuffer())
      attachments.push({
        filename: pdfAttachment.name,
        content: buffer,
        contentType: "application/pdf",
      })
    }

    // Email options
    const mailOptions = {
      from: EMAIL_CONFIG.auth.user,
      to: to,
      subject: subject,
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

    let errorMessage = "Failed to send email"
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
