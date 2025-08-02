<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const profile = ref({
  firstname: '',
  lastname: '',
  steam_username: '',
  discord_username: ''
})

const loading = ref(false)

onMounted(async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.value.id)
    .single()

  if (!error && data) {
    profile.value = data
  }
})

async function saveProfile() {
  loading.value = true
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.value.id,
      ...profile.value
    })
  loading.value = false
  if (!error) alert('Profile updated!')
}
</script>

<template>
  <UContainer>
    <h2 class="text-xl font-semibold mb-4">Your Profile</h2>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UInput v-model="profile.firstname" placeholder="First Name" label="First Name" />
      <UInput v-model="profile.lastname" placeholder="Last Name" label="Last Name" />
      <UInput v-model="profile.steam_username" placeholder="Steam Username" label="Steam Username" />
      <UInput v-model="profile.discord_username" placeholder="Discord Username" label="Discord Username" />
    </div>

    <div class="mt-6">
      <UButton @click="saveProfile" :loading="loading">Save</UButton>
    </div>
  </UContainer>
</template>
