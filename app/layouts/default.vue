<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()

async function logout() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}

// Load avatar URL if available
const avatarUrl = ref<string | null>(null)

watchEffect(async () => {
  if (user.value?.id) {
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.value.id)
      .single()

    if (!error && data?.avatar_url) {
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.avatar_url)

      avatarUrl.value = urlData.publicUrl
    } else {
      avatarUrl.value = null
    }
  }
})
</script>

<template>
  <div class="min-h-screen">
    <!-- Navigation -->
    <nav
      class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
      <!-- Left: Logo + App Name -->
      <NuxtLink to="/" class="flex items-center space-x-3 hover:opacity-80 transition-opacity">
        <img src="/logo.png" alt="Logo" class="w-8 h-8" />
        <h1 class="text-xl font-semibold text-gray-800 dark:text-white">FinalPick</h1>
      </NuxtLink>

      <!-- Right: Buttons -->
      <div class="flex items-center space-x-4">
        <!-- Color mode switch -->
        <UColorModeButton />

        <!-- Profile avatar (clickable) -->
        <NuxtLink to="/profile">
          <UAvatar
            :src="avatarUrl || undefined"
            alt="Profile"
            size="md"
            class="cursor-pointer"
          />
        </NuxtLink>

        <!-- Logout -->
        <UButton
          icon="i-lucide-log-out"
          @click="logout"
          size="md"
          color="error"
          variant="ghost"
          class="cursor-pointer"
        />
      </div>
    </nav>

    <!-- Page content -->
    <main class="p-4">
      <slot />
    </main>
  </div>
</template>
