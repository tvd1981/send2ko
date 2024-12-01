<script setup lang="ts">
defineProps({
    color: {
        type: String,
        default: 'black',
    },
})
</script>

<template>
  <div class="centered">
    <h1 :style="{ color }">
        Hello from the Edge 👋
    </h1>
    <NuxtLink to="/" external>
      refresh
    </NuxtLink>
  </div>
</template>
