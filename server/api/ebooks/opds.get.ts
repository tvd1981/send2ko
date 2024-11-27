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

    // OPDS 1.0 XML format
    const feed = {
      'feed': {
        '$': {
          'xmlns': 'http://www.w3.org/2005/Atom',
          'xmlns:opds': 'http://opds-spec.org/2011/06'
        },
        'id': 'urn:uuid:my-ebook-catalog',
        'title': 'My Ebook Collection',
        'updated': new Date().toISOString(),
        'author': [{
          'name': 'My Library'
        }],
        'link': [
          {
            '$': {
              'rel': 'self',
              'href': `/api/ebooks/opds?pk=${pk}`,
              'type': 'application/atom+xml;profile=opds-catalog'
            }
          }
        ],
        'entry': files.map(file => ({
          'title': file.name,
          'id': `urn:uuid:${file.id}`,
          'updated': file.createdAt.toISOString(),
          'published': file.createdAt.toISOString(),
          'link': [
            {
              '$': {
                'rel': 'http://opds-spec.org/acquisition',
                'href': `/api/ebooks/${file.id}`,
                'type': file.mimeType
              }
            }
          ]
        }))
      }
    }

    // Convert to XML and set header
    setHeader(event, 'Content-Type', 'application/atom+xml;profile=opds-catalog;charset=utf-8')
    return xmlBuilder.buildObject(feed)

  } catch (error) {
    console.error('Error fetching ebooks:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error'
    })
  }
}) 