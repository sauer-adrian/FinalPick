<script setup lang="ts">
definePageMeta({ auth: false })

const slug = useRoute().params.slug as string
const allowed = new Set(['impressum', 'privacy', 'terms'])
if (!allowed.has(slug)) throw createError({ statusCode: 404 })

const { data: page } = await useAsyncData(`legal-${slug}`, () =>
  queryCollection('content').path(`/legal/${slug}`).first()
)
if (!page.value) throw createError({ statusCode: 404 })

useSeoMeta({
  title: page.value.title || 'FinalPick',
  ogTitle: page.value.title || 'FinalPick',
  description: page.value.description || '',
  ogDescription: page.value.description || ''
})
</script>

<template>
  <div class="min-h-screen">
    <UContainer class="py-10">
      <ContentRenderer :value="page" />
    </UContainer>
  </div>
</template>
