<script setup lang="ts">
definePageMeta({ auth: false })

useSeoMeta({
  title: 'Impressum – FinalPick',
  ogTitle: 'Impressum – FinalPick',
  description: 'Impressum / provider identification for FinalPick.',
  ogDescription: 'Impressum / provider identification for FinalPick.'
})
</script>

<template>
  <div class="min-h-screen">
    <UContainer class="py-10">
      <UCard>
        <div class="prose dark:prose-invert max-w-none">
          <h1>Impressum</h1>

          <h2>Angaben gemäß § 5 TMG</h2>
          <p>
            <strong>FinalPick</strong><br>
            Branderiede 10B<br>
            30916 Isernhagen<br>
            Germany
          </p>

          <h3>Kontakt</h3>
          <p>
            E-Mail: <a href="mailto:adrian-sauer@outlook.com">adrian-sauer@outlook.com</a>
          </p>

          <hr />
          <p class="text-sm">
            Also see: <NuxtLink to="/legal/terms">Terms of Service</NuxtLink> · <NuxtLink to="/legal/privacy">Privacy
              Policy</NuxtLink>
          </p>
        </div>
      </UCard>
    </UContainer>
  </div>
</template>