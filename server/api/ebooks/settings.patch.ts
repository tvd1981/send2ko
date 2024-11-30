export default defineEventHandler(async (event) => {
  const { pk, settings } = await readBody(event)
  if (!pk || !settings) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing pk or settings',
    })
  }
  const db = useDrizzle()
  await db.update(tables.tlgUsers).set({
    settings,
  }).where(eq(tables.tlgUsers.id2, pk))
  return {
    success: true,
  }
})
