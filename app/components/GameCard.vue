<script setup>
defineProps({
  game: Object,
  onVote: Function,
  onDelete: Function
})
</script>

<template>
  <UCard class="h-full flex flex-col">
    <template #header>
      <div class="flex justify-between items-start">
        <div class="flex items-center gap-4">
          <img :src="game.cover_url" alt="Cover" class="w-16 h-16 object-cover rounded" />
          <h3 class="text-lg font-semibold">{{ game.name }}</h3>
        </div>
        <button @click="onDelete(game)"
          class="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition ml-2 cursor-pointer hover:bg-red-500/10 p-1 rounded"
          title="Delete game" aria-label="Delete game">
          <UIcon name="i-lucide-trash" class="size-4" />
        </button>
      </div>
    </template>

    <div class="flex-1">
      <div class="h-32 overflow-hidden text-ellipsis line-clamp-5">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ game.summary }}
        </p>
      </div>
    </div>

    <template #footer>
      <!-- Light/Dark aware vote bar -->
      <div class="flex items-center justify-center gap-3 rounded-full px-4 py-1 w-fit mx-auto
               border bg-gray-100 text-gray-900 border-gray-200
               dark:bg-gray-800 dark:text-white dark:border-gray-700">
        <UButton size="sm" variant="link" color="success" icon="i-lucide-arrow-up" @click="onVote(game.id, 1)"
          :class="{ 'ring-2 ring-success-500': game.userVote === 1 }" />
        <span class="font-medium text-sm">{{ game.voteCount }}</span>
        <UButton size="sm" variant="link" color="error" icon="i-lucide-arrow-down" @click="onVote(game.id, -1)"
          :class="{ 'ring-2 ring-error-500': game.userVote === -1 }" />
      </div>
    </template>
  </UCard>
</template>
