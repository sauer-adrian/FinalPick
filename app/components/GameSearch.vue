<script setup>
import { ref, watch } from 'vue'
const supabase = useSupabaseClient()

const search = ref('')
const loading = ref(false)
const results = ref([])

// Replace with your actual IGDB client credentials
const IGDB_CLIENT_ID = 'YOUR_CLIENT_ID'
const IGDB_ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN'

async function searchGames() {
  if (!search.value) return

  loading.value = true

  const res = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': IGDB_CLIENT_ID,
      'Authorization': `Bearer ${IGDB_ACCESS_TOKEN}`,
      'Accept': 'application/json',
      'Content-Type': 'text/plain'
    },
    body: `search "${search.value}"; fields name, summary, cover.url; limit 10;`
  })

  const data = await res.json()
  results.value = await filterNewGames(data)

  loading.value = false
}

async function filterNewGames(gamesFromIGDB) {
  const { data: existing } = await supabase
    .from('games')
    .select('name')

  const existingNames = new Set((existing ?? []).map(g => g.name.toLowerCase()))

  return gamesFromIGDB.filter(g => !existingNames.has(g.name.toLowerCase()))
}

async function addGame(game) {
  const { error } = await supabase.from('games').insert({
    name: game.name,
    summary: game.summary,
    cover_url: game.cover?.url ?? '',
    added_by: (await supabase.auth.getUser()).data.user.id
  })

  if (error) {
    console.error('Error adding game:', error)
  } else {
    search.value = ''
    results.value = []
  }
}
</script>

<template>
  <div class="my-6">
    <div class="flex items-center gap-2">
      <UInput class="flex-1" v-model="search" placeholder="Search IGDB..." @keyup.enter="searchGames" />
      <UButton @click="searchGames" :loading="loading">Search</UButton>
    </div>

    <div v-if="results.length" class="mt-4 space-y-2">
      <UCard
        v-for="game in results"
        :key="game.id"
        class="flex justify-between items-center p-3"
      >
        <div class="flex items-center gap-3">
          <img
            v-if="game.cover?.url"
            :src="game.cover.url.replace('//', 'https://')"
            class="w-12 h-12 rounded object-cover"
            alt="cover"
          />
          <div>
            <p class="font-medium">{{ game.name }}</p>
            <p class="text-xs text-gray-400">{{ game.summary?.slice(0, 80) }}...</p>
          </div>
        </div>
        <UButton size="xs" @click="addGame(game)">
          Add
        </UButton>
      </UCard>
    </div>
  </div>
</template>
