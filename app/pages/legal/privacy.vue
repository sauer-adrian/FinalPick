<script setup lang="ts">
const EFFECTIVE_DATE = '13 September 2025' // update as needed

definePageMeta({ auth: false })

useSeoMeta({
  title: 'Privacy Policy - FinalPick',
  ogTitle: 'Privacy Policy - FinalPick',
  description: 'Privacy Policy describing how FinalPick handles personal data.',
  ogDescription: 'Privacy Policy describing how FinalPick handles personal data.'
})
</script>

<template>
  <div class="min-h-screen">
    <UContainer class="py-10">
      <h1>Privacy Policy - FinalPick</h1>
      <p><strong>Effective Date:</strong> {{ EFFECTIVE_DATE }}</p>

      <p>This Privacy Policy explains how FinalPick (“we”, “our”, or “the Service”) collects, uses, and protects
        your personal data.</p>

      <h2>1. Who We Are</h2>
      <p>FinalPick is a hobby project that helps groups choose games for LAN parties. It is operated privately and
        not for commercial purposes.</p>

      <h2>2. Data We Collect</h2>
      <p>When you create and use a FinalPick account, we may collect and store:</p>
      <ul>
        <li><strong>Profile Information:</strong> First name, last name, Steam username, Discord username.</li>
        <li><strong>Account Information:</strong> Email address and login credentials (managed via Supabase).</li>
        <li><strong>Game Selections &amp; Votes:</strong> The games you add or vote for during sessions.</li>
      </ul>
      <p>We do not intentionally collect sensitive personal data.</p>

      <h2>3. How We Use Your Data</h2>
      <ul>
        <li>Provide the Service (game searching, voting, and profiles).</li>
        <li>Allow you to log in and manage your account.</li>
        <li>Display your profile information to other registered users.</li>
      </ul>
      <p>We do not sell or share your data with third parties for advertising or marketing purposes.</p>

      <h2>4. Storage and Retention</h2>
      <p>Data is stored securely using Supabase (cloud database provider). Your data is kept as long as your account
        is active. You may request account deletion at any time, which will permanently remove your data.</p>

      <h2>5. Third-Party Services</h2>
      <ul>
        <li><strong>Steam API:</strong> Game information is retrieved from Steam. We do not share your personal data
          with Steam.</li>
        <li><strong>Discord:</strong> You may enter a Discord username for display purposes only.</li>
      </ul>
      <p>FinalPick is not affiliated with Steam, Valve, or Discord.</p>

      <h2>6. Your Rights (GDPR)</h2>
      <p>As a user in the European Union, you have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Correct inaccurate or incomplete data.</li>
        <li>Request deletion of your data (“right to be forgotten”).</li>
        <li>Object to processing in certain cases.</li>
        <li>Receive a copy of your data in a portable format.</li>
      </ul>
      <p>You can exercise these rights by contacting us via the website’s contact form.</p>

      <h2>7. Security</h2>
      <p>We take reasonable measures to protect your data, but no system is completely secure. Use the Service at
        your own risk.</p>

      <h2>8. Children’s Privacy</h2>
      <p>The Service is not intended for users under 16 years old. We do not knowingly collect data from children
        under 16.</p>

      <h2>9. Changes to This Policy</h2>
      <p>We may update this Privacy Policy occasionally. Updates will be posted on this page with a new effective
        date.</p>

      <h2>10. Contact</h2>
      <p>If you have questions or requests regarding your data, please reach out via the contact form on the
        website.</p>

      <hr />
      <p class="text-sm">
        Also see: <NuxtLink to="/legal/terms">Terms of Service</NuxtLink> · <NuxtLink to="/legal/impressum">
          Impressum</NuxtLink>
      </p>
    </UContainer>
  </div>
</template>