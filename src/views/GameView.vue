<template>
  <main class="page">
    <h1>Game View</h1>
    <p>Next up: Three.js scene goes here.</p>

    <RouterLink to="/" class="link">Back to Home</RouterLink>
  </main>
</template>

<script setup lang="ts"></script>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  gap: 12px;
  background: #080a10;
  color: white;
  text-align: center;
  padding: 24px;
}
.link {
  color: rgba(255, 255, 255, 0.75);
  text-decoration: underline;
}
</style>
