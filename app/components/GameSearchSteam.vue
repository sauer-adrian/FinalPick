<script setup>
import { ref, watch } from 'vue'
const emit = defineEmits(['game-added'])

const supabase = useSupabaseClient()

const search = ref('')
const loading = ref(false)
const results = ref([])

let debounceTimer = null

watch(search, (newVal) => {
  clearTimeout(debounceTimer)

  if (!newVal || newVal.length < 2) {
    results.value = []
    return
  }

  debounceTimer = setTimeout(() => {
    searchGames()
  }, 400) // ⏱ Debounce delay: 400ms
})

async function searchGames() {
  loading.value = true

  try {
    const res = await fetch(`/api/steam-search?q=${encodeURIComponent(search.value)}`)
    const searchResults = await res.json()

    if (!Array.isArray(searchResults)) {
      console.error('Invalid Steam search result:', searchResults)
      throw new Error('Steam search did not return an array')
    }

    const games = await Promise.all(
      searchResults.slice(0, 5).map(async (game) => {
        const details = await fetchSteamDetails(game.appid)
        return {
          ...details,
          steam_appid: game.appid,
          name: game.name,
        }
      })
    )

    results.value = await filterNewGames(games)
  } catch (err) {
    console.error('Steam search failed:', err)
  } finally {
    loading.value = false
  }
}

async function fetchSteamDetails(appid) {
  try {
    const res = await fetch(`/api/steam-details?appid=${appid}`)
    const data = await res.json()
    const game = data[appid]?.data
    if (!game) return {}

    return {
      summary: game.short_description,
      cover: { url: game.header_image },
    }
  } catch (err) {
    console.error('Failed to fetch Steam details', err)
    return {}
  }
}

async function filterNewGames(games) {
  const { data: existing } = await supabase.from('games').select('name')
  const existingNames = new Set((existing ?? []).map(g => g.name.toLowerCase()))
  return games.filter(g => !existingNames.has(g.name.toLowerCase()))
}

async function addGame(game) {
  const { data: user } = await supabase.auth.getUser()

  const { error } = await supabase.from('games').insert({
    id: crypto.randomUUID(),
    name: game.name,
    summary: game.summary ?? '',
    cover_url: game.cover?.url ?? '',
    added_by: user?.user?.id,
  })

  if (error) {
    console.error('Error adding game:', error)
  } else {
    emit('game-added')
    search.value = ''
    results.value = []
  }
}

</script>

<template>
  <div class="my-6">
    <div class="flex items-center gap-2">
      <UInput class="flex-1" v-model="search" placeholder="Search Steam..." @keyup.enter="searchGames" />
      <UButton @click="searchGames" :loading="loading">Search</UButton>
    </div>

    <div v-if="results.length" class="mt-4 space-y-2">
      <UCard v-for="game in results" :key="game.steam_appid"
        class="p-2 transition cursor-pointer hover:ring-2 hover:ring-green-500" @click="addGame(game)">
        <div class="flex items-start gap-4">
          <!-- Game cover -->
          <img v-if="game.cover?.url" :src="game.cover.url" alt="Cover"
            class="w-20 h-20 object-cover rounded-md shadow" />

          <!-- Right column -->
          <div class="flex-1 min-w-0">
            <h3 class="text-base font-semibold truncate">
              {{ game.name }}
            </h3>
            <p class="text-sm text-gray-400 line-clamp-2 mt-1">
              {{ game.summary }}
            </p>
          </div>
        </div>
      </UCard>


    </div>
    <p v-else-if="search && !results.length && !loading" class="text-sm text-gray-400 mt-4 text-center">
      No games found.
    </p>
  </div>
</template>
