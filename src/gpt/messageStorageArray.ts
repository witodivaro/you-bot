export interface Message {
  content: string
  role: string
}

class MessageStorageService {
  private messages: Message[] = []
  addMessage(content: string, role: string): void {
    this.messages.push({ content, role })
  }
  getDialog(): Message[] {
    return this.messages
  }

  clear(): void {
    this.messages = []
  }
}

export default new MessageStorageService()
