import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { useRuntimeConfig } from '#imports'
// import { stripLines, oneLine } from 'common-tags'

const config = useRuntimeConfig()

function getOpenAIProvider() {
    return createOpenAI({
        apiKey: config.openaiApiKey
    })
}

export async function summaryContent(content: string, url?: string) {
    const openai = getOpenAIProvider()
    // content = stripLines(content)
    const message = `
        Bạn hãy tóm tắt chi tiết nhất nội dung trong mục Content sau đây 
        : <Content>${content}</Content>
        - Trình bày theo các gạch đầu dòng ý chính và diễn giải.
        - Bỏ dòng giới thiệu dạng : Dưới đây là tóm tắt chi tiết nội dung trong mục Content theo các gạch đầu dòng ý chính và diễn giải...
        - Trả về định dạng HTML nhưng bỏ thẻ bao html đi.
        - Gắn thêm xem chi tiết tại ${url} vào cuối bài
        `
    const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        messages: [
            {
                role: 'user',
                content: message,
            },
        ],
    })
    return text
}