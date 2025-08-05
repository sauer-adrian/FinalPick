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
    <div class="max-w-3xl mx-auto py-10 space-y-10">
      <!-- Page Header -->
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Your Player Profile</h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Customize your identity for LAN parties and matchmaking.</p>
      </div>

      <!-- Profile Card -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-800 dark:text-white">Profile Info</h2>
          </div>
        </template>

        <div class="flex flex-col md:flex-row items-center gap-6">
          <!-- Avatar Preview -->
          <div class="flex flex-col items-center">
            <UAvatar
              :src="avatarPreview"
              alt="Avatar"
              size="xl"
              class="ring-2 ring-primary-500"
            />
            <p class="text-xs text-gray-500 mt-1">Click to update</p>

            <!-- File Upload -->
            <UFileUpload
              v-model="uploadedFile"
              accept="image/*"
              :multiple="false"
              variant="soft"
              class="mt-2 w-40"
              icon="i-lucide-upload"
              description="PNG, JPG, WebP – Max 2MB"
            />
          </div>

          <!-- Name Fields -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
            <UFormGroup label="First Name">
              <UInput v-model="profile.firstname" placeholder="John" />
            </UFormGroup>
            <UFormGroup label="Last Name">
              <UInput v-model="profile.lastname" placeholder="Doe" />
            </UFormGroup>
          </div>
        </div>
      </UCard>

      <!-- Connected Accounts -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-800 dark:text-white">Connected Accounts</h2>
            <UBadge variant="subtle" color="primary" class="text-xs">Used for matchmaking</UBadge>
          </div>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormGroup label="Steam Username" help="Used to link your gaming sessions">
            <UInput
              v-model="profile.steam_username"
              placeholder="e.g. NoScopeNinja"
              icon="i-lucide-gamepad-2"
            />
          </UFormGroup>

          <UFormGroup label="Discord Username" help="For chat and quick invites">
            <UInput
              v-model="profile.discord_username"
              placeholder="e.g. gamer#1234"
              icon="i-lucide-discord"
            />
          </UFormGroup>
        </div>
      </UCard>

      <!-- Save Button -->
      <div class="flex justify-end">
        <UButton
          icon="i-lucide-save"
          @click="saveProfile"
          :loading="loading"
          color="primary"
          size="lg"
          class="px-6"
        >
          Save Changes
        </UButton>
      </div>
    </div>
  </UContainer>
</template>