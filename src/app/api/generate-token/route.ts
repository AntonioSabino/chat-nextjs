import { NextRequest, NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const user = {
    name: 'admin',
    sub: body.user_id ?? '55fe915b-0c7e-4f4f-ac27-3c1ad7815bb3'
  }

  const secret = process.env.NEXTAUTH_SECRET as string

  const token = await encode({
    secret,
    token: user,
    maxAge: 30 * 24 * 60 * 60 * 1000
  })
  return NextResponse.json({ token })
}
