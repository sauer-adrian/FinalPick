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
  <div class="min-h-screen bg-white dark:bg-slate-900">
    <!-- Header -->
    <header
      class="sticky top-0 z-50 border-b border-black/5 dark:border-white/5
             bg-white/90 dark:bg-slate-900/85 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
      <nav class="mx-auto max-w-7xl h-14 px-4 sm:px-6 flex items-center justify-between">
        <!-- Left: Brand -->
        <NuxtLink to="/" class="flex items-center gap-3 shrink-0 group">
          <img
            src="/logo.png"
            alt="FinalPick logo"
            class="w-7 h-7 rounded-md ring-1 ring-black/5 dark:ring-white/10 group-hover:opacity-95 transition-opacity"
          />
          <span class="text-base font-semibold text-gray-900 dark:text-white group-hover:opacity-90 transition-opacity">
            FinalPick
          </span>
        </NuxtLink>

      <!-- Right: Buttons -->
      <div class="flex items-center space-x-4">
        <UColorModeSwitch />

          <!-- Divider -->
          <span class="h-6 w-px bg-black/5 dark:bg-white/10" aria-hidden="true" />

          <!-- User -->
          <UUser
            to="/profile"
            :name="displayName"
            :description="displayDescription"
            :avatar="{ src: avatarUrl || undefined, alt: displayName }"
            size="md"
            class="cursor-pointer"
            :ui="{
              name: 'text-sm',
              description: 'hidden sm:inline text-xs text-gray-500',
              avatar: 'transition-transform group-hover/user:scale-110'
            }"
          />
        </div>
      </nav>
    </header>

    <!-- Page -->
    <main class="mx-auto max-w-7xl px-4 sm:px-6 py-4">
      <slot />
    </main>
  </div>
</template>