import Hashids from 'hashids'
import { XMLParser } from 'fast-xml-parser'
import type { Unzipped } from 'fflate'
import { unzip } from 'fflate'
import { tlgEbooks } from '../database/schema'
import { bot } from './bot'
import { useRuntimeConfig } from '#imports'

const config = useRuntimeConfig()
export const hashids = new Hashids(config.idSalt)

async function getEbookMetadata(buffer: Buffer, mimeType: string) {
  try {
    if (mimeType === 'application/epub+zip') {
      return await getEpubMetadata(buffer)
    }
  }
  catch (error) {
    console.error('Error reading metadata:', error)
    return null
  }
}

async function getEpubMetadata(buffer: Buffer) {
  try {
    // Convert buffer thành Uint8Array cho fflate
    const uint8Array = new Uint8Array(buffer)

    // Unzip EPUB
    const contents: Unzipped = await new Promise((resolve, reject) => {
      unzip(uint8Array, (err, unzipped) => {
        if (err) reject(err)
        else resolve(unzipped)
      })
    })

    // Đọc container.xml
    const containerXml = new TextDecoder().decode(contents['META-INF/container.xml'])
    if (!containerXml) return null
    // console.log('containerXml', containerXml);

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    })
    const container = parser.parse(containerXml)
    const contentPath = container.container?.rootfiles?.rootfile?.['@_full-path']
    if (!contentPath) return null
    // console.log('contentPath', contentPath);

    // Kiểm tra xem contentPath có tồn tại trong contents không
    if (!contents[contentPath]) {
      console.error(`File not found in unzipped contents: ${contentPath}`)
      return null
    }

    // Đọc content.opf
    const contentOpf = new TextDecoder().decode(contents[contentPath])
    if (!contentOpf) return null
    // console.log('contentOpf', contentOpf);

    const content = parser.parse(contentOpf)
    const metadata = content.package?.metadata
    const manifest = content.package?.manifest

    // Tìm cover image
    let coverPath = null
    if (manifest?.item) {
      const items = Array.isArray(manifest.item) ? manifest.item : [manifest.item]
      const coverItem = items.find((item: { '@_properties'?: string, '@_id'?: string, '@_href'?: string }) =>
        item['@_properties']?.includes('cover-image')
        || item['@_id']?.includes('cover')
        || item['@_href']?.toLowerCase().includes('cover'),
      )

      if (coverItem) {
        coverPath = coverItem['@_href']
      }
    }

    // Đọc cover image
    let coverBase64 = null
    if (coverPath) {
      const basePath = contentPath.split('/').slice(0, -1).join('/')
      const fullPath = basePath ? `${basePath}/${coverPath}` : coverPath

      if (contents[fullPath]) {
        const coverData = Buffer.from(contents[fullPath]).toString('base64')
        coverBase64 = coverData
      }
    }

    // Xử lý author từ nhiều nguồn khác nhau
    let author = null

    // Thử lấy từ calibre:author_link_map trước
    if (metadata?.['calibre:author_link_map']) {
      try {
        const authorMap = JSON.parse(metadata['calibre:author_link_map'])
        if (Array.isArray(authorMap)) {
          author = authorMap[0] // Lấy tác giả đầu tiên
        }
        else if (typeof authorMap === 'object') {
          author = Object.keys(authorMap)[0] // Lấy key đầu tiên nếu là object
        }
      }
      catch (e) {
        console.log('Error parsing calibre:author_link_map:', e)
      }
    }

    // Nếu không có calibre:author_link_map, thử lấy từ dc:creator
    if (!author && metadata?.['dc:creator']) {
      if (Array.isArray(metadata['dc:creator'])) {
        author = metadata['dc:creator'][0]?._text || metadata['dc:creator'][0]
      }
      else if (typeof metadata['dc:creator'] === 'object') {
        author = metadata['dc:creator']._text || metadata['dc:creator']['#text']
      }
      else {
        author = metadata['dc:creator']
      }
    }

    // // Debug container.xml
    // console.log('Container XML:', containerXml);
    // console.log('Content Path:', contentPath);

    // // Debug content.opf
    // console.log('Content OPF:', contentOpf);

    // Debug metadata structure
    // console.log('Full Metadata:', JSON.stringify(metadata, null, 2));
    // console.log('DC Creator Raw:', metadata?.['dc:creator']);
    // console.log('Calibre Author Map:', metadata?.['calibre:author_link_map']);

    // Kiểm tra tất cả các key trong metadata
    // console.log('All metadata keys:', Object.keys(metadata || {}));

    // Thử kiểm tra các biến thể khác của dc:creator
    // console.log('Alternative creator formats:', {
    //   'creator': metadata?.creator,
    //   'dcCreator': metadata?.dcCreator,
    //   'dc:creator': metadata?.['dc:creator'],
    //   'DC:creator': metadata?.['DC:creator']
    // });

    return {
      title: metadata?.['dc:title'] || null,
      author: author,
      cover: coverBase64,
    }
  }
  catch (error) {
    console.error('Error reading EPUB metadata:', error)
    return null
  }
}

function convertViToEn(str: string, toUpperCase: boolean = false): string {
  str = str.toLowerCase()
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i')
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
  str = str.replace(/đ/g, 'd')
  // Some system encode vietnamese combining accent as individual utf-8 characters
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, '') // Huyền sắc hỏi ngã nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, '') // Â, Ê, Ă, Ơ, Ư

  return toUpperCase ? str.toUpperCase() : str
}

export function getFileName(fileName: string): string {
  // Tách extension và tên file
  const extension = fileName.match(/\.(epub|pdf|mobi)$/i)?.[0] || ''
  const nameWithoutExt = fileName.replace(/\.(epub|pdf|mobi)$/i, '')

  // Chuyển đổi tên file và gắn lại extension
  const convertedName = convertViToEn(nameWithoutExt)

  return `${convertedName}${extension.toLowerCase()}`
}

async function hashString(str: string): Promise<number> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = new Uint32Array(hashBuffer)
  // Lấy 4 byte đầu tiên và chuyển thành số nguyên
  return hashArray[0]
}

export async function saveEbookInfo(documentId: string, mimeType: string, documentName: string) {
  try {
    // Lấy file path từ Telegram
    const file = await bot.api.getFile(documentId)
    if (!file.file_path) throw new Error('Cannot get file path')

    // Tạo URL và fetch content
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`
    const response = await fetch(fileUrl)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Đọc metadata từ file
    const metadata = await getEbookMetadata(buffer, mimeType) as {
      title?: string
      author?: string
      cover?: string
    } | null

    console.log('metadata', metadata)
    // Tạo contentKey
    if (metadata?.title && metadata?.author) {
      const normalizedTitle = convertViToEn(metadata?.title).toLowerCase()
      const normalizedAuthor = convertViToEn(metadata?.author).toLowerCase()
      const contentKey = `${normalizedTitle}-${normalizedAuthor}`
      const contentKeyHash = await hashString(contentKey)
      const ebookId = hashids.encode(contentKeyHash)
      const db = useDrizzle()
      // Kiểm tra xem ebook đã tồn tại chưa
      const existingEbook = await db.query.tlgEbooks.findFirst({
        where: eq(tlgEbooks.id, ebookId),
      })

      // Nếu chưa có, thêm vào tlg_ebooks
      if (!existingEbook) {
        await db.insert(tlgEbooks).values({
          id: ebookId,
          title: metadata?.title || getFileName(documentName ?? ''),
          normalizedTitle,
          author: metadata?.author || 'Unknown',
          normalizedAuthor,
          cover: metadata?.cover || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      return ebookId
    }
    return null
  }
  catch (error) {
    console.error('Error saving ebook info:', error)
    throw error
  }
}
export type ResultFilesQuery = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  totalRows: number
}

export async function getFilesByUser(
  pk: string,
  options?: {
    page: number
    limit: number
    latestOnly?: boolean
  },
  fromDevice?: string,
): Promise<ResultFilesQuery> {
  if (!pk) {
    throw createError({
      statusCode: 400,
      message: 'Missing pk parameter',
    })
  }
  const db = useDrizzle()
  const user = await db.query.tlgUsers.findFirst({
    where: eq(tables.tlgUsers.id2, pk),
  })
  if (!user) {
    throw createError({
      statusCode: 400,
      message: 'Invalid pk',
    })
  }
  let totalRows = 0

  const query = db.select({
    id: tables.tlgFiles.id,
    fileName: tables.tlgFiles.name,
    size: tables.tlgFiles.size,
    mimeType: tables.tlgFiles.mimeType,
    ebookId: tables.tlgFiles.ebookId,
    ebookTitle: tables.tlgEbooks.title,
    ebookAuthor: tables.tlgEbooks.author,
    ebookCover: tables.tlgEbooks.cover,
    createdAt: tables.tlgFiles.createdAt,
  })
    .from(tables.tlgFiles)
    .leftJoin(tables.tlgEbooks, eq(tables.tlgFiles.ebookId, tables.tlgEbooks.id))
    .where(eq(tables.tlgFiles.userId, user.id))
    .orderBy(desc(tables.tlgFiles.createdAt))

  if (!fromDevice) {
    totalRows = (await db.select({ count: sql<number>`count(*)` }).from(tables.tlgFiles).where(eq(tables.tlgFiles.userId, user.id)))[0].count
  }
  else {
    const { settings = {} } = user as { settings?: { web?: number, opds?: number } }
    if (fromDevice === 'web') {
      query.limit(settings.web ?? 20)
    }
    else if (fromDevice === 'opds') {
      query.limit(settings.opds ?? 20)
    }
  }

  // Nếu có options thì áp dụng phân trang hoặc lấy mới nhất
  if (options) {
    if (options.latestOnly) {
      return {
        data: await query.limit(1),
        totalRows: totalRows,
      }
    }

    const offset = (options.page - 1) * options.limit
    return {
      data: await query.limit(options.limit).offset(offset),
      totalRows: totalRows,
    }
  }

  return {
    data: await query,
    totalRows,
  }
}
