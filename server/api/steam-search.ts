// server/api/steam-search.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const term = query.q

  if (!term) return []

  const res = await fetch(`https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(term)}`)
  const text = await res.text()

  try {
    const json = JSON.parse(text)
    return Array.isArray(json) ? json : []
  } catch (err) {
    console.error('Steam Search JSON parse failed:', err)
    return []
  }
})
