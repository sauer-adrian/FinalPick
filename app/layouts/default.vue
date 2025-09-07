<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()

async function logout() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}

// Load avatar + names if available
const avatarUrl = ref<string | null>(null)
const firstName = ref<string | null>(null)
const lastName = ref<string | null>(null)

watchEffect(async () => {
  if (user.value?.id) {
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url, firstname, lastname')
      .eq('id', user.value.id)
      .single()

    if (!error && data) {
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.avatar_url ?? '')

      avatarUrl.value = data.avatar_url ? urlData.publicUrl : null
      firstName.value = data.firstname
      lastName.value = data.lastname
    } else {
      avatarUrl.value = null
      firstName.value = null
      lastName.value = null
    }
  }
})

// Display fields
const displayName = computed(() => {
  const fn = firstName.value?.trim()
  const ln = lastName.value?.trim()
  if (fn || ln) return [fn, ln].filter(Boolean).join(' ')
  // fallback: email local part or generic
  return user.value?.email?.split('@')[0] || 'Profile'
})
const displayDescription = computed(() => user.value?.email || undefined)
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
        <UColorModeButton />

        <!-- User (clickable -> /profile) -->
        <UUser to="/profile" :name="displayName" :description="displayDescription"
          :avatar="{ src: avatarUrl || undefined, alt: displayName }" size="md" class="cursor-pointer" />

      </div>
    </nav>

    <main class="p-4">
      <slot />
    </main>
  </div>
</template>
