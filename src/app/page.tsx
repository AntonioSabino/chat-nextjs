'use client'

import ClientHttp, { fetcher } from '@/http/http'
import { Chat, Message } from '@prisma/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import useSWR from 'swr'

type ChatWithFirstMessage = Chat & {
  messages: [Message]
}

export default function Home() {
  const route = useRouter()
  const chatIdParam = useSearchParams().get('id')
  const [chatId, setChatId] = useState<string | null>(chatIdParam)

  const { data: chats, mutate: mutateChats } = useSWR<ChatWithFirstMessage[]>(
    'chats',
    fetcher,
    {
      fallbackData: [],
      revalidateOnFocus: false
    }
  )

  const { data: messages, mutate: mutateMessages } = useSWR<Message[]>(
    chatId ? `chats/${chatId}/messages` : null,
    fetcher,
    {
      fallbackData: [],
      revalidateOnFocus: false
    }
  )

  useEffect(() => {
    setChatId(chatIdParam)
  }, [chatIdParam])

  useEffect(() => {
    const textarea = document.querySelector('#message') as HTMLTextAreaElement
    textarea.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
      }
    })
    textarea.addEventListener('keyup', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        const form = document.querySelector('#form') as HTMLFormElement
        const submitButton = form.querySelector('button') as HTMLButtonElement
        form.requestSubmit(submitButton)
        return
      }
    })
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const textarea = event.currentTarget.querySelector(
      '#message'
    ) as HTMLTextAreaElement
    const message = textarea.value

    if (!chatId) {
      const newChat: ChatWithFirstMessage = await ClientHttp.post('chats', {
        message
      })
      mutateChats((prev) => [newChat, ...prev!], false)
      setChatId(newChat.id)
    } else {
      const newMessage: Message = await ClientHttp.post(
        `chats/${chatId}/messages`,
        { message }
      )
      mutateMessages((prev) => [...prev!, newMessage], false)
    }

    textarea.value = ''
  }

  return (
    <div className="flex gap-5">
      <aside className="flex flex-col">
        Barra lateral
        <button type="button" onClick={() => route.push('/')}>
          New chat
        </button>
        <ul>
          {chats!.map((chat) => (
            <li key={chat.id} onClick={() => route.push(`/?id=${chat.id}`)}>
              {chat.messages[0]?.content}
            </li>
          ))}
        </ul>
      </aside>
      <div>
        Centro
        <ul>
          {messages!.map((message) => (
            <li key={message.id}>{message.content}</li>
          ))}
        </ul>
        <form onSubmit={handleSubmit} id="form">
          <textarea id="message" placeholder="Digire sua pergunta"></textarea>
          <button type="submit">Enviar</button>
        </form>
      </div>
    </div>
  )
}
