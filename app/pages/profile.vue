<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const profile = ref({
  firstname: '',
  lastname: '',
  steam_username: '',
  discord_username: '',
  avatar_url: ''
})

const loading = ref(false)
const uploadedFile = ref(null)
const avatarPreview = ref('')

onMounted(async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.value.id)
    .single()

  if (!error && data) {
    profile.value = data

    if (profile.value.avatar_url) {
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(profile.value.avatar_url)

      avatarPreview.value = urlData.publicUrl
    }
  }
})

const { notify } = useNotify()

async function saveProfile() {
  loading.value = true

  // Upload new file if selected
  if (uploadedFile.value) {
    const file = uploadedFile.value
    const filePath = `${user.value.id}/${Date.now()}_${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      notify({
        title: 'Upload failed',
        description: uploadError.message,
        icon: 'i-lucide-x-circle',
        color: 'error'
      })
      loading.value = false
      return
    }

    profile.value.avatar_url = filePath

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    avatarPreview.value = urlData.publicUrl
  }

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
          <h3 class="text-lg font-medium text-gray-700 dark:text-white">
            Personal Information
          </h3>
        </template>

        <div class="space-y-6">
          <!-- Avatar + names in one row -->
          <div class="flex items-start gap-6">
            <!-- Avatar -->
            <img v-if="avatarPreview" :src="avatarPreview" alt="Profile Picture"
              class="w-24 h-24 rounded-full object-cover" />

            <!-- Name fields -->
            <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- First Name -->
              <UFormField label="First Name">
                <UInput v-model="profile.firstname" placeholder="Enter your first name" />
              </UFormField>

              <!-- Last Name -->
              <UFormField label="Last Name">
                <UInput v-model="profile.lastname" placeholder="Enter your last name" />
              </UFormField>
            </div>
          </div>

          <!-- File upload section -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              Upload Profile Picture
            </label>
            <UFileUpload v-model="uploadedFile" accept="image/*" :multiple="false" color="primary" variant="area"
              class="w-full min-h-36" label="Drop your image here" description="PNG, JPG, or WebP (max. 2 MB)" />
          </div>
        </div>
      </UCard>

      <!-- Gaming Accounts Section -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-medium text-gray-700 dark:text-white">Connected Accounts</h3>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Steam Username -->
          <UFormField label="Steam Username">
            <UInput v-model="profile.steam_username" placeholder="Enter your Steam username"
              icon="i-lucide-gamepad-2" />
          </UFormField>

          <!-- Discord Username -->
          <UFormField label="Discord Username">
            <UInput v-model="profile.discord_username" placeholder="Enter your Discord handle"
              icon="i-lucide-message-circle" />
          </UFormField>
        </div>
      </UCard>

      <!-- Save Button -->
      <div class="flex justify-end">
        <UButton icon="i-lucide-save" @click="saveProfile" :loading="loading" size="md" color="primary">
          Save Changes
        </UButton>
      </div>
    </div>
  </UContainer>
</template>
