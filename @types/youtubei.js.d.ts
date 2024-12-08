declare module 'youtubei.js/cf-worker' {
  export class Innertube {
    static create(options?: {
      lang?: string;
      location?: string;
      retrieve_player?: boolean;
    }): Promise<Innertube>;
    
    getInfo(videoId: string): Promise<{
      getTranscript(): Promise<{
        transcript?: {
          content?: {
            body?: {
              initial_segments: Array<{
                snippet: { text: string };
                start_ms: string;
                end_ms: string;
              }>;
            };
          };
        };
      }>;
      basic_info?: {
        title?: string;
        author?: string;
        short_description?: string;
        thumbnail?: [{
          url: string;
        }];
      };
    }>;
  }
}