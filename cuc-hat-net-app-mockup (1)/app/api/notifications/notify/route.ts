import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  const { message } = await req.json()

  try {

    console.log("EMAIL_USER:", process.env.EMAIL_USER)
    console.log("EMAIL_PASS:", process.env.EMAIL_PASS)

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'admin@email.com',
      subject: 'Nueva acción en CUChatNet',
      text: message,
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("ERROR COMPLETO:", error)
    return NextResponse.json(
      { error: 'Error enviando correo' },
      { status: 500 }
    )
  }
}
