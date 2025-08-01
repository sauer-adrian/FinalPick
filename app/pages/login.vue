<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

const supabase = useSupabaseClient()
const router = useRouter()

const emailLogin = ref('')
const passwordLogin = ref('')
const emailSignup = ref('')
const passwordSignup = ref('')

const loadingLogin = ref(false)
const loadingSignup = ref(false)

const errorLogin = ref('')
const messageLogin = ref('')

const errorSignup = ref('')
const messageSignup = ref('')

async function submitLogin() {
  loadingLogin.value = true
  errorLogin.value = ''
  messageLogin.value = ''

  const { error } = await supabase.auth.signInWithPassword({
    email: emailLogin.value,
    password: passwordLogin.value
  })

  loadingLogin.value = false

  if (error) {
    errorLogin.value = error.message
  } else {
    messageLogin.value = 'Logged in successfully.'
    router.push('/')
  }
}

async function submitSignup() {
  loadingSignup.value = true
  errorSignup.value = ''
  messageSignup.value = ''

  const { error } = await supabase.auth.signUp({
    email: emailSignup.value,
    password: passwordSignup.value
  })

  loadingSignup.value = false

  if (error) {
    errorSignup.value = error.message
  } else {
    messageSignup.value = 'Signup successful! Check your email to confirm.'
  }
}

const tabItems: TabsItem[] = [
  {
    label: 'Login',
    icon: 'i-lucide-log-in',
    slot: 'login',
  },
  {
    label: 'Sign Up',
    icon: 'i-lucide-user-plus',
    slot: 'signup',
  }
]
</script>

<template>
  <ClientOnly>
    <UContainer class="min-h-screen flex items-center justify-center">
      <UCard class="w-full max-w-md p-6">
        <template #header>
          <h2 class="text-3xl font-bold text-center">FinalPick</h2>
        </template>
        <UTabs :items="tabItems" class="w-full" variant="pill" size="lg">
          <!-- Login Tab -->
          <template #login>
            <form class="space-y-4" @submit.prevent="submitLogin">
              <UInput v-model="emailLogin" type="email" placeholder="Email" size="lg" class="w-full text-base" required />
              <UInput v-model="passwordLogin" type="password" placeholder="Password" size="lg" class="w-full text-base"
                required />
              <UButton :loading="loadingLogin" type="submit" size="lg" class="w-full text-center">
                Login
              </UButton>

              <div v-if="errorLogin" class="text-red-500 text-center">
                {{ errorLogin }}
              </div>
              <div v-if="messageLogin" class="text-green-600 text-center">
                {{ messageLogin }}
              </div>
            </form>
          </template>

          <!-- Signup Tab -->
          <template #signup>
            <form class="space-y-4" @submit.prevent="submitSignup">
              <UInput v-model="emailSignup" type="email" placeholder="Email" size="lg" class="w-full text-base" required />
              <UInput v-model="passwordSignup" type="password" placeholder="Password" size="lg" class="w-full text-base"
                required />
              <UButton :loading="loadingSignup" type="submit" size="lg" class="w-full text-center">
                Sign Up
              </UButton>

              <div v-if="errorSignup" class="text-red-500 text-center">
                {{ errorSignup }}
              </div>
              <div v-if="messageSignup" class="text-green-600 text-center">
                {{ messageSignup }}
              </div>
            </form>
          </template>
        </UTabs>
      </UCard>
    </UContainer>
  </ClientOnly>
</template>
