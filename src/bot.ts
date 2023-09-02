import { Context, Telegraf } from 'telegraf'
import { prompt } from './gpt'
import messageStorageArray from './gpt/messageStorageArray'
import { errorHandler } from './middlewares'

const bot = new Telegraf(process.env.BOT_TOKEN!)

bot.start((ctx: Context) => ctx.reply('Hello World!'))

bot.command('clear', (ctx) => {
  messageStorageArray.clear()
  ctx.reply('Dialog cleared')
})

bot.on('text', async (ctx) => {
  const messageText = ctx.message.text
  if (messageText) {
    messageStorageArray.addMessage(messageText, 'user')

    const dialog = messageStorageArray.getDialog()

    console.log(dialog)

    const answer = await prompt(dialog)
    if (!answer) return ctx.reply('Sorry, I do not understand')
    await ctx.reply(answer)
    messageStorageArray.addMessage(answer, 'assistant')
  }
})

errorHandler(bot)

export default bot
