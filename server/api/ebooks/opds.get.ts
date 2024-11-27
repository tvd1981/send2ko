import { desc } from 'drizzle-orm'
import { Builder } from 'xml2js'
const xmlBuilder = new Builder()

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const pk = query.pk as string
    
    if (!pk) {
      throw createError({
        statusCode: 400,
        message: 'Missing pk parameter'
      })
    }

    const userId = hashids.decode(pk)[0] as number
    
    if (!userId) {
      throw createError({
        statusCode: 400,
        message: 'Invalid pk'
      })
    }

    const db = useDrizzle()
    const files = await db.query.tlgFiles.findMany({
      where: eq(tables.tlgFiles.userId, userId),
      orderBy: desc(tables.tlgFiles.createdAt)
    })

    // OPDS 2.0 JSON format
    const feed = {
      metadata: {
        title: "My Ebook Collection",
        updated: new Date().toISOString(),
        "@type": "http://opds-spec.org/2.0/catalog",
        numberOfItems: files.length
      },
      navigation: [
        {
          title: "Home",
          href: `/api/ebooks/opds?pk=${pk}`,
          type: "application/opds+json",
          rel: "self"
        }
      ],
      publications: files.map(file => ({
        metadata: {
          "@type": "http://schema.org/Book",
          title: file.name,
          identifier: file.id,
          modified: file.createdAt.toISOString(),
          published: file.createdAt.toISOString()
        },
        links: [
          {
            rel: "http://opds-spec.org/acquisition",
            href: `/api/ebooks/${file.id}`,
            type: file.mimeType
          },
          {
            // Thêm link xóa (optional)
            rel: "delete",
            href: `/api/ebooks/${file.id}`,
            type: "application/json",
            properties: {
              method: "DELETE"
            }
          }
        ]
      }))
    }

    // Set header là application/opds+json
    setHeader(event, 'Content-Type', 'application/opds+json; charset=utf-8')
    
    return feed

  } catch (error) {
    console.error('Error fetching ebooks:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error'
    })
  }
}) 