export interface TranscriptSegment {
    text: string;
    start: number;
    end: number;
    duration: number;
}

export interface TranscriptData {
    videoId: string;
    title: string;
    shortDescription?: string;
    thumbnail?: string;
    author?: string;
    fullTranscript: string;
    transcriptWithTimeCodes?: TranscriptSegment[];
    url: string;
}

export function extractYouTubeID(urlOrID: string): string | null {
    const regex = /^(https:\/\/)?(?:www\.youtube\.com\/watch\?v=|youtu\.be\/)([^#&]+)/;
    const match = urlOrID.match(regex);

    if (match) {
        return match[1];
    } else {
        return null;
    }
}

export const fetchTranscript = async (youtubeUrl: string): Promise<TranscriptData> => {
    console.log('Fetching Transcript - Calling fetchTranscript Utils');

    const videoId = extractYouTubeID(youtubeUrl);
    if (!videoId) {
        throw new Error('Invalid YouTube URL');
    }

    const { Innertube } = await import('youtubei.js/cf-worker');

    // console.log('Creating YouTube instance');

    const youtube = await Innertube.create({
        lang: 'en',
        location: 'US',
        retrieve_player: false,
    });

    try {
        // console.log('Fetching transcript');
        const info = await youtube.getInfo(videoId);
        const transcriptData = await info.getTranscript();

        //   console.log('Transcript data fetched');

        //   const transcriptWithTimeCodes: TranscriptSegment[] =
        //     transcriptData?.transcript?.content?.body?.initial_segments?.map((segment: any) => {
        //       const segmentDuration = Number(segment.end_ms) - Number(segment.start_ms);
        //       return {
        //         text: segment.snippet.text,
        //         start: Number(segment.start_ms),
        //         end: Number(segment.end_ms),
        //         duration: segmentDuration,
        //       };
        //     }) ?? [];

        //   console.log('Transcript with time codes generated');


        const fullTranscript = transcriptData?.transcript?.content?.body?.initial_segments
            .map((segment: any) => segment.snippet.text)
            .join(' ');

        //   console.log(fullTranscript, 'full transcript');
        //   console.log('Full transcript generated');
        //   console.log('Returning transcript data');
        // console.log(info.basic_info?.title, 'title');

        return {
            videoId,
            title: info.basic_info?.title || '',
            author: info.basic_info?.author || 'Unknown',
            shortDescription: info.basic_info?.short_description || '',
            thumbnail: info.basic_info?.thumbnail?.[0]?.url || '',
            fullTranscript: fullTranscript || '',
            url: youtubeUrl,
        };
    } catch (error) {
        console.error('Error fetching transcript:', error);
        throw error;
    }
};