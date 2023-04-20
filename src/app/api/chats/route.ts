import { prisma } from '@/app/prisma/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const chatCreated = await prisma.chat.create({
    data: {}
  })

  return NextResponse.json(chatCreated)
}

export async function GET(_request: NextRequest) {
  const chats = await prisma.chat.findMany({
    orderBy: {
      created_at: 'desc'
    }
  })

  return NextResponse.json(chats)
}
