<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import GameCard from '~/components/GameCard.vue'
import GameSearchSteam from '~/components/GameSearchSteam.vue'

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const games = ref([])
const isGamesLoaded = ref(false)
let voteSubscription = null
let gameSubscription = null


// Fetch games + vote data
async function getGames() {
  const { data: gameData } = await supabase
    .from('games')
    .select(`*, votes(value, user_id)`)

  if (!gameData) return

  const userId = user.value?.id

  games.value = gameData.map(game => {
    const voteCount = (game.votes ?? []).reduce((sum, v) => sum + (v.value || 0), 0)
    const userVote = (game.votes ?? []).find(v => v.user_id === userId)?.value || 0
    return {
      ...game,
      voteCount,
      userVote,
    }
  })

  sortGamesByVotes()
  isGamesLoaded.value = true
}

// Vote handler
async function voteForGame(gameId, direction) {
  if (!user.value) return

  const game = games.value.find(g => g.id === gameId)
  if (!game) return

  const currentVote = game.userVote || 0

  if (currentVote === direction) {
    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('user_id', user.value.id)
      .eq('game_id', gameId)

    if (!error) {
      game.voteCount -= currentVote
      game.userVote = 0
    }
  } else {
    const { error } = await supabase
      .from('votes')
      .upsert({
        user_id: user.value.id,
        game_id: gameId,
        value: direction
      }, { onConflict: 'user_id,game_id' })

    if (!error) {
      game.voteCount += direction - currentVote
      game.userVote = direction
    }
  }
  sortGamesByVotes()
}

function sortGamesByVotes() {
  games.value.sort((a, b) => b.voteCount - a.voteCount)
}


// Handle realtime updates
async function handleVoteChange(payload) {
  console.log('[Realtime] Vote change received:', payload)

  const { new: newVote, old: oldVote } = payload
  const gameId = newVote?.game_id || oldVote?.game_id
  if (!gameId) {
    console.warn('No gameId found in vote change payload')
    return
  }

  const gameIndex = games.value.findIndex(g => g.id === gameId)
  if (gameIndex === -1) {
    console.warn('Game not found in local state:', gameId)
    return
  }

  const { data, error } = await supabase
    .from('votes')
    .select('value, user_id')
    .eq('game_id', gameId)

  if (error) {
    console.error('Error fetching fresh votes for game', gameId, error)
    return
  }

  const voteCount = data.reduce((sum, v) => sum + (v.value || 0), 0)
  const userVote = data.find(v => v.user_id === user.value?.id)?.value || 0

  // ✅ Replace the object to trigger reactivity
  games.value[gameIndex] = {
    ...games.value[gameIndex],
    voteCount,
    userVote,
  }
  await nextTick()
  sortGamesByVotes()

  console.log(`[Realtime] Updated game ${gameId}: voteCount=${voteCount}, userVote=${userVote}`)
}


async function handleGameChange(payload) {
  console.log('[Realtime] Game change received:', payload)

  const { new: newGame, old: oldGame, eventType } = payload

  if (eventType === 'INSERT') {
    const userId = user.value?.id ?? null
    const voteCount = 0
    const userVote = 0

    // Prevent duplicates
    if (games.value.find(g => g.id === newGame.id)) return

    games.value.push({
      ...newGame,
      voteCount,
      userVote,
    })
    sortGamesByVotes()
  }

  if (eventType === 'DELETE') {
    games.value = games.value.filter(g => g.id !== oldGame.id)
  }

  if (eventType === 'UPDATE') {
    const index = games.value.findIndex(g => g.id === newGame.id)
    if (index !== -1) {
      games.value[index] = {
        ...games.value[index],
        ...newGame,
      }
    }
    sortGamesByVotes()
  }

  await nextTick()
}




// Subscribe to realtime
async function setupSubscription() {
  if (voteSubscription) return

  voteSubscription = supabase
    .channel('votes-realtime')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'votes',
      old_record: true  // ✅ Ensure old row data is available
    }, handleVoteChange)

  const { error } = await voteSubscription.subscribe()
  if (error) {
    console.error('Subscription failed:', error)
    voteSubscription = null
  }

  gameSubscription = supabase
    .channel('games-realtime')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'games',
      old_record: true
    }, handleGameChange)

  const { error: gameError } = await gameSubscription.subscribe()
  if (gameError) {
    console.error('Game subscription failed:', gameError)
    gameSubscription = null
  }

}

// Cleanup on unmount
onBeforeUnmount(() => {
  if (voteSubscription) {
    supabase.removeChannel(voteSubscription)
    voteSubscription = null
  }

  if (gameSubscription) {
    supabase.removeChannel(gameSubscription)
    gameSubscription = null
  }
})

// Watch user change
watch(user, async (newUser, oldUser) => {
  if (voteSubscription) {
    supabase.removeChannel(voteSubscription)
    voteSubscription = null
  }

  if (gameSubscription) {
    supabase.removeChannel(gameSubscription)
    gameSubscription = null
  }

  if (newUser) {
    await getGames()
    await setupSubscription()
  }
})


// Initial load
onMounted(async () => {
  if (user.value) {
    await getGames()
    await setupSubscription()
  }
})

// Delete game
async function deleteGame(gameId) {
  const { error } = await supabase
    .from('games')
    .delete()
    .eq('id', gameId)

  if (!error) {
    games.value = games.value.filter(g => g.id !== gameId)
  }
}
</script>

<template>
  <UContainer class="pb-4">
    <div v-if="user" class="mb-4 text-sm text-gray-600">
      Logged in as: <strong>{{ user.email }}</strong>
    </div>

    <div class="w-full mb-6">
      <GameSearchSteam @game-added="getGames" />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-stretch">
      <TransitionGroup name="list" tag="div" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-stretch">
        <div v-for="game in games" :key="game.id" class="h-full">
          <GameCard :game="game" :onVote="voteForGame" :onDelete="deleteGame" />
        </div>
      </TransitionGroup>
    </div>
  </UContainer>
</template>
