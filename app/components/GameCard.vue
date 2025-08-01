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
        <button @click="onDelete(game.id)"
          class="text-gray-400 hover:text-red-500 transition ml-2 cursor-pointer hover:bg-red-500/10 p-1 rounded"
          title="Delete game">
          <UIcon name="i-lucide-trash" class="size-4" />
        </button>
      </div>
    </template>

    <div class="flex-1">
      <div class="h-32 overflow-hidden text-ellipsis line-clamp-5">
        <p class="text-sm text-gray-500">
          {{ game.summary }}
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-center gap-3 bg-gray-800 text-white rounded-full px-4 py-1 w-fit mx-auto">
        <button @click="onVote(game.id, 1)"
          :class="['transition', { 'text-green-400 font-bold': game.userVote === 1 }]">
          <UIcon name="i-lucide-arrow-up" class="size-4" />
        </button>

        <span class="font-medium text-sm">
          {{ game.voteCount }}
        </span>

        <button @click="onVote(game.id, -1)"
          :class="['transition', { 'text-red-400 font-bold': game.userVote === -1 }]">
          <UIcon name="i-lucide-arrow-down" class="size-4" />
        </button>
      </div>
    </template>
  </UCard>
</template>
