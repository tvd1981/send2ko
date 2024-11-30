export default defineEventHandler(async (event) => {
  const { pk } = getQuery(event)
  if (!pk) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing pk',
    })
  }
  const db = useDrizzle()
  const user = await db.query.tlgUsers.findFirst({
    where: eq(tables.tlgUsers.id2, pk as string),
  })
  return user?.settings
})
