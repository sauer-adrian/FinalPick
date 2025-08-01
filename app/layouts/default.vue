<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()

watchEffect(() => {
  if (!user.value) {
    navigateTo('/login')
  }
})

async function logout() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div v-if="user" class="min-h-screen">
    <nav class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
      <div class="flex items-center space-x-3">
        <img src="/logo.png" alt="Logo" class="w-8 h-8" />
        <h1 class="text-xl font-semibold text-gray-800 dark:text-white">FinalPick</h1>
      </div>
      <div class="flex items-center space-x-4">
        <UButton icon="i-lucide-log-out" @click="logout" size="sm" color="error" variant="soft" />
      </div>
    </nav>

    <main class="p-4">
      <slot />
    </main>
  </div>

  <div v-else class="min-h-screen flex items-center justify-center">
    <span class="text-gray-400">Redirecting...</span>
  </div>
</template>
