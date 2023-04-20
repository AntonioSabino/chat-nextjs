import { prisma } from '@/app/prisma/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const messages = await prisma.message.findMany({
    where: {
      chat_id: params.chatId
    },
    orderBy: {
      created_at: 'asc'
    }
  })

  return NextResponse.json(messages)
}
