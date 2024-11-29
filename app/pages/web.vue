<script setup lang="ts">
useHead({
  title: 'Send to Kobo',
  script: [
    { src: '/kobo/download.js', defer: true },
  ],
  link: [
    { rel: 'stylesheet', href: '/kobo/style.css' },
  ],
})
</script>

<template>
  <div class="wrapper">
    <h1 id="title" class="center">
      Download ebooks:
    </h1>
    <hr>
    <div class="center">
      <div id="download">
        <table>
          <tbody id="ebooks" />
        </table>
      </div>
      <br>
    </div>
  </div>
</template>
