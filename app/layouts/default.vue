<template>
  <div class="min-h-screen">
    <!-- Navigation -->
    <nav class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
      <!-- Left: Logo + App Name -->
      <div class="flex items-center space-x-3">
        <NuxtLink to="/" class="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="Logo" class="w-8 h-8" />
          <h1 class="text-xl font-semibold text-gray-800 dark:text-white">FinalPick</h1>
        </NuxtLink>
      </div>

      <div class="flex items-center space-x-4">
        <UButton
          v-if="user"
          icon="i-lucide-user"
          @click="() => navigateTo('/profile')"
          size="sm"
          color="primary"
          variant="soft"
        />
        <UButton
          v-if="user"
          icon="i-lucide-log-out"
          @click="logout"
          size="sm"
          color="error"
          variant="soft"
        />
      </div>
    </nav>

    <!-- Page content -->
    <main class="p-4">
      <slot />
    </main>
  </div>
</template>