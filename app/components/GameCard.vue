<script setup>
defineProps({
  game: Object,
  onVote: Function,
  onDelete: Function
})
</script>

<template>
  <UCard ui="{ header: 'p-0' }" class="h-full flex flex-col">
    <template #header>
      <div class="flex justify-between items-start">
        <div class="flex items-center gap-4">
          <img :src="game.cover_url" alt="Cover" class="object-cover" />
        </div>
      </div>
    </template>

    <div class="flex-1">
      <h3 class="text-lg font-semibold">{{ game.name }}</h3>
      <div class="h-32 overflow-hidden text-ellipsis line-clamp-5">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ game.summary }}
        </p>
      </div>
    </div>
    <button @click="onDelete(game)"
      class="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition ml-2 cursor-pointer hover:bg-red-500/10 p-1 rounded"
      title="Delete game" aria-label="Delete game">
      <UIcon name="i-lucide-trash" class="size-4" />
    </button>
    <template #footer>
      <div class="flex items-center justify-center gap-3 rounded-full px-4 py-1 w-fit mx-auto
           border bg-gray-100 text-gray-900 border-gray-200
           dark:bg-gray-800 dark:text-white dark:border-gray-700">
        <!-- Upvote -->
        <UButton size="sm" :variant="game.userVote === 1 ? 'solid' : 'ghost'" color="success" icon="i-lucide-arrow-up"
          @click="onVote(game.id, 1)" :aria-pressed="game.userVote === 1"
          class="transition-transform duration-150 rounded-full"
          :class="game.userVote === 1 ? 'scale-95' : 'hover:scale-105'" title="Upvote" />

        <!-- Count -->
        <span class="font-medium text-sm transition-colors" :class="{
          'text-success-600 dark:text-success-400': game.userVote === 1,
          'text-error-600 dark:text-error-400': game.userVote === -1,
          'text-gray-700 dark:text-gray-200': !game.userVote
        }">
          {{ game.voteCount }}
        </span>

        <!-- Downvote -->
        <UButton size="sm" :variant="game.userVote === -1 ? 'solid' : 'ghost'" color="error" icon="i-lucide-arrow-down"
          @click="onVote(game.id, -1)" :aria-pressed="game.userVote === -1"
          class="transition-transform duration-150 rounded-full"
          :class="game.userVote === -1 ? 'scale-95' : 'hover:scale-105'" title="Downvote" />
      </div>
    </template>


  </UCard>
</template>
