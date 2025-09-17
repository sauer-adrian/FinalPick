<template>
  <main class="prose max-w-none">
    <!-- Uses $route.path (/legal/<slug>) by default -->
    <ContentDoc>
      <template #not-found>
        <h1>Not found</h1>
        <p>We couldn’t find this legal page.</p>
      </template>
    </ContentDoc>
  </main>
</template>
