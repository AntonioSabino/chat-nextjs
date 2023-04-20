import { chatClient } from './client'
import { ChatServiceClient as GrpcChatServiceClient } from './rpc/pb/ChatService'
import { Metadata } from '@grpc/grpc-js'

interface ChatStreamData {
  chat_id?: string
  user_id: string
  message: string
}

export class ChatServiceClient {
  private readonly authorization = '123456'
  constructor(private readonly chatClient: GrpcChatServiceClient) {}

  chatStream(data: ChatStreamData) {
    const metadata = new Metadata()
    metadata.set('authorization', this.authorization)

    const stream = this.chatClient.chatStream(
      {
        chatId: data.chat_id,
        userId: data.user_id,
        userMessage: data.message
      },
      metadata
    )
    stream.on('data', (data) => {
      console.log('chatStream data', data)
    })
    stream.on('error', (error) => {
      console.log('chatStream error', error)
    })
    stream.on('end', () => {
      console.log('chatStream end')
    })

    return stream
  }
}

export class ChatServiceClientFactory {
  static create() {
    return new ChatServiceClient(chatClient)
  }
}
