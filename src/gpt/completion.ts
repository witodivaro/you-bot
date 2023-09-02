import { Message } from './messageStorage'
import openai from './openAi'

export const prompt = async (dialog: Message[]): Promise<string | null> => {
  const completion = await openai.chat.completions.create({
    // @ts-ignore
    messages: dialog,
    model: 'ft:gpt-3.5-turbo-0613:personal::7tiSTlO8',
  })

  return completion.choices[0].message.content
}
