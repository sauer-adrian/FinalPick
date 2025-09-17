<script setup lang="ts">
definePageMeta({ auth: false })

const route = useRoute()
const slug = route.params.slug as string

// Optional: restrict to known slugs to avoid accidental exposure
const allowed = new Set(['impressum', 'privacy', 'terms'])
if (!allowed.has(slug)) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

// Load the doc so we can set <head> from front-matter
const doc = await queryContent(`/legal/${slug}`).findOne()
if (!doc) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}
useContentHead(doc)
</script>

<template>
  <div class="min-h-screen">
    <UContainer class="py-10">
      <ContentDoc :path="`/legal/${$route.params.slug}`" />
    </UContainer>
  </div>
</template>
