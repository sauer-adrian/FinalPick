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

const uploadedFile = ref(null)
const imageUrl = ref('')
const loading = ref(false)

const { notify } = useNotify()

onMounted(async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.value.id)
    .single()

  if (!error && data) {
    profile.value = data

    if (profile.value.avatar_url) {
      const { data: urlData } = await supabase.storage
        .from('avatars')
        .getPublicUrl(profile.value.avatar_url)

      imageUrl.value = urlData?.publicUrl || ''
    }
  }
})

async function handleFileUpload(file) {
  if (!file || !user.value?.id) return

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
    return
  }

  profile.value.avatar_url = filePath

  const { data: urlData } = await supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  imageUrl.value = urlData?.publicUrl || ''
}

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
      <div>
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-white">Edit Profile</h2>
        <p class="text-gray-500 text-sm">Update your personal details and connected accounts.</p>
      </div>

      <UCard>
        <template #header>
          <h3 class="text-lg font-medium text-gray-700 dark:text-white">Personal Information</h3>
        </template>

        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <UAvatar
              size="lg"
              :src="imageUrl || undefined"
              icon="i-lucide-user"
            />
          </div>

          <UFileUpload
            v-model="uploadedFile"
            accept="image/*"
            label="Upload profile picture"
            description="PNG, JPG, or GIF (max. 2MB)"
            class="w-full"
            @change="handleFileUpload($event[0])"
          />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UInput v-model="profile.firstname" label="First Name" placeholder="Enter your first name" />
            <UInput v-model="profile.lastname" label="Last Name" placeholder="Enter your last name" />
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h3 class="text-lg font-medium text-gray-700 dark:text-white">Connected Accounts</h3>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UInput v-model="profile.steam_username" label="Steam Username" placeholder="Enter your Steam username" icon="i-lucide-gamepad-2" />
          <UInput v-model="profile.discord_username" label="Discord Username" placeholder="Enter your Discord handle" icon="i-lucide-message-circle" />
        </div>
      </UCard>

      <div class="flex justify-end">
        <UButton icon="i-lucide-save" @click="saveProfile" :loading="loading" size="md" color="primary">
          Save Changes
        </UButton>
      </div>
    </div>
  </UContainer>
</template>