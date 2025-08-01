<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()

async function logout() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Navigation -->
    <nav class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <!-- Left: Logo + App Name -->
      <div class="flex items-center space-x-3">
        <!-- Replace with your logo if you have one -->
        <img src="/logo.png" alt="Logo" class="w-8 h-8" />
        <h1 class="text-xl font-semibold text-gray-800 dark:text-white">FinalPick</h1>
      </div>

      <!-- Right: User avatar + logout -->
      <div class="flex items-center space-x-4">
        <UIcon name="i-lucide-user" class="w-6 h-6 text-gray-500 dark:text-gray-300" />
        <UButton v-if="user" @click="logout" size="sm" color="red" variant="soft">
          Logout
        </UButton>
      </div>
    </nav>

    <!-- Page content -->
    <main class="p-4">
      <slot />
    </main>
  </div>
</template>
