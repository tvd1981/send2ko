export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = query.id as string
  
  if (!id) {
    console.log('Missing ID')
    return sendRedirect(event, '/images/no-cover.jpg')
  }

  const db = useDrizzle()
  const ebook = await db.query.tlgEbooks.findFirst({
    where: eq(tables.tlgEbooks.id, id)
  })

  if (!ebook) {
    console.log('Ebook not found:', id)
    return sendRedirect(event, '/images/no-cover.jpg')
  }

  if (!ebook.cover) {
    console.log('Cover is null for ebook:', id)
    return sendRedirect(event, '/images/no-cover.jpg')
  }

  try {
    console.log('Cover data length:', ebook.cover.length)
    console.log('Cover data preview:', ebook.cover.substring(0, 50))
    
    const imageBuffer = Buffer.from(ebook.cover, 'base64')
    console.log('Buffer length:', imageBuffer.length)
    
    if (imageBuffer.length === 0) {
      console.error('Empty image buffer')
      return sendRedirect(event, '/images/no-cover.jpg')
    }

    setHeader(event, 'Content-Type', 'image/jpeg')
    return imageBuffer
  } catch (error) {
    console.error('Error processing cover image:', error)
    console.error('Cover type:', typeof ebook.cover)
    return sendRedirect(event, '/images/no-cover.jpg')
  }
}) 