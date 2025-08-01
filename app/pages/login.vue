<script setup>
const supabase = useSupabaseClient()
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

const router = useRouter()

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
</script>

<template>
  <ClientOnly>
  <UContainer class="min-h-screen flex items-center justify-center">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
      <!-- Login Card -->
      <UCard class="p-6">
        <template #header>
          <h2 class="text-2xl font-semibold">Login</h2>
        </template>

        <form class="space-y-4" @submit.prevent="submitLogin">
          <UInput class="w-full" v-model="emailLogin" type="email" placeholder="Email" size="lg" required />
          <UInput class="w-full" v-model="passwordLogin" type="password" placeholder="Password" size="lg" required />

          <UButton :loading="loadingLogin" type="submit" size="lg" class="w-full">
            Login
          </UButton>

          <div v-if="errorLogin" class="text-red-500 text-sm text-center">
            {{ errorLogin }}
          </div>

          <div v-if="messageLogin" class="text-green-600 text-sm text-center">
            {{ messageLogin }}
          </div>
        </form>
      </UCard>

      <!-- Signup Card -->
      <UCard class="p-6">
        <template #header>
          <h2 class="text-2xl font-semibold">Sign Up</h2>
        </template>

        <form class="space-y-4" @submit.prevent="submitSignup">
          <UInput class="w-full" v-model="emailSignup" type="email" placeholder="Email" size="lg" required />
          <UInput class="w-full" v-model="passwordSignup" type="password" placeholder="Password" size="lg" required />

          <UButton :loading="loadingSignup" type="submit" size="lg" class="w-full">
            Sign Up
          </UButton>

          <div v-if="errorSignup" class="text-red-500 text-sm text-center">
            {{ errorSignup }}
          </div>

          <div v-if="messageSignup" class="text-green-600 text-sm text-center">
            {{ messageSignup }}
          </div>
        </form>
      </UCard>
    </div>
  </UContainer>
  </ClientOnly>
</template>
