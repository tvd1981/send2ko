import { Bot, webhookCallback, InlineKeyboard, InputFile } from 'grammy'
import type { User } from 'grammy/types'
import type { Context } from 'grammy'
import { hashids, getFileName, saveEbookInfo, extractURLFromText, summaryYoutubeVideo } from './common'
import type { YouTubeEpubResult } from './common'
import { useRuntimeConfig } from '#imports'

const config = useRuntimeConfig()

const processingMessages = new Set<string>();

export const bot = new Bot(config.telegramBotToken)

async function handleUserResponse(userId: string) {
  try {
    const db = useDrizzle()
    const user = await db.query.tlgUsers.findFirst({
      where: eq(tables.tlgUsers.id, Number(userId)),
    })
    const { id2 } = user || {}
    const opdsUrl = `${config.public.baseUrl}/api/ebooks/opds?pk=${id2}`
    const koboWebUrl = `${config.public.baseUrl}/web?pk=${id2}`
    const editUrl = `${config.public.baseUrl}/edit?pk=${id2}`
    const supportLink = config.public.supportLink

    // Tạo keyboard cơ bản
    const keyboard = new InlineKeyboard()
      .url('Edit the uploaded list', editUrl)

    // Chỉ thêm nút support nếu có supportLink
    if (supportLink) {
      keyboard.row().url('Support group', supportLink)
    }

    return {
      text: 'Welcome! 📚\n\n'
        + 'The bot supports file formats:\n'
        + '- PDF (.pdf)\n'
        + '- EPUB (.epub)\n'
        + '- MOBI (.mobi)\n'
        + '- AZW3 (.azw3)\n\n'
        + 'Maximum file size: 20MB\n\n'
        + `OPDS: ${opdsUrl}\n`
        + `Kobo web: ${koboWebUrl}\n\n`
        + 'Choose a function:',
      keyboard,
    }
  }
  catch (error) {
    console.error('Error:', error)
    return {
      text: 'Sorry, something went wrong. Please try again later.',
      keyboard: null,
    }
  }
}

async function handleCommonResponse(ctx: Context) {
  const userId = ctx.message?.from.id
  await upsertTelegramUser(ctx.message?.from)
  const url = extractURLFromText(ctx?.message?.text || '')
  if (url) {
    // Create a unique key for this message
    const messageKey = `${ctx.chat?.id}-${ctx.message?.message_id}`;
    
    // Check if already processing
    if (processingMessages.has(messageKey)) {
      return;
    }

    try {
      // Mark as processing
      processingMessages.add(messageKey);
      
      const statusMsg = await ctx.reply('Processing...')
      
      // Add timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), 300000); // 5 minutes timeout
      });

      let rs: YouTubeEpubResult | undefined;
      try {
        const result = await Promise.race([
          summaryYoutubeVideo(url, ctx, statusMsg),
          timeoutPromise
        ]);
        
        // Type guard to check if result has the expected properties
        rs = result && typeof result === 'object' && 'title' in result && 'epubBuffer' in result 
          ? result as YouTubeEpubResult 
          : undefined;
      } catch (error) {
        console.error('Error in YouTube video summary:', error);
        rs = undefined;
      }

      if (rs) {
        try {
          await ctx.api.editMessageText(
            statusMsg.chat.id,
            statusMsg.message_id,
            'Uploading EPUB...'
          )
          const doc = await ctx.replyWithDocument(new InputFile(rs.epubBuffer, `${rs.title}.epub`))
          
          const db = useDrizzle()
          await db.insert(tables.tlgFiles).values({
            id: doc.document.file_id,
            userId: ctx?.from?.id,
            name: `${rs.title}.epub`,
            mimeType: 'application/epub+zip',
            size: doc.document.file_size,
            createdAt: new Date(),
          })

          await ctx.api.editMessageText(
            statusMsg.chat.id,
            statusMsg.message_id,
            `✅ Successfully uploaded "${rs.title}.epub" and added to your list!`
          )
        }
        catch (error) {
          console.error('Error in upload epub:', error)
          await ctx.reply('❌ Sorry, something went wrong. Please try again!')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      await ctx.reply('❌ Operation failed or timed out. Please try again.')
    } finally {
      // Remove from processing set when done
      processingMessages.delete(messageKey);
    }
  }
  else {
    const response = await handleUserResponse(userId!.toString())
    await ctx.reply(response.text, response.keyboard
      ? {
        reply_markup: response.keyboard,
      }
      : undefined)
  }
}

// Command handlers
bot.command('start', async (ctx) => {
  await handleCommonResponse(ctx)
})

// bot.on('message::url', async (ctx) => {
//   const url = extractURLFromText(ctx.message.text || '')
//   if (url) {
//     const videoId = extractYouTubeID(url)
//     if (videoId) {
//       try {
//         const data = await fetchTranscript(url)
//         const summary = await summaryContent(data.fullTranscript, url)
//         await ctx.reply(summary)

//         // Fetch thumbnail image
//         let coverBuffer: Buffer | undefined
//         if (data.thumbnail) {
//           const response = await fetch(data.thumbnail)
//           coverBuffer = Buffer.from(await response.arrayBuffer())
//         }

//         // Generate and send epub
//         const generator = new EpubGenerator({
//           title: data.title,
//           author: data.author || 'Unknown',
//           language: 'en',
//           identifier: videoId,
//           description: data.shortDescription,
//           ...(coverBuffer && {
//             cover: {
//               id: 'cover',
//               data: coverBuffer,
//               mimeType: 'image/jpeg'
//             }
//           })
//         })

//         generator.addChapter({
//           id:`noi-dung-${Date.now()}`,
//           title: 'Nội dung',
//           content: summary,
//         })
//         const epubBuffer = await generator.generate()
//         const doc = await ctx.replyWithDocument(new InputFile(epubBuffer, `${data.title}.epub`))

//         const db = useDrizzle()
//         await db.insert(tables.tlgFiles).values({
//           id: doc.document.file_id,
//           userId: ctx.from.id,
//           name: `${data.title}.epub`,
//           mimeType: 'application/epub+zip',
//           size: doc.document.file_size,
//           createdAt: new Date(),
//         })
//         await ctx.reply('✅ Successfully added to your list!')
//       }
//       catch (error) {
//         console.error('Error:', error)
//         await ctx.reply('❌ Sorry, something went wrong. Please try again!')
//       }
//     }
//   }
// })

bot.on('message:text', async (ctx) => {
  await handleCommonResponse(ctx)
})

// Xử lý webhook
export const handleUpdate = webhookCallback(bot, 'cloudflare')

// Handler cho nút view_info
// bot.callbackQuery('view_info', async (ctx) => {
//   const user = ctx.from
//   const fullName = user.first_name + ' ' + user.last_name
//   await ctx.reply(`Đây là thông tin của bạn..., ${user.id}, ${user.username}, ${fullName}`)
// })

const SUPPORTED_MIMES = [
  'application/pdf',
  'application/epub+zip',
  'application/x-mobipocket-ebook',
  'application/vnd.amazon.ebook',
]

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB in bytes

bot.on('message:document', async (ctx) => {
  const doc = ctx.message.document

  // Kiểm tra xem message có phải là forward không
  const isForwarded = Boolean((ctx.message as any).forward_from || (ctx.message as any).forward_from_chat)
  if (isForwarded) {
    await ctx.reply('❌ Sorry, this bot does not support forwarded messages.')
    return
  }

  if (!SUPPORTED_MIMES.includes(doc.mime_type || '')) {
    await ctx.reply(
      '❌ The bot only supports the following formats:\n'
      + '- PDF (.pdf)\n'
      + '- EPUB (.epub)\n'
      + '- MOBI (.mobi)\n'
      + '- AZW3 (.azw3)',
    )
    return
  }

  // Kiểm tra dung lượng file
  if (doc.file_size && doc.file_size > MAX_FILE_SIZE) {
    await ctx.reply('❌ The uploaded file is larger than the allowed 20MB')
    return
  }

  try {
    const db = useDrizzle()
    const fileName = getFileName(doc.file_name || 'unknown')

    await db.insert(tables.tlgFiles).values({
      id: doc.file_id,
      userId: ctx.from.id,
      name: fileName,
      mimeType: doc.mime_type || 'application/octet-stream',
      size: doc.file_size || 0,
      createdAt: new Date(),
    })
    await ctx.reply('✅ Successfully added to your list!')
    if (doc.file_id && doc.mime_type) {
      const ebookId = await saveEbookInfo(doc.file_id, doc.mime_type, fileName)
      if (ebookId) {
        await db.update(tables.tlgFiles).set({
          ebookId,
        }).where(eq(tables.tlgFiles.id, doc.file_id))
      }
    }
  }
  catch (error) {
    console.error('Error saving file:', error)
    // await ctx.reply('❌ Sorry, something went wrong. Please try again!')
  }
})

async function upsertTelegramUser(from: User | undefined) {
  try {
    if (!from) return
    const db = useDrizzle()

    // Kiểm tra user đã tồn tại chưa
    const existingUser = await db.query.tlgUsers.findFirst({
      where: eq(tables.tlgUsers.id, from.id),
    })

    // Chỉ insert nếu user chưa tồn tại
    if (!existingUser) {
      const fullName = [from.first_name, from.last_name]
        .filter(name => name !== undefined)
        .join(' ').trim()

      const id2 = hashids.encode(from.id)

      await db.insert(tables.tlgUsers).values({
        id: from.id,
        id2,
        fullName,
        username: from.username || null,
        languageCode: from.language_code || null,
        settings: {
          web: 20,
          opds: 20,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }
  catch (error) {
    console.error('Error inserting telegram user:', error)
  }
}
