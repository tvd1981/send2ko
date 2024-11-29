export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = query.id as string

  if (!id) {
    return sendRedirect(event, '/images/no-cover.jpg')
  }

  const db = useDrizzle()
  const ebook = await db.query.tlgEbooks.findFirst({
    where: eq(tables.tlgEbooks.id, id),
  })

  if (!ebook || !ebook.cover) {
    return sendRedirect(event, '/images/no-cover.jpg')
  }

  try {
    const imageBuffer = Buffer.from(ebook.cover, 'base64')

    if (imageBuffer.length === 0) {
      return sendRedirect(event, '/images/no-cover.jpg')
    }

    setHeader(event, 'Content-Type', 'image/jpeg')
    return imageBuffer
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch (e) {
    return sendRedirect(event, '/images/no-cover.jpg')
  }
})
