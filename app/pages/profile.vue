<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watchEffect, computed } from 'vue'
import { z } from 'zod'
import { useSupabaseClient, useSupabaseUser, useRuntimeConfig } from '#imports' // @nuxtjs/supabase

// If you have generated DB types, prefer:
// type Profile = Database['public']['Tables']['profiles']['Row']
type Profile = {
  id: string
  firstname: string | null
  lastname: string | null
  steam_username: string | null
  discord_username: string | null
  avatar_url: string | null
}

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const config = useRuntimeConfig()

// --- Feature flags (optional)
const USE_SIGNED_URLS = Boolean(config.public?.useSignedAvatarUrls ?? false)

// --- validation schema (zod)
const profileSchema = z.object({
  id: z.string().min(1),
  firstname: z.string().max(100).nullable().optional(),
  lastname: z.string().max(100).nullable().optional(),
  steam_username: z
    .string()
    .max(100)
    .nullable()
    .optional(),
  // Basic Discord handle validation; adjust if you're on the new username system
  discord_username: z
    .string()
    .regex(/^.{2,32}#\d{4}$|^.{2,32}$/)
    .nullable()
    .optional(),
  avatar_url: z.string().nullable().optional()
})

// --- state
const loadingInitial = ref(true)
const saving = ref(false)
const uploadedFile = ref<File | null>(null)
const avatarPreview = ref<string>('')

const emptyProfile: Profile = {
  id: '',
  firstname: null,
  lastname: null,
  steam_username: null,
  discord_username: null,
  avatar_url: null
}

const profile = ref<Profile>({ ...emptyProfile })
const originalProfile = ref<Profile>({ ...emptyProfile })

// Keep track of previous stored avatar to optionally delete it after a successful upload
const previousAvatarPath = ref<string | null>(null)

// --- local blob URL cleanup for optimistic preview
let blobUrl: string | null = null
function setPreviewFromFile(file: File) {
  if (blobUrl) URL.revokeObjectURL(blobUrl)
  blobUrl = URL.createObjectURL(file)
  avatarPreview.value = blobUrl
}

watchEffect(() => {
  if (uploadedFile.value) setPreviewFromFile(uploadedFile.value)
})

onBeforeUnmount(() => { if (blobUrl) URL.revokeObjectURL(blobUrl) })

// guard: user may be null on first render
const userId = computed(() => user.value?.id ?? null)
const isReady = computed(() => !!userId.value)

const isDirty = computed(() => JSON.stringify(profile.value) !== JSON.stringify(originalProfile.value) || !!uploadedFile.value)

// --- notifications (assuming your useNotify composable in app)
const { notify } = useNotify()

// --- basic file validation (no extra deps)
function validateImage(file: File): string | null {
  const maxBytes = 2 * 1024 * 1024 // 2MB
  if (!file.type.startsWith('image/')) return 'Please choose an image file.'
  if (file.size > maxBytes) return 'Image is too large (max 2MB).'
  return null
}

// Optional: downscale/compress image client-side to keep things snappy
async function downscaleImage(file: File, maxSize = 512) {
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(maxSize / bmp.width, maxSize / bmp.height, 1)
    const width = Math.round(bmp.width * scale)
    const height = Math.round(bmp.height * scale)

    // OffscreenCanvas when available; fallback to HTMLCanvasElement
    const offscreenSupported = typeof OffscreenCanvas !== 'undefined'
    const canvas: any = offscreenSupported ? new OffscreenCanvas(width, height) : document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bmp, 0, 0, width, height)

    const blob: Blob = offscreenSupported
      ? await (canvas as OffscreenCanvas).convertToBlob({ type: 'image/jpeg', quality: 0.9 })
      : await new Promise<Blob>((resolve) => (canvas as HTMLCanvasElement).toBlob((b) => resolve(b as Blob), 'image/jpeg', 0.9))

    return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
  } catch {
    // If anything fails, just return original file
    return file
  }
}

async function getAvatarUrl(path: string): Promise<string> {
  if (!path) return ''
  if (USE_SIGNED_URLS) {
    const { data, error } = await supabase.storage.from('avatars').createSignedUrl(path, 60)
    if (error) return ''
    return data.signedUrl
  }
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
  return urlData.publicUrl
}

// only fetch when we have a user
async function fetchProfile() {
  if (!userId.value) return
  loadingInitial.value = true
  try {
    const { data: row, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId.value)
      .maybeSingle()

    if (error) throw error

    const incoming: Profile = (row ?? { ...emptyProfile, id: userId.value }) as Profile

    profile.value = { ...incoming }
    originalProfile.value = { ...incoming }
    previousAvatarPath.value = incoming.avatar_url ?? null

    avatarPreview.value = incoming.avatar_url ? await getAvatarUrl(incoming.avatar_url) : ''
  } catch (err: any) {
    notify({
      title: 'Could not load profile',
      description: err?.message ?? 'Unknown error',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
  } finally {
    loadingInitial.value = false
  }
}

onMounted(fetchProfile)
watchEffect(() => {
  // reactively refetch if the user changes (e.g., sign in/out)
  if (userId.value) fetchProfile()
})

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

  // quick schema check before save
  try {
    profileSchema.parse({ ...profile.value, id: userId.value })
  } catch (e: any) {
    notify({ title: 'Validation failed', description: 'Please check your inputs.', icon: 'i-lucide-alert-triangle', color: 'warning' })
    return
  }

  saving.value = true

  let newFilePath: string | null = null

  try {
    // ensure id is set
    profile.value.id = userId.value as string

    // Upload new file if selected
    if (uploadedFile.value) {
      let file = uploadedFile.value

      const validationError = validateImage(file)
      if (validationError) throw new Error(validationError)

      file = await downscaleImage(file, 512)

      // Prefer extension from MIME type; fallback to original name
      const mimeExt = (file.type.split('/')[1] || '').toLowerCase()
      const nameExt = file.name.split('.').pop()?.toLowerCase()
      const ext = mimeExt || nameExt || 'jpg'

      const filePath = `${userId.value}/${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: 'public, max-age=3600, immutable',
          upsert: true
        })

      if (uploadError) throw uploadError

      newFilePath = filePath
      profile.value.avatar_url = filePath

      avatarPreview.value = await getAvatarUrl(filePath)
    }

    // Persist profile
    const { error } = await supabase
      .from('profiles')
      .upsert(profile.value, { onConflict: 'id' })

    if (error) throw error

    // Optional: cleanup previous avatar after successful upsert
    if (uploadedFile.value && previousAvatarPath.value && previousAvatarPath.value !== profile.value.avatar_url) {
      await supabase.storage.from('avatars').remove([previousAvatarPath.value]).catch(() => {})
    }

    // update baselines
    previousAvatarPath.value = profile.value.avatar_url ?? null
    originalProfile.value = { ...profile.value }
    uploadedFile.value = null

    notify({
      title: 'Profile updated',
      description: 'Your changes have been saved.',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
  } catch (err: any) {
    // Rollback newly uploaded file if DB write fails
    if (newFilePath) {
      await supabase.storage.from('avatars').remove([newFilePath]).catch(() => {})
    }

    notify({
      title: 'Update failed',
      description: err?.message ?? 'Unknown error',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <!-- Client-only avoids SSR hydration issues with user/supabase-dependent UI -->
  <ClientOnly>
    <UContainer>
      <div class="space-y-6 max-w-2xl mx-auto py-6" :aria-busy="saving || loadingInitial">
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

          <div class="space-y-6">
            <UForm :state="profile" @submit="saveProfile">
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
                        :alt="profile.firstname || 'Avatar'"
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
                    <UInput v-model="profile.firstname" name="given-name" autocomplete="given-name" placeholder="Enter your first name" />
                  </UFormField>

                  <UFormField label="Last Name">
                    <UInput v-model="profile.lastname" name="family-name" autocomplete="family-name" placeholder="Enter your last name" />
                  </UFormField>
                </div>
              </div>

              <div class="flex justify-end mt-4">
                <UButton
                  icon="i-lucide-save"
                  type="submit"
                  :loading="saving"
                  size="md"
                  color="primary"
                  :disabled="!isReady || saving || !isDirty || loadingInitial"
                >
                  Save Changes
                </UButton>
              </div>
            </UForm>
          </div>
        </UCard>

        <!-- Gaming Accounts Section -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-medium text-gray-700 dark:text-white">Connected Accounts</h3>
          </template>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Steam Username">
              <UInput v-model="profile.steam_username" name="steam" autocomplete="username" placeholder="Enter your Steam username" icon="i-lucide-gamepad-2" />
            </UFormField>

            <UFormField label="Discord Username">
              <UInput v-model="profile.discord_username" name="discord" autocomplete="off" placeholder="Enter your Discord handle" icon="i-lucide-message-circle" />
            </UFormField>
          </div>
        </UCard>

        <!-- Loading state -->
        <div v-if="loadingInitial" class="grid grid-cols-1 gap-3">
          <USkeleton class="h-8 w-1/3" />
          <USkeleton class="h-32 w-32 rounded-full" />
          <USkeleton class="h-10 w-full" />
        </div>
      </div>
    </UContainer>

    <template #fallback>
      <UContainer>
        <div class="max-w-2xl mx-auto py-6 text-sm text-gray-500">Loading…</div>
      </UContainer>
    </template>
  </ClientOnly>
</template>

<style scoped>
/* minor focus ring tweak for better accessibility */
:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
</style>
