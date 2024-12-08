import { strToU8, zip } from 'fflate';
import { XMLBuilder } from 'fast-xml-parser';

interface EpubChapter {
  title: string;
  content: string;
  id: string;
}

interface EpubMetadata {
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
  private xmlBuilder: XMLBuilder;

  constructor(metadata: EpubMetadata) {
    this.metadata = metadata;
    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      attributeNamePrefix: "@_",
    });
  }

  addChapter(chapter: EpubChapter) {
    this.chapters.push(chapter);
  }

  private generateContainerXml(): string {
    const container = {
      container: {
        "@_version": "1.0",
        "@_xmlns": "urn:oasis:names:tc:opendocument:xmlns:container",
        rootfiles: {
          rootfile: {
            "@_full-path": "OEBPS/content.opf",
            "@_media-type": "application/oebps-package+xml"
          }
        }
      }
    };
    return this.xmlBuilder.build(container);
  }

  private generateContentOpf(): string {
    const manifest = [
      { "@_id": "ncx", "@_href": "toc.ncx", "@_media-type": "application/x-dtbncx+xml" },
      ...this.chapters.map(chapter => ({
        "@_id": chapter.id,
        "@_href": `${chapter.id}.xhtml`,
        "@_media-type": "application/xhtml+xml"
      }))
    ];

    if (this.metadata.cover) {
      const coverExt = this.metadata.cover.mimeType.split('/')[1];
      console.log('Cover metadata:', {
        id: this.metadata.cover.id,
        mimeType: this.metadata.cover.mimeType,
        dataLength: this.metadata.cover.data?.length
      });
      manifest.push({
        "@_id": this.metadata.cover.id,
        "@_href": `images/${this.metadata.cover.id}.${coverExt}`,
        "@_media-type": this.metadata.cover.mimeType
      });
    }

    const spine = ["ncx", ...this.chapters.map(chapter => chapter.id)].map(id => ({
      "@_idref": id
    }));

    const content = {
      package: {
        "@_version": "2.0",
        "@_xmlns": "http://www.idpf.org/2007/opf",
        metadata: {
          "dc:title": this.metadata.title,
          "dc:creator": this.metadata.author,
          "dc:language": this.metadata.language,
          "dc:identifier": this.metadata.identifier,
          ...(this.metadata.description && { "dc:description": this.metadata.description }),
          "@_xmlns:dc": "http://purl.org/dc/elements/1.1/"
        },
        manifest: { item: manifest },
        spine: { itemref: spine }
      }
    };

    console.log('Generated content.opf:', JSON.stringify(content, null, 2));
    return this.xmlBuilder.build(content);
  }

  private generateTocNcx(): string {
    const navPoints = this.chapters.map((chapter, index) => ({
      "@_id": `navPoint-${index + 1}`,
      "@_playOrder": index + 1,
      navLabel: { text: chapter.title },
      content: { "@_src": `${chapter.id}.xhtml` }
    }));

    const toc = {
      ncx: {
        "@_xmlns": "http://www.daisy.org/z3986/2005/ncx/",
        "@_version": "2005-1",
        head: {
          meta: { "@_name": "dtb:uid", "@_content": this.metadata.identifier }
        },
        docTitle: { text: this.metadata.title },
        navMap: { navPoint: navPoints }
      }
    };

    return this.xmlBuilder.build(toc);
  }

  private generateChapterXhtml(chapter: EpubChapter): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${chapter.title}</title>
</head>
<body>
  <h1>${chapter.title}</h1>
  ${chapter.content}
</body>
</html>`;
  }

  async generate(): Promise<Uint8Array> {
    try {
      const files: Record<string, Uint8Array> = {
        'mimetype': strToU8('application/epub+zip'),
        'META-INF/container.xml': strToU8(this.generateContainerXml()),
        'OEBPS/content.opf': strToU8(this.generateContentOpf()),
        'OEBPS/toc.ncx': strToU8(this.generateTocNcx()),
      };
      // console.log('add chapter', new Date().toISOString())
      // Add chapters
      for (const chapter of this.chapters) {
        files[`OEBPS/${chapter.id}.xhtml`] = strToU8(this.generateChapterXhtml(chapter));
      }
      // Add cover if exists
      if (this.metadata.cover) {
        const coverExt = this.metadata.cover.mimeType.split('/')[1]; // Get extension from mime type
        files[`OEBPS/images/${this.metadata.cover.id}.${coverExt}`] = this.metadata.cover.data;
      }
      // console.log('zip', new Date().toISOString())
      // // Debug logging
      // Object.entries(files).forEach(([path, data]) => {
      //   console.log('File path:', path);
      //   console.log('Data type:', data ? data.constructor.name : 'undefined');
      //   console.log('Data length:', data ? data.length : 'N/A');
      //   console.log('---');
      // });

      return new Promise<Uint8Array>((resolve, reject) => {
        try {
          // Convert Buffer to Uint8Array if needed
          const processedFiles: Record<string, Uint8Array> = {};
          for (const [path, data] of Object.entries(files)) {
            processedFiles[path] = data instanceof Buffer ? new Uint8Array(data) : data;
          }

          zip(processedFiles, {
            level: 6  // compression level
          }, (err, data) => {
            if (err) {
              console.error('Zip error:', err);
              reject(err);
            } else {
              resolve(data);
            }
          });
        } catch (error) {
          console.error('Error in zip process:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Error generating ePub:', error);
      throw error; 
    }
  }
}
