'use client'

import ClientHttp, { fetcher } from '@/http/http'
import { Chat, Message } from '@prisma/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useLayoutEffect, useState } from 'react'
import useSWR from 'swr'
import useSWRSubscription from 'swr/subscription'
import { PlusIcon } from './components/PlusIcon'
import { MessageIcon } from './components/MessageIcon'
import { ArrowRightIcon } from './components/ArrowRightIcon'
import { ChatItemError } from './components/ChatItemError'
import { ChatItem } from './components/ChatItem'
import { LogoutIcon } from './components/LogoutIcon'
import { signOut } from 'next-auth/react'

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
      if (textarea.scrollHeight >= 200) {
        textarea.style.overflowY = 'scroll'
      } else {
        textarea.style.overflowY = 'hidden'
        textarea.style.height = 'auto'
        textarea.style.height = textarea.scrollHeight + 'px'
      }
    })
  }, [])

  useLayoutEffect(() => {
    if (!messageLoading) {
      return
    }
    const chatting = document.querySelector('#chatting') as HTMLUListElement
    chatting.scrollTop = chatting.scrollHeight
  }, [messageLoading])

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

  async function logout() {
    await signOut({ redirect: false })
    const { url: logoutUrl } = await ClientHttp.get(
      `logout-url?${new URLSearchParams({ redirect: window.location.origin })}`
    )
    window.location.href = logoutUrl
  }

  return (
    <div className="overflow-hidden w-full h-full relative flex">
      <aside className="bg-gray-900 w-72 flex h-screen flex-col p-2">
        <button
          className="flex p-3 gap-3 rounded hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm mb-1 border border-white/20"
          type="button"
          onClick={() => {
            route.push('/')
            setChatId(null)
            setMessageId(null)
          }}
        >
          <PlusIcon className="w-5 h-5" />
          New chat
        </button>
        <div className="flex-grow overflow-y-auto -mr-2 overflow-hidden">
          {chats!.map((chat) => (
            <div className="pb-2 text-gray-100 text-sm mr-2" key={chat.id}>
              <button
                className="flex p-3 gap-3 rounded hover:bg-[#3f4679] cursor-pointer hover:pr-4 group w-full"
                onClick={() => route.push(`/?id=${chat.id}`)}
              >
                <MessageIcon className="h-5 w-5" />
                <div className="max-h-5 overflow-hidden break-all relative w-full text-left">
                  {chat.messages[0].content}
                  <div className="absolute inset-y-0 right-0 w-8 z-10 bg-gradient-to-l from-gray-900 group-hover:from-[#3f4679]"></div>
                </div>
              </button>
            </div>
          ))}
        </div>
        <button
          className="flex p-3 mt-1 gap-3 rounded hover:bg-gray-500/10 text-sm text-white"
          onClick={() => logout()}
        >
          <LogoutIcon className="h-5 w-5" />
          Log out
        </button>
      </aside>
      <div className="flex-1 flex-col relative">
        <ul id="chatting" className="h-screen overflow-y-auto bg-gray-800">
          {messages!.map((message) => (
            <ChatItem
              key={message.id}
              content={message.content}
              is_from_bot={message.is_from_bot}
            />
          ))}
          {messageLoading && (
            <ChatItem
              content={messageLoading}
              is_from_bot={true}
              loading={true}
            />
          )}
          {errorMessageLoading && (
            <ChatItemError>{errorMessageLoading}</ChatItemError>
          )}
        </ul>
        <div className="absolute bottom-0 w-full !bg-transparent bg-gradient-to-b from-gray-800 to-gray-950">
          <div className="mb-6 mx-auto max-w-[90%]">
            <form id="form" onSubmit={handleSubmit}>
              <div className="flex flex-col py-3 pl-4 relative text-white bg-gray-700 rounded">
                <textarea
                  id="message"
                  tabIndex={0}
                  rows={1}
                  placeholder="Digite sua pergunta"
                  className="resize-none pr-14 bg-transparent pl-0 outline-none"
                ></textarea>
                <button
                  type="submit"
                  className="absolute top-1 text-gray-400 bottom-2.5 rounded hover:text-gray-400 hover:bg-gray-900 md:right-4"
                  disabled={messageLoading}
                >
                  <ArrowRightIcon className="text-white-500 w-8" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
