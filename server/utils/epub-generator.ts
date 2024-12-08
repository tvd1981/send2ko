import Epub from 'epub-gen-memory';

export interface EpubChapter {
  title: string;
  content: string;
  id: string;
}

export interface EpubMetadata {
  title: string;
  author: string;
  language: string;
  identifier: string;
  description?: string;
  cover?: {
    id: string;
    data: Uint8Array;
    mimeType: string;
  };
}

export class EpubGenerator {
  private chapters: EpubChapter[] = [];
  private metadata: EpubMetadata;

  constructor(metadata: EpubMetadata) {
    this.metadata = metadata;
  }

  addChapter(chapter: EpubChapter) {
    this.chapters.push(chapter);
  }

  async generate(): Promise<Uint8Array> {
    try {
      const options = {
        title: this.metadata.title,
        author: this.metadata.author,
        lang: this.metadata.language,
      };

      if (this.metadata.cover) {
        (options as any)['cover'] = `data:${this.metadata.cover.mimeType};base64,${Buffer.from(this.metadata.cover.data).toString('base64')}`;
      }

      const chapters = this.chapters.map((chapter) => ({
        title: chapter.title,
        content: chapter.content,
        excludeFromToc: true,
      }));

      const content = await Epub(options, chapters);
      return new Uint8Array(content);
    } catch (error) {
      console.error('Error generating ePub:', error);
      throw error;
    }
  }
}
