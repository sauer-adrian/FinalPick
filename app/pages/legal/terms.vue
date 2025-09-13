<script setup lang="ts">
const EFFECTIVE_DATE = '13 September 2025' // update as needed

definePageMeta({
  // If you have a global auth middleware, mark this route as public.
  // Adapt the key to whatever your middleware expects.
  auth: false
})

useSeoMeta({
  title: 'Terms of Service – FinalPick',
  ogTitle: 'Terms of Service – FinalPick',
  description: 'Terms of Service for using FinalPick.',
  ogDescription: 'Terms of Service for using FinalPick.'
})
</script>

<template>
  <div class="min-h-screen">
    <UContainer class="py-10">
      <h1>Terms of Service – FinalPick</h1>
      <p><strong>Effective Date:</strong> {{ EFFECTIVE_DATE }}</p>

      <h2>1. About FinalPick</h2>
      <p>
        FinalPick is a hobby project that helps groups of friends decide which game to play at a LAN party or
        similar gathering.
        Registered users can:
      </p>
      <ul>
        <li>Search for games via the Steam API.</li>
        <li>Add games to a shared grid.</li>
        <li>Vote up or down on listed games.</li>
        <li>View the results and play the top-voted game.</li>
        <li>Create a simple profile with a name, Steam username, and Discord username.</li>
      </ul>
      <p>FinalPick is provided “as is” for entertainment purposes only.</p>

      <h2>2. Eligibility</h2>
      <p>You must be at least 16 years old to use FinalPick. By using the Service, you confirm that you meet this
        requirement.</p>

      <h2>3. Accounts and Profiles</h2>
      <ul>
        <li>You may create an account to participate in voting and game selection.</li>
        <li>You are responsible for keeping your login credentials secure.</li>
        <li>You may update your profile information at any time.</li>
        <li>You may delete your account if you no longer wish to use FinalPick.</li>
      </ul>

      <h2>4. User Content</h2>
      <ul>
        <li>Users may submit content such as profile names and selected games.</li>
        <li>You are solely responsible for the content you provide.</li>
        <li>You agree not to upload or share unlawful, offensive, or misleading content.</li>
        <li>
          FinalPick reserves the right to remove any content or account at any time, without notice, if it violates
          these Terms or harms the Service.
        </li>
      </ul>

      <h2>5. Steam and Third-Party Services</h2>
      <p>Game data comes from the Steam API. FinalPick is not affiliated with, endorsed by, or partnered with Valve,
        Steam, or Discord. Use of Steam or Discord accounts remains subject to their own terms of service.</p>

      <h2>6. Data and Privacy</h2>
      <ul>
        <li>FinalPick stores limited personal information (first name, last name, Steam username, Discord username).
        </li>
        <li>Data is stored securely and is not shared with third parties, except as technically necessary to provide
          the Service.</li>
        <li>You may delete your account and associated data at any time.</li>
        <li>More details are explained in our <NuxtLink to="/legal/privacy">Privacy Policy</NuxtLink>.</li>
      </ul>

      <h2>7. Limitation of Liability</h2>
      <p>
        FinalPick is provided as a free hobby project with no guarantees of availability, accuracy, or reliability.
        To the fullest extent permitted by law, FinalPick is not liable for any damages, losses, or issues arising
        from your use of the Service,
        including reliance on user-submitted content or technical errors.
      </p>

      <h2>8. Changes to the Service</h2>
      <p>
        FinalPick may modify or discontinue parts of the Service at any time, without prior notice.
        We may update these Terms from time to time. Updated Terms will be posted on this page with a new effective
        date.
      </p>

      <h2>9. Governing Law</h2>
      <p>These Terms are governed by the laws of Germany. Any disputes shall be handled by the competent courts in
        Germany.</p>

      <h2>10. Contact</h2>
      <p>For questions about these Terms, please reach out via the website’s contact form or official channels.</p>

      <hr />
      <p class="text-sm">
        Also see: <NuxtLink to="/legal/privacy">Privacy Policy</NuxtLink> · <NuxtLink to="/legal/impressum">
          Impressum</NuxtLink>
      </p>
    </UContainer>
  </div>
</template>