<script setup lang="ts">
useHead({
  title: 'Send to Kobo',
  script: [
    { src: '/kobo/download.js', defer: true },
    { src: '/kobo/index.js', tagPosition: 'bodyClose' },
  ],
  link: [
    { rel: 'stylesheet', href: '/kobo/style.css' },
  ],
})

// const loadScript = () => {
//   const script = document.createElement('script')
//   script.src = '/kobo/index.js'
//   script.type = 'text/javascript'
//   script.async = false
//   document.body.appendChild(script)
// }

// onMounted(() => {
//   loadScript()
// })
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
