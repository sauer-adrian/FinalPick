<script setup lang="ts">
const route = useRoute()
const path = computed(() => route.path) // /legal/<slug>
</script>

<template>
  <main class="prose max-w-none">
    <ContentDoc :path="path" :key="path">
      <template #not-found>
        <h1>Not found</h1>
      </template>
    </ContentDoc>
  </main>
</template>
