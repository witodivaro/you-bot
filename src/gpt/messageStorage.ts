export interface Message {
  content: string
  role: string
  replyTo?: number
}

class MessageStorageService {
  private messages: { [id: number]: Message } = {}
  private contextLimit = Infinity

  addMessage(
    id: number,
    content: string,
    role: string,
    replyTo?: number,
  ): void {
    if (Object.keys(this.messages).length > this.contextLimit) {
      this.messages = {}
    }
    this.messages[id] = {
      content,
      role,
      replyTo: replyTo ? replyTo : undefined,
    }
  }

  getDialog(id: number): Message[] {
    const message = this.messages[id]
    if (!message) return []
    const { content, role } = message
    const dialog = [{ content, role }]

    if (message.replyTo) {
      dialog.unshift(...this.getDialog(message.replyTo))
    }

    return dialog
  }
}

export default new MessageStorageService()
