import Hashids from 'hashids'
import { useRuntimeConfig } from '#imports'
import { EPub } from 'epub2'
import { bot } from './bot'
import { tlgEbooks } from '../database/schema'
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
  return new Promise((resolve, reject) => {
    const epub = new EPub(buffer.toString());
    
    epub.on('end', () => {
      resolve({
        title: epub.metadata.title,
        author: epub.metadata.creator,
        cover: epub.metadata.cover, // URL của cover image
        language: epub.metadata.language,
        publisher: epub.metadata.publisher,
        description: epub.metadata.description
      });
    });

    epub.on('error', reject);
  });
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
