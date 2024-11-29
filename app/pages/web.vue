<script setup lang="ts">
useHead({
  title: 'Send to Kobo',
  link: [
    { rel: 'stylesheet', href: '/kobo/style.css' },
  ],
  script: [
    { src: '/kobo/index.js', tagPosition: 'bodyClose' },
  ],
})
</script>

<template>
  <div class="wrapper">
    <h1 class="center">
      Ebook list:
    </h1>
    <hr>
    <div class="center">
      <div id="download" style="display: none;" />
      <br>
    </div>
  </div>
</template>
