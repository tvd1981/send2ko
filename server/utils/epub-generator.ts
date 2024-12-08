import { strToU8, zip, zipSync } from 'fflate';
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
    const manifest = [];

    // Add cover first if it exists
    if (this.metadata.cover) {
      const coverExt = this.metadata.cover.mimeType.split('/')[1];
      manifest.push({
        "@_id": this.metadata.cover.id,
        "@_href": `images/${this.metadata.cover.id}.${coverExt}`,
        "@_media-type": this.metadata.cover.mimeType
      });
      // Add cover-html
      manifest.push({
        "@_id": "cover-html",
        "@_href": "cover.xhtml",
        "@_media-type": "application/xhtml+xml"
      });
    }

    // Add content
    manifest.push({
      "@_id": "content",
      "@_href": "content.xhtml",
      "@_media-type": "application/xhtml+xml"
    });

    // Build spine items - start with cover if exists
    const spineItems = [];
    if (this.metadata.cover) {
      spineItems.push({ "@_idref": "cover-html" });
    }
    // Add content to spine
    spineItems.push({ "@_idref": "content" });

    const content = {
      package: {
        "@_version": "2.0",
        "@_xmlns": "http://www.idpf.org/2007/opf",
        "@_unique-identifier": "BookId",
        metadata: {
          "@_xmlns:dc": "http://purl.org/dc/elements/1.1/",
          "@_xmlns:opf": "http://www.idpf.org/2007/opf",
          "dc:title": this.metadata.title,
          "dc:creator": { "@_opf:role": "aut", "#text": this.metadata.author },
          "dc:language": this.metadata.language,
          "dc:identifier": { "@_id": "BookId", "#text": this.metadata.identifier },
          ...(this.metadata.description && { "dc:description": this.metadata.description }),
          ...(this.metadata.cover && { meta: { "@_name": "cover", "@_content": this.metadata.cover.id } })
        },
        manifest: { item: manifest },
        spine: { itemref: spineItems }
      }
    };

    return this.xmlBuilder.build(content);
  }

  private generateContentXhtml(): string {
    const chapter = this.chapters[0]; // We only use the first chapter
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${chapter.title}</title>
  <style type="text/css">
    body { margin: 1em; line-height: 1.6; }
    h1 { text-align: center; margin: 1em 0; }
  </style>
</head>
<body>
  <h1>${chapter.title}</h1>
  ${chapter.content}
</body>
</html>`;
  }

  private generateCoverHtml(): string {
    if (!this.metadata.cover) return '';
    const coverExt = this.metadata.cover.mimeType.split('/')[1];
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Cover</title>
  <style type="text/css">
    body { margin: 0; padding: 0; text-align: center; }
    img { max-width: 100%; max-height: 100vh; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div>
    <img src="images/${this.metadata.cover.id}.${coverExt}" alt="Cover"/>
  </div>
</body>
</html>`;
  }

  async generate(): Promise<Uint8Array> {
    try {
      // Create files object with mimetype first
      const files: Record<string, Uint8Array> = {
        'mimetype': strToU8('application/epub+zip')
      };

      // Add other files
      Object.assign(files, {
        'META-INF/container.xml': strToU8(this.generateContainerXml()),
        'OEBPS/content.opf': strToU8(this.generateContentOpf()),
      });

      // Add cover if exists
      if (this.metadata.cover) {
        const coverExt = this.metadata.cover.mimeType.split('/')[1];
        files['OEBPS/cover.xhtml'] = strToU8(this.generateCoverHtml());
        files[`OEBPS/images/${this.metadata.cover.id}.${coverExt}`] = this.metadata.cover.data;
      }

      // Add content
      files['OEBPS/content.xhtml'] = strToU8(this.generateContentXhtml());

      return new Promise<Uint8Array>((resolve, reject) => {
        try {
          // Convert Buffer to Uint8Array if needed
          const processedFiles: Record<string, Uint8Array> = {};
          for (const [path, data] of Object.entries(files)) {
            processedFiles[path] = data instanceof Buffer ? new Uint8Array(data) : data;
          }

          // Use synchronous zipSync instead of async zip
          const zipped = zipSync(processedFiles, {
            level: 6  // compression level
          });
          resolve(zipped);
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
