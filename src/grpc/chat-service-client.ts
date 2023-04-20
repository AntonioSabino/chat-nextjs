import { chatClient } from './client'
import { ChatServiceClient as GrpcChatServiceClient } from './rpc/pb/ChatService'

interface ChatStreamData {
  chat_id?: string
  user_id: string
  message: string
}

export class ChatServiceClient {
  constructor(private readonly chatClient: GrpcChatServiceClient) {}

  chatStream(data: ChatStreamData) {
    const stream = this.chatClient.chatStream({
      chatId: data.chat_id,
      userId: data.user_id,
      userMessage: data.message
    })
    stream.on('data', (data) => {
      console.log('chatStream data', data)
    })
    stream.on('error', (error) => {
      console.log('chatStream error', error)
    })
    stream.on('end', () => {
      console.log('chatStream end')
    })
  }
}

export class ChatServiceClientFactory {
  static create() {
    return new ChatServiceClient(chatClient)
  }
}
