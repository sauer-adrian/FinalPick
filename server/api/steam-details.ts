// server/api/steam-details.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const appid = query.appid

  if (!appid) {
    return createError({ statusCode: 400, statusMessage: 'Missing appid' })
  }

  try {
    const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&cc=De`)
    const data = await res.json()
    return data
  } catch (err) {
    console.error('Failed to proxy Steam details:', err)
    return {}
  }
})
