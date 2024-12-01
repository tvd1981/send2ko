<template>
    <div class="centered">
      <h1 :style="{ color }">
          Send to Koreader Bot 👋
      </h1>
      <hr>
      <img class="qr" src="/images/qr-bot.png" alt="qr telegram bot" width="200">
      <br>
      <a href="https://t.me/send2koreader_bot" target="_blank">
        <span :style="{ color }">https://t.me/send2koreader_bot</span>
      </a>
    </div>
  </template>

  <script setup lang="ts">
  defineProps({
    color: {
      type: String,
      default: 'black',
    },
  })
  useHead({
    title: 'Send to Koreader Bot',
  })
  </script>

  <style scoped>
  hr{
    margin: 20px 0;
  }
  .qr{
    display: block;
    margin: 0 auto;
  }
  </style>