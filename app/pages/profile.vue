<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { z } from 'zod'
import { useSupabaseClient, useSupabaseUser, navigateTo } from '#imports'

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

// --- state
const loading = ref(true)
const saving = ref(false)
const uploadedFile = ref<File | null>(null)
const avatarPreview = ref<string>('')

const profile = ref<Profile>({
  id: '',
  firstname: null,
  lastname: null,
  steam_username: null,
  discord_username: null,
  avatar_url: null
})
const original = ref<Profile>({ ...profile.value })

// Make form fields truly full width on mobile
const fieldUi = {
  container: 'w-full', // FormField outer container
  label: '',
  description: '',
  hint: '',
  help: '',
  error: '',
  // For Nuxt UI v3 UFormField, pass-through classes to child control:
  // Using "w-full" on inputs as well to be safe.
}

// --- helpers
const userId = computed(() => user.value?.id ?? null)
const isReady = computed(() => !!userId.value)
const isDirty = computed(() => {
  const a = original.value, b = profile.value
  return (
    a.firstname !== b.firstname ||
    a.lastname !== b.lastname ||
    a.steam_username !== b.steam_username ||
    a.discord_username !== b.discord_username ||
    a.avatar_url !== b.avatar_url ||
    !!uploadedFile.value
  )
})

const schema = z.object({
  id: z.string().min(1),
  firstname: z.string().max(100).nullable().optional(),
  lastname: z.string().max(100).nullable().optional(),
  steam_username: z.string().max(100).nullable().optional(),
  // allow either "name#1234" or new Discord username
  discord_username: z.string().regex(/^([\w .-]{2,32}#\d{4}|[a-z0-9._]{2,32})$/i).nullable().optional(),
  avatar_url: z.string().nullable().optional()
})

async function getPublicAvatarUrl(path: string | null): Promise<string> {
  if (!path) return ''
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

async function fetchProfile() {
  if (!userId.value) return
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, firstname, lastname, steam_username, discord_username, avatar_url')
      .eq('id', userId.value)
      .maybeSingle()

    if (error) throw error

    const incoming: Profile = data ?? {
      id: userId.value,
      firstname: null, lastname: null,
      steam_username: null, discord_username: null,
      avatar_url: null
    }

    profile.value = { ...incoming }
    original.value = { ...incoming }
    avatarPreview.value = await getPublicAvatarUrl(incoming.avatar_url)
  } finally {
    loading.value = false
  }
}

onMounted(fetchProfile)
watch(userId, (id) => { if (id) fetchProfile() })

// --- local file preview
let blobUrl: string | null = null
function setPreview(file: File) {
  if (blobUrl) URL.revokeObjectURL(blobUrl)
  blobUrl = URL.createObjectURL(file)
  avatarPreview.value = blobUrl
}
onMounted(() => {
  window.addEventListener('beforeunload', () => { if (blobUrl) URL.revokeObjectURL(blobUrl) })
})
onBeforeUnmount(() => {
  if (blobUrl) URL.revokeObjectURL(blobUrl)
})

// --- validation
function validateImage(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Please choose an image file.'
  if (file.size > 2 * 1024 * 1024) return 'Image is too large (max 2MB).'
  return null
}

const { notify } = useNotify()

// --- throttled success toast (avoid spam during autosave)
const lastSuccessToastAt = ref(0)
function toastSaved() {
  const now = Date.now()
  if (now - lastSuccessToastAt.value < 4000) return // throttle 4s
  lastSuccessToastAt.value = now
  notify({ title: 'Saved', description: 'Profile updated.', color: 'success', icon: 'i-lucide-check-circle' })
}

async function saveProfile() {
  if (!isReady.value) {
    notify({ title: 'Not signed in', description: 'Please sign in.', color: 'error', icon: 'i-lucide-x-circle' })
    return
  }

  // ensure id before validation
  profile.value.id = userId.value as string

  try {
    schema.parse(profile.value)
  } catch {
    notify({ title: 'Validation failed', description: 'Please check your inputs.', color: 'warning', icon: 'i-lucide-alert-triangle' })
    return
  }

  saving.value = true
  try {
    // upload avatar if present
    if (uploadedFile.value) {
      const err = validateImage(uploadedFile.value)
      if (err) throw new Error(err)

      const ext = (uploadedFile.value.type.split('/')[1] || 'jpg').toLowerCase()
      const filePath = `${userId.value}/${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(filePath, uploadedFile.value, {
          cacheControl: 'public, max-age=3600, immutable',
          upsert: false
        })
      if (uploadError) throw uploadError

      profile.value.avatar_url = filePath
      avatarPreview.value = await getPublicAvatarUrl(filePath)
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile.value, { onConflict: 'id' })
      .select()
      .single()

    if (error) throw error

    original.value = { ...(data as Profile) }
    uploadedFile.value = null

    // success toast (throttled)
    toastSaved()
  } catch (e: any) {
    notify({ title: 'Update failed', description: e?.message ?? 'Unknown error', color: 'error', icon: 'i-lucide-x-circle' })
  } finally {
    saving.value = false
  }
}

// --- autosave
function debounce<T extends (...args: any[]) => void>(fn: T, delay = 800) {
  let t: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
}

const requestSave = debounce(async () => {
  if (!isReady.value || loading.value || saving.value) return
  if (!isDirty.value) return
  await saveProfile()
}, 800)

// autosave when profile changes (deep)
watch(profile, () => { requestSave() }, { deep: true })

// when a file is selected, preview + autosave
watch(uploadedFile, (file) => {
  if (!file) return
  const err = validateImage(file)
  if (err) {
    notify({ title: 'Invalid image', description: err, color: 'warning', icon: 'i-lucide-alert-triangle' })
    uploadedFile.value = null
    return
  }
  setPreview(file)
  requestSave()
})

// protect against accidental navigation while a save is running
onMounted(() => {
  const handler = (e: BeforeUnloadEvent) => {
    if (saving.value) {
      e.preventDefault()
      e.returnValue = ''
    }
  }
  window.addEventListener('beforeunload', handler)
  onBeforeUnmount(() => window.removeEventListener('beforeunload', handler))
})

// --- logout
async function logout() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <ClientOnly>
    <div class="py-6" :aria-busy="saving || loading">
      <!-- Page header -->
      <header class="max-w-5xl mx-auto mb-4 flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-semibold">Edit Profile</h2>
          <p class="text-xs text-gray-500 mt-1">
            Update your name, avatar, and linked usernames in one place.
          </p>
        </div>

        <!-- Logout button (desktop) -->
        <UButton icon="i-lucide-log-out" color="neutral" variant="outline" :disabled="saving || loading" @click="logout"
          class="hidden sm:inline-flex" aria-label="Sign out">
          Sign out
        </UButton>
      </header>

      <!-- SINGLE CARD LAYOUT -->
      <UCard class="max-w-5xl mx-auto overflow-hidden">
        <div class="px-5 sm:px-6 pt-5 sm:pt-6 flex items-center justify-between">

          <!-- Logout button (mobile) -->
          <UButton icon="i-lucide-log-out" size="sm" color="neutral" variant="outline" :disabled="saving || loading"
            @click="logout" class="sm:hidden" aria-label="Sign out" />
        </div>

        <div class="px-5 sm:px-6 pb-5 sm:pb-6">
          <UForm :state="profile" class="w-full">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              <!-- Avatar -->
              <div class="md:col-span-3 flex justify-center md:block">
                <UFileUpload v-slot="{ open, removeFile }" v-model="uploadedFile" accept="image/*" :multiple="false"
                  :dropzone="false" :interactive="false">
                  <div class="w-28 h-28">
                    <!-- Chip overlays inside the rounded avatar -->
                    <UChip inset position="bottom-right">
                      <!-- Whole avatar is clickable -->
                      <button type="button" @click="open()"
                        class="block w-full h-full rounded-full ring-1 ring-white/10 hover:ring-primary/40 focus-visible:ring-primary/60"
                        aria-label="Change avatar">
                        <UAvatar :src="avatarPreview || undefined" :alt="profile.firstname || 'Avatar'"
                          class="w-full h-full rounded-full" :ui="{ root: 'rounded-full', image: 'object-cover' }"
                          icon="i-lucide-image" />
                      </button>

                      <!-- Chip content: a tiny edit button -->
                      <template #content>
                        <UButton icon="i-lucide-pencil" size="md" color="neutral" variant="link"
                          class="rounded-full ring-2 ring-white/80" aria-label="Edit avatar" @click.stop="open()" />
                      </template>
                    </UChip>
                  </div>

                  <div class="mt-2 text-center md:text-left">
                    <UButton v-if="uploadedFile" size="xs" variant="link" color="neutral" @click="removeFile()">
                      Remove
                    </UButton>
                    <p v-if="uploadedFile" class="text-xs text-gray-500 mt-1">
                      Selected: {{ uploadedFile.name }}
                    </p>
                  </div>
                </UFileUpload>
              </div>



              <!-- Fields -->
              <div class="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                <!-- Name -->
                <UFormField label="First Name" :ui="fieldUi" class="w-full">
                  <UInput v-model="profile.firstname" class="w-full" autocomplete="given-name" placeholder="First name"
                    :disabled="saving" />
                </UFormField>

                <UFormField label="Last Name" :ui="fieldUi" class="w-full">
                  <UInput v-model="profile.lastname" class="w-full" autocomplete="family-name" placeholder="Last name"
                    :disabled="saving" />
                </UFormField>

                <!-- Accounts -->
                <UFormField label="Steam Username" :ui="fieldUi" class="w-full">
                  <UInput v-model="profile.steam_username" class="w-full" autocomplete="username"
                    placeholder="Steam username" :disabled="saving" />
                </UFormField>

                <UFormField label="Discord Username" :ui="fieldUi" class="w-full"
                  help="Use name#1234 or the new Discord username.">
                  <UInput v-model="profile.discord_username" class="w-full" autocomplete="off"
                    placeholder="name#1234 or new username" :disabled="saving" />
                </UFormField>
              </div>
            </div>
          </UForm>
        </div>
      </UCard>
    </div>

    <template #fallback>
      <div class="py-6 text-sm text-gray-500">Loading…</div>
    </template>
  </ClientOnly>
</template>

<style scoped>
:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
</style>
