import { NextResponse } from "next/server"
import twilio from "twilio"
import nodemailer from "nodemailer"

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json()

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Número y código requeridos" },
        { status: 400 }
      )
    }

    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({
        to: phone,
        code: code,
      })

    if (verificationCheck.status === "approved") {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      })

      await transporter.sendMail({
        from: `"CUChatNet Sistema" <${process.env.EMAIL_USER}>`,
        to: "andrey.ac1397@gmail.com",
        subject: "Nuevo cliente registrado en CUChatNet",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2563eb;">Nuevo Cliente Registrado</h2>
            <p>Se ha verificado correctamente un nuevo número de cliente en el sistema.</p>
            <p><strong>Número:</strong> ${phone}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
            <hr />
            <p style="font-size: 12px; color: gray;">
              Este es un mensaje automático del sistema CUChatNet.
            </p>
          </div>
        `,
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { success: false },
      { status: 400 }
    )
  } catch (error) {
    console.error("ERROR COMPLETO:", error)
    return NextResponse.json(
      { error: "Código inválido o error en verificación" },
      { status: 500 }
    )
  }
}