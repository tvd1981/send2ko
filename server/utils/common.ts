import Hashids from 'hashids'
import { useRuntimeConfig } from '#imports'
import { bot } from './bot'
import { tlgEbooks } from '../database/schema'
import { XMLParser } from 'fast-xml-parser';
import { unzip, Unzipped } from 'fflate';
const config = useRuntimeConfig()
export const hashids = new Hashids(config.idSalt)

async function getEbookMetadata(buffer: Buffer, mimeType: string) {
  try {
    if(mimeType === 'application/epub+zip'){
        return await getEpubMetadata(buffer);
    }
  } catch (error) {
    console.error('Error reading metadata:', error);
    return null;
  }
}

async function getEpubMetadata(buffer: Buffer) {
  try {
    // Convert buffer thành Uint8Array cho fflate
    const uint8Array = new Uint8Array(buffer);
    
    // Unzip EPUB
    const contents: Unzipped = await new Promise((resolve, reject) => {
      unzip(uint8Array, (err, unzipped) => {
        if (err) reject(err);
        else resolve(unzipped);
      });
    });
    
    // Đọc container.xml
    const containerXml = new TextDecoder().decode(contents['META-INF/container.xml']);
    if (!containerXml) return null;
    
    const parser = new XMLParser();
    const container = parser.parse(containerXml);
    const contentPath = container.container?.rootfiles?.rootfile?.['@_full-path'];
    if (!contentPath) return null;
    
    // Đọc content.opf
    const contentOpf = new TextDecoder().decode(contents[contentPath]);
    if (!contentOpf) return null;
    
    const content = parser.parse(contentOpf);
    const metadata = content.package?.metadata;
    const manifest = content.package?.manifest;

    // Tìm cover image
    let coverPath = null;
    if (manifest?.item) {
      const items = Array.isArray(manifest.item) ? manifest.item : [manifest.item];
      const coverItem = items.find((item: any) => 
        item['@_properties']?.includes('cover-image') || 
        item['@_id']?.includes('cover') ||
        item['@_href']?.toLowerCase().includes('cover')
      );
      
      if (coverItem) {
        coverPath = coverItem['@_href'];
      }
    }

    // Đọc cover image
    let coverBase64 = null;
    if (coverPath) {
      const basePath = contentPath.split('/').slice(0, -1).join('/');
      const fullPath = basePath ? `${basePath}/${coverPath}` : coverPath;
      
      if (contents[fullPath]) {
        const coverData = Buffer.from(contents[fullPath]).toString('base64');
        coverBase64 = coverData;
      }
    }
    
    return {
      title: metadata?.['dc:title'] || null,
      author: metadata?.['dc:creator'] || null,
      cover: coverBase64
    };
  } catch (error) {
    console.error('Error reading EPUB metadata:', error);
    return null;
  }
}

function convertViToEn(str: string, toUpperCase: boolean = false): string {
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    // Some system encode vietnamese combining accent as individual utf-8 characters
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng 
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư

    return toUpperCase ? str.toUpperCase() : str;
}

export function getFileName(fileName: string): string {
    // Tách extension và tên file
    const extension = fileName.match(/\.(epub|pdf|mobi)$/i)?.[0] || '';
    const nameWithoutExt = fileName.replace(/\.(epub|pdf|mobi)$/i, '');
    
    // Chuyển đổi tên file và gắn lại extension
    const convertedName = convertViToEn(nameWithoutExt);
    
    return `${convertedName}${extension.toLowerCase()}`;
}

export async function saveEbookInfo(documentId: string, mimeType: string, documentName: string) {
  try {
    // Lấy file path từ Telegram
    const file = await bot.api.getFile(documentId);
    if (!file.file_path) throw new Error('Cannot get file path');
    
    // Tạo URL và fetch content
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Đọc metadata từ file
    const metadata = await getEbookMetadata(buffer, mimeType) as {
      title?: string;
      author?: string;
      cover?: string;
    } | null;

    // Tạo contentKey
    const normalizedTitle = convertViToEn(metadata?.title || getFileName(documentName ?? '')).toLowerCase();
    const normalizedAuthor = convertViToEn(metadata?.author || 'Unknown').toLowerCase();
    const contentKey = `${normalizedTitle}-${normalizedAuthor}`;
    const ebookId = hashids.encode(contentKey);
    const db = useDrizzle()
    // Kiểm tra xem ebook đã tồn tại chưa
    const existingEbook = await db.query.tlgEbooks.findFirst({
      where: eq(tlgEbooks.id, ebookId)
    });

    // Nếu chưa có, thêm vào tlg_ebooks
    if (!existingEbook) {
      await db.insert(tlgEbooks).values({
        id: ebookId,
        title: metadata?.title || getFileName(documentName ?? ''),
        normalizedTitle,
        author: metadata?.author || 'Unknown',
        normalizedAuthor,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return ebookId;
  } catch (error) {
    console.error('Error saving ebook info:', error);
    throw error;
  }
}
