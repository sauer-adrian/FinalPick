<!-- pages/login.vue -->
<script setup lang="ts">
definePageMeta({ layout: false })

import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const supabase = useSupabaseClient()
const router = useRouter()
const toast = useToast()

// Toggle between "login" and "signup"
const mode = ref<'login' | 'signup'>('login')

// Zod schemas (stricter for signup)
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Required')
})
const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters')
})
const schema = computed(() => (mode.value === 'login' ? loginSchema : signupSchema))

// Fields adjust with mode if you want to vary labels/placeholders
const fields = computed(() => ([
  {
    name: 'email',
    type: 'text' as const,
    label: 'Email',
    placeholder: 'Enter your email',
    required: true
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password' as const,
    placeholder: mode.value === 'login' ? 'Enter your password' : 'Create a password',
    required: true
  }
]))

// Optional: OAuth providers via Supabase
type OAuthProvider = 'google' | 'github'
async function oauth(provider: OAuthProvider) {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/` } // adjust if you have a callback page
    })
    if (error) throw error
  } catch (err: any) {
    toast.add({ title: 'OAuth error', description: err.message, color: 'error' })
  }
}

const providers = [
  { label: 'Google', icon: 'i-simple-icons-google', onClick: () => oauth('google') },
  { label: 'GitHub', icon: 'i-simple-icons-github', onClick:  () => oauth('github') }
]

// Loading + inline error message (shown in #validation slot)
const loading = ref(false)
const inlineError = ref<string>('')

// Access form state (so forgot-password can read typed email)
const authForm = useTemplateRef('authForm')

// Forgot password (uses typed email from the form)
async function onForgotPassword() {
  const email = authForm.value?.state?.email as string | undefined
  if (!email) {
    toast.add({ title: 'Enter your email first', description: 'Type your email above, then click Forgot password.', color: 'warning' })
    return
  }
  try {
    loading.value = true
    inlineError.value = ''
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account/reset-password`
    })
    if (error) throw error
    toast.add({ title: 'Reset email sent', description: 'Check your inbox for the reset link.' })
  } catch (err: any) {
    inlineError.value = err.message || 'Failed to send reset email.'
  } finally {
    loading.value = false
  }
}

// Ensure profiles row exists
async function ensureProfile(userId: string) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  // If not found (PGRST116) insert a blank profile
  if (profileError?.code === 'PGRST116') {
    await supabase.from('profiles').insert({
      id: userId,
      firstname: '',
      lastname: '',
      steam_username: '',
      discord_username: ''
    })
  }
}

// Handle submit for both modes
async function onSubmit(payload: FormSubmitEvent<any>) {
  inlineError.value = ''
  loading.value = true
  try {
    const { email, password } = payload.data

    if (mode.value === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      const userId = data.user?.id
      if (userId) await ensureProfile(userId)

      toast.add({ title: 'Logged in', description: 'Welcome back!' })
      router.push('/')
      return
    }

    // Sign up
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    toast.add({
      title: 'Check your email',
      description: 'We sent you a confirmation link to finish creating your account.'
    })
    // Optionally switch to login mode after signup
    mode.value = 'login'
  } catch (err: any) {
    inlineError.value = err.message || 'Something went wrong.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        ref="authForm"
        :schema="schema"
        :fields="fields"
        :providers="providers"
        :loading="loading"
        :submit="{ label: mode === 'login' ? 'Continue' : 'Create account', block: true }"
        :title="mode === 'login' ? 'Welcome back!' : 'Create your account'"
        :icon="mode === 'login' ? 'i-lucide-lock' : 'i-lucide-user-plus'"
        @submit="onSubmit"
      >
        <template #description>
          <div class="space-y-1">
            <p v-if="mode === 'login'">
              Enter your credentials to access your account.
            </p>
            <p v-else>
              Start your FinalPick journey in seconds.
            </p>
            <p class="mt-2">
              <ULink
                as="button"
                class="text-primary font-medium"
                @click="mode = mode === 'login' ? 'signup' : 'login'"
              >
                {{ mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in" }}
              </ULink>
            </p>
          </div>
        </template>

        <!-- Inline error area -->
        <template #validation>
          <UAlert
            v-if="inlineError"
            color="error"
            icon="i-lucide-info"
            :title="inlineError"
          />
        </template>

        <!-- Footer: terms + forgot password -->
        <template #footer>
          <div class="flex flex-col items-center gap-2">
            <button
              type="button"
              class="text-primary font-medium"
              @click="onForgotPassword"
            >
              Forgot password?
            </button>
            <p class="text-muted">
              By continuing, you agree to our
              <ULink to="/legal/terms" class="text-primary font-medium">Terms of Service</ULink>.
            </p>
          </div>
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>