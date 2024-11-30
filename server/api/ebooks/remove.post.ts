export default defineEventHandler(async (event) => {
  try {
    // Lấy dữ liệu từ body request
    const body = await readBody(event)
    const { pk, ids } = body

    if (!pk || !ids || !Array.isArray(ids)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid request. Required pk and array of ids',
      })
    }

    // Decode userId từ pk
    const userId = hashids.decode(pk)
    if (!userId) {
      throw createError({
        statusCode: 400,
        message: 'Invalid pk',
      })
    }

    const db = useDrizzle()

    // Xóa các files được chọn
    await db.delete(tables.tlgFiles)
      .where(
        and(
          eq(tables.tlgFiles.userId, Number(userId[0])),
          sql`${tables.tlgFiles.id} IN ${ids}`,
        ),
      )

    return {
      message: 'Remove successfully!',
    }
  }
  catch (error) {
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Internal Server Error',
    })
  }
})
