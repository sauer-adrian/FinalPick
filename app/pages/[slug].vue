<script setup lang="ts">
const route = useRoute()

// use the URL path as key, and fetch the doc from the 'content' collection
const { data: page, error, status } = await useAsyncData(route.path, () => {
  return queryCollection('content').path(route.path).first()
})
</script>

<template>
  <main class="prose max-w-none">
    <div v-if="status === 'pending'">Loading…</div>

    <!-- Render the document if found -->
    <ContentRenderer v-else-if="page" :value="page" />

    <!-- Not found fallback -->
    <template v-else>
      <h1>Not found</h1>
    </template>
  </main>
</template>
