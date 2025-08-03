<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const profile = ref({
  firstname: '',
  lastname: '',
  steam_username: '',
  discord_username: ''
})

const loading = ref(false)

onMounted(async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.value.id)
    .single()

  if (!error && data) {
    profile.value = data
  }
})

const { notify } = useNotify()

async function saveProfile() {
  loading.value = true
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.value.id,
      ...profile.value
    })
  loading.value = false

  if (!error) {
    notify({
      title: 'Profile updated',
      description: 'Your changes have been saved.',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
  } else {
    notify({
      title: 'Update failed',
      description: error.message,
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
  }
}
</script>

<template>
  <UContainer>
    <div class="space-y-6 max-w-2xl mx-auto py-6">
      <!-- Title -->
      <div>
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-white">Edit Profile</h2>
        <p class="text-gray-500 text-sm">Update your personal details and connected accounts.</p>
      </div>

      <!-- Personal Info Section -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-medium text-gray-700 dark:text-white">Personal Information</h3>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UInput
            v-model="profile.firstname"
            label="First Name"
            placeholder="Enter your first name"
          />
          <UInput
            v-model="profile.lastname"
            label="Last Name"
            placeholder="Enter your last name"
          />
        </div>
      </UCard>

      <!-- Gaming Accounts Section -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-medium text-gray-700 dark:text-white">Connected Accounts</h3>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UInput
            v-model="profile.steam_username"
            label="Steam Username"
            placeholder="Enter your Steam username"
            icon="i-lucide-gamepad-2"
          />
          <UInput
            v-model="profile.discord_username"
            label="Discord Username"
            placeholder="Enter your Discord handle"
            icon="i-lucide-message-circle"
          />
        </div>
      </UCard>

      <!-- Save Button -->
      <div class="flex justify-end">
        <UButton
          icon="i-lucide-save"
          @click="saveProfile"
          :loading="loading"
          size="md"
          color="primary"
        >
          Save Changes
        </UButton>
      </div>
    </div>
  </UContainer>
</template>
