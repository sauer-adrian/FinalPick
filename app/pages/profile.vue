<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports' // from @nuxtjs/supabase

type Profile = {
  id: string
  firstname: string
  lastname: string
  steam_username: string
  discord_username: string
  avatar_url: string | null
}

const supabase = useSupabaseClient()
const user = useSupabaseUser()

// --- state
const loading = ref(false)
const uploadedFile = ref<File | null>(null)
const avatarPreview = ref<string>('')

const profile = ref<Profile>({
  id: '', // will be set to user id once available
  firstname: '',
  lastname: '',
  steam_username: '',
  discord_username: '',
  avatar_url: null
})

// Keep track of previous stored avatar to optionally delete it after a successful upload
const previousAvatarPath = ref<string | null>(null)

// --- local blob URL cleanup
let blobUrl: string | null = null
function setPreviewFromFile(file: File) {
  if (blobUrl) URL.revokeObjectURL(blobUrl)
  blobUrl = URL.createObjectURL(file)
  avatarPreview.value = blobUrl
}

watch(uploadedFile, (f) => { if (f) setPreviewFromFile(f) })
onBeforeUnmount(() => { if (blobUrl) URL.revokeObjectURL(blobUrl) })

// guard: user may be null on first render
const userId = computed(() => user.value?.id ?? null)
const isReady = computed(() => !!userId.value)

// only fetch when we have a user
async function fetchProfile() {
  if (!userId.value) return
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId.value)
      .single()

    if (error && error.code !== 'PGRST116') { // 116 = no rows
      throw error
    }

    // hydrate defaults
    const incoming = (data ?? {
      id: userId.value,
      firstname: '',
      lastname: '',
      steam_username: '',
      discord_username: '',
      avatar_url: null
    }) as Profile

    profile.value = incoming
    previousAvatarPath.value = incoming.avatar_url ?? null

    if (incoming.avatar_url) {
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(incoming.avatar_url)
      avatarPreview.value = urlData.publicUrl
    } else {
      avatarPreview.value = ''
    }
  } catch (err: any) {
    notify({
      title: 'Could not load profile',
      description: err?.message ?? 'Unknown error',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
  }
}

onMounted(fetchProfile)
watch(userId, (v, old) => {
  if (v && v !== old) fetchProfile()
})

// --- notifications (assuming your useNotify composable)
const { notify } = useNotify()

// --- basic file validation (no extra deps)
function validateImage(file: File): string | null {
  const maxBytes = 2 * 1024 * 1024 // 2MB
  if (!file.type.startsWith('image/')) return 'Please choose an image file.'
  if (file.size > maxBytes) return 'Image is too large (max 2MB).'
  return null
}

async function saveProfile() {
  if (!isReady.value) {
    notify({
      title: 'Not signed in',
      description: 'Please sign in to update your profile.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
    return
  }

  loading.value = true

  try {
    // Ensure profile has current user id
    profile.value.id = userId.value as string

    // Upload new file if selected
    if (uploadedFile.value) {
      const file = uploadedFile.value

      const validationError = validateImage(file)
      if (validationError) {
        throw new Error(validationError)
      }

      // Use a stable UUID-based path; keep original extension
      const ext = file.name.split('.').pop() || 'jpg'
      const filePath = `${userId.value}/${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Update avatar path in profile
      profile.value.avatar_url = filePath

      // Public URL for preview (assuming bucket is public)
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      avatarPreview.value = urlData.publicUrl
    }

    // Persist profile
    const { error } = await supabase
      .from('profiles')
      .upsert(profile.value)

    if (error) throw error

    // Optional: cleanup previous avatar after successful upsert
    if (uploadedFile.value && previousAvatarPath.value && previousAvatarPath.value !== profile.value.avatar_url) {
      await supabase.storage.from('avatars').remove([previousAvatarPath.value]).catch(() => {})
    }
    previousAvatarPath.value = profile.value.avatar_url ?? null

    notify({
      title: 'Profile updated',
      description: 'Your changes have been saved.',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })

    // clear picked file (we already preview using public URL)
    uploadedFile.value = null
  } catch (err: any) {
    notify({
      title: 'Update failed',
      description: err?.message ?? 'Unknown error',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- Client-only avoids SSR hydration issues with user/supabase-dependent UI -->
  <ClientOnly>
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
            <div class="flex items-start gap-6">
              <!-- Avatar uploader -->
              <UFileUpload
                v-slot="{ open, removeFile }"
                v-model="uploadedFile"
                accept="image/*"
                :multiple="false"
                :dropzone="false"
                :interactive="false"
              >
                <div class="relative inline-block">
                  <button
                    type="button"
                    @click="open()"
                    class="rounded-full ring-1 ring-white/10 hover:ring-primary/40 transition focus:outline-none"
                    aria-label="Change profile picture"
                    title="Change profile picture"
                  >
                    <UAvatar
                      :src="avatarPreview || undefined"
                      icon="i-lucide-image"
                      class="w-32 h-32 rounded-full"
                      :ui="{ root: 'rounded-full', image: 'object-cover' }"
                    />
                  </button>

                  <UButton
                    icon="i-lucide-pencil"
                    size="sm"
                    color="primary"
                    variant="solid"
                    @click.stop="open()"
                    :ui="{ base: 'rounded-full p-1.5' }"
                    class="absolute -bottom-2 -right-2 shadow"
                    aria-label="Upload new picture"
                    title="Upload new picture"
                  />
                </div>

                <div class="mt-1">
                  <UButton
                    v-if="uploadedFile"
                    size="xs"
                    variant="link"
                    color="neutral"
                    class="p-0"
                    label="Remove"
                    @click="removeFile()"
                  />
                  <p v-if="uploadedFile" class="text-xs text-gray-500 mt-1">
                    Selected: {{ uploadedFile.name }}
                  </p>
                </div>
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
              <UInput v-model="profile.steam_username" placeholder="Enter your Steam username" icon="i-lucide-gamepad-2" />
            </UFormField>

            <UFormField label="Discord Username">
              <UInput v-model="profile.discord_username" placeholder="Enter your Discord handle" icon="i-lucide-message-circle" />
            </UFormField>
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
            :disabled="!isReady || loading"
          >
            Save Changes
          </UButton>
        </div>
      </div>
    </UContainer>

    <template #fallback>
      <UContainer><div class="max-w-2xl mx-auto py-6 text-sm text-gray-500">Loading…</div></UContainer>
    </template>
  </ClientOnly>
</template>