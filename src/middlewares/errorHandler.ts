import { Context, Telegraf } from 'telegraf'

export function errorHandler(bot: Telegraf<Context>) {
  bot.catch((err: any, ctx: Context) => {
    console.error(`Error for ${ctx.updateType}`, err)
  })
}
