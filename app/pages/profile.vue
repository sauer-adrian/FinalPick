<script setup lang="ts">
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
const uploadedFile = ref<File | null>(null)
const avatarPreview = ref('')

// preview blob URL cleanup
let blobUrl = null
function setPreviewFromFile(file) {
  if (blobUrl) URL.revokeObjectURL(blobUrl)
  blobUrl = URL.createObjectURL(file)
  avatarPreview.value = blobUrl
}

watch(uploadedFile, (f) => { if (f) setPreviewFromFile(f) })
onBeforeUnmount(() => { if (blobUrl) URL.revokeObjectURL(blobUrl) })

onMounted(async () => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.value.id)
    .single()

  if (data) {
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
            <!-- Avatar is now the uploader -->
            <<!-- Avatar is the uploader + floating pencil button (not clipped) -->
              <UFileUpload v-slot="{ open, removeFile }" v-model="uploadedFile" accept="image/*" :multiple="false"
                :dropzone="false" :interactive="false">
                <div class="relative inline-block">
                  <!-- click anywhere on avatar to choose file -->
                  <button type="button" @click="open()"
                    class="rounded-full ring-1 ring-white/10 hover:ring-primary/40 transition focus:outline-none"
                    aria-label="Change profile picture" title="Change profile picture">
                    <UAvatar size="xl" :src="avatarPreview || undefined" icon="i-lucide-image"
                      :ui="{ root: 'rounded-full', image: 'object-cover' }" />
                  </button>

                  <!-- floating pencil: sibling -> not clipped by avatar crop -->
                  <UButton icon="i-lucide-pencil" size="xs" color="primary" variant="solid" @click.stop="open()"
                    :ui="{ base: 'rounded-full p-1' }" class="absolute -bottom-1 -right-1 shadow"
                    aria-label="Upload new picture" title="Upload new picture" />
                </div>

                <!-- Optional: remove picked (unsaved) file -->
                <UButton v-if="uploadedFile" size="xs" variant="link" color="neutral" class="p-0 mt-1" label="Remove"
                  @click="removeFile()" />
              </UFileUpload>


              <!-- Name fields -->
              <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="First Name">
                  <UInput v-model="profile.firstname" placeholder="Enter your first name" />
                </UFormField>

                <UFormField label="Last Name">
                  <UInput v-model="profile.lastname" placeholder="Enter your last name" />
                </UFormField>
              </div>
          </div>
        </div>
      </UCard>

      <!-- Gaming Accounts Section -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-medium text-gray-700 dark:text-white">Connected Accounts</h3>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Steam Username">
            <UInput v-model="profile.steam_username" placeholder="Enter your Steam username"
              icon="i-lucide-gamepad-2" />
          </UFormField>

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
