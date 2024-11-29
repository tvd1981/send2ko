import { getFilesByUser } from '../../utils/common'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const pk = query.pk as string

  const { send } = await useSSE(event, 'sse:event')

  // Lấy files và gửi ngay lần đầu
  const files = await getFilesByUser(pk, { page: 1, limit: 10 })
  send((id: number) => ({ id, data: files }))

  // Có thể thêm interval để check files mới định kỳ
  const interval = setInterval(async () => {
    const newFiles = await getFilesByUser(pk, { page: 1, limit: 1, latestOnly: true })
    send((id: number) => ({ id, data: newFiles }))
  }, 5000) // Check mỗi 5 giây

  // Dọn dẹp khi client ngắt kết nối
  event.node.req.on('close', () => clearInterval(interval))
})
