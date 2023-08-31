import openai from './openAi'

export const prompt = async (prompt: string): Promise<string | null> => {
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-3.5-turbo',
  })

  return completion.choices[0].message.content
}
