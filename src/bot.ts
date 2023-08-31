import { Context, Telegraf } from 'telegraf'
import { prompt } from './gpt'
import { errorHandler } from './middlewares'

const bot = new Telegraf(process.env.BOT_TOKEN!)

bot.start((ctx: Context) => ctx.reply('Hello World!'))

bot.on('text', async (ctx) => {
  const messageText = ctx.message.text
  if (messageText) {
    const answer = await prompt(messageText)
    if (!answer) return ctx.reply('Sorry, I do not understand')
    ctx.reply(answer)
  }
})

errorHandler(bot)

export default bot
