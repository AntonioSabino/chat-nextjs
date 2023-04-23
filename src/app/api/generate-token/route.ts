import { NextRequest, NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const user = {
    name: 'admin',
    sub: body.user_id ?? '5eafff78-8ef9-45e2-96f3-800d485d902b'
  }

  const secret = process.env.NEXTAUTH_SECRET as string

  const token = await encode({
    secret,
    token: user,
    maxAge: 30 * 24 * 60 * 60 * 1000
  })
  return NextResponse.json({ token })
}
