import { bot } from '../../utils/bot'
export default defineEventHandler(async event => {
  const update = await readBody(event)
  await bot.init()
  await bot.handleUpdate(update)
  return { status: 'ok' }
})
