'use client'

import ClientHttp, { fetcher } from '@/http/http'
import { Chat, Message } from '@prisma/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import useSWR from 'swr'
import useSWRSubscription from 'swr/subscription'

type ChatWithFirstMessage = Chat & {
  messages: [Message]
}

export default function Home() {
  const route = useRouter()
  const chatIdParam = useSearchParams().get('id')
  const [chatId, setChatId] = useState<string | null>(chatIdParam)
  const [messageId, setMessageId] = useState<string | null>(null)

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

  const { data: messageLoading, error: errorMessageLoading } =
    useSWRSubscription(
      messageId ? `/api/messages/${messageId}/events` : null,
      (path: string, { next }) => {
        console.log('init event source')
        const eventSource = new EventSource(path)
        eventSource.onmessage = (event) => {
          console.log('on message', event)
          const newMessage = JSON.parse(event.data)
          next(null, newMessage.content)
        }
        eventSource.onerror = (event) => {
          console.log('on error', event)
          eventSource.close()
          // @ts-ignore
          const err = event.data
          next(err, null)
        }
        eventSource.addEventListener('end', (event) => {
          console.log('on end', event)
          eventSource.close()
          const newMessage = JSON.parse(event.data)
          mutateMessages((prev) => [...prev!, newMessage], false)
          next(null, null)
        })
        return () => {
          console.log('close event source')
          eventSource.close()
        }
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
      setMessageId(newChat.messages[0].id)
    } else {
      const newMessage: Message = await ClientHttp.post(
        `chats/${chatId}/messages`,
        { message }
      )
      mutateMessages((prev) => [...prev!, newMessage], false)
      setMessageId(newMessage.id)
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
          {messageLoading && <li>{messageLoading}</li>}
          {errorMessageLoading && <li>{errorMessageLoading}</li>}
        </ul>
        <form onSubmit={handleSubmit} id="form">
          <textarea id="message" placeholder="Digire sua pergunta"></textarea>
          <button type="submit">Enviar</button>
        </form>
      </div>
    </div>
  )
}
