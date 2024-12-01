<template>
    <div class="centered">
      <h1 :style="{ color }">
          Send to Koreader Bot 👋
      </h1>
      <UDivider label="Bot Info" type="solid" class="my-4"/>
      <img class="qr" src="/images/qr-bot.png" alt="qr telegram bot" width="200">
      <br>
      <a href="https://t.me/send2koreader_bot" target="_blank">
        <span :style="{ color }">https://t.me/send2koreader_bot</span>
      </a>
      <UDivider icon="i-simple-icons-github" type="solid" class="my-4"/>
      <a href="https://github.com/tvd1981/send2ko" target="_blank"><span :style="{ color }">https://github.com/tvd1981/send2ko</span></a>
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
  .qr{
    display: block;
    margin: 0 auto;
  }
  </style>