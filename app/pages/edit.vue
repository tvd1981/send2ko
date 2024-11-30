<template>
  <div class="p-4 min-h-screen mb-10">
    <template v-if="isMounted">
      <!-- Header -->
      <UContainer>
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold">
            Send2Ko
          </h1>
        </div>
      </UContainer>
      <UDivider label="Device Settings" type="solid" />
      <UForm :state="formSettings" @submit="handleSubmit">
        <UFormGroup label="OPDS" help="Number of ebooks to display on OPDS">
          <USelect v-model="formSettings.opds" :options="perDisplay" />
        </UFormGroup>
        <UFormGroup label="Web" help="Number of ebooks to display on Web">
          <USelect v-model="formSettings.web" :options="perDisplay" />
        </UFormGroup>
        <UButton type="submit" :loading="isSaving">
          Save
        </UButton>
      </UForm>
      <hr class="my-4">
      <UAlert
        icon="i-heroicons-exclamation-circle"
        color="red"
        variant="soft"
        title="Warning!"
        description="Deleting an ebook here only removes it from this list, not from the Telegram bot."
      />
      <!-- Table -->
      <UTable
        v-model="selectedItems"
        :rows="items"
        :columns="columns"
        :loading="loading"
        :loading-state="{ icon: 'i-heroicons-arrow-path-20-solid', label: 'Loading...' }"
        :sort="sort"
        selection="multiple"
        selectable
        @select="handleSelect"
      >
        <template #content-header>
          <div class="flex items-center gap-2">
            <UButton
              v-if="selectedItems.length > 0"
              icon="i-heroicons-trash"
              color="red"
              variant="ghost"
              size="xs"
              @click="deleteSelected"
            />
          </div>
        </template>
        <!-- Sửa lại template name để match với column key -->
        <template #content-data="{ row }">
          <div class="flex flex-col p-2">
            <!-- Dòng 1: fileName/ebookTitle + mimeType -->
            <div class="flex items-center gap-2">
              <UButton
                icon="i-heroicons-trash"
                color="red"
                variant="ghost"
                size="xs"
                @click="deleteItem(row)"
              />
              <div class="flex-1 truncate">
                <UTooltip
                  v-if="row.ebookTitle"
                  :text="row.fileName"
                >
                  <div class="truncate">
                    {{ row.ebookTitle }}
                    <span class="text-gray-500">
                      ({{ getMimeTypeDisplay(row.mimeType) }})
                    </span>
                  </div>
                </UTooltip>
                <div
                  v-else
                  class="truncate"
                >
                  {{ row.fileName }}
                  <span class="text-gray-500">
                    ({{ getMimeTypeDisplay(row.mimeType) }})
                  </span>
                </div>
              </div>
            </div>
            <!-- Dòng 2: chỉ còn thời gian -->
            <div class="text-sm text-gray-500 mt-1">
              {{ formatDate(row.createdAt) }}
            </div>
          </div>
        </template>
      </UTable>

      <!-- Đặt pagination ở ngoài UTable -->
      <div class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
        <UPagination
          v-model="pagination.page"
          :page-count="pagination.perPage"
          :total="pagination.totalItems"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
})
useHead({
  title: 'Edit | Send2Ko',
})

const route = useRoute()
const toast = useToast()
const formSettings = ref({
  web: 20,
  opds: 20,
})
const isSaving = ref(false)
const perDisplay = [10, 20, 30, 40, 50]
const pk = route.query.pk

// Pagination state
const pagination = ref({
  page: 1,
  perPage: 10,
  totalItems: 0,
})
// Cập nhật khai báo API URL và data fetching
const apiURL = computed(() => {
  const params = new URLSearchParams({
    pk: pk,
    page: pagination.value.page.toString(),
    limit: 10,
  })
  return `/api/ebooks/web?${params}`
})

const isMounted = ref(false)
const initialFetchDone = ref(false)

const { data, loading, refresh } = await useLazyFetch(apiURL, {
  server: false, // Chỉ fetch ở client-side
  immediate: false, // Không fetch ngay lập tức
})

const items = computed(() => data.value?.data || [])

const selectedItems = ref([])

// Table columns definition
const columns = computed(() => [
  {
    key: 'content',
    label: '',
  },
])

// Sorting state
const sort = ref({
  column: 'uploadAt',
  direction: 'desc',
})

// Watch totalItems để cập nhật pagination
watchEffect(() => {
  if (data.value?.totalRows) {
    pagination.value.totalItems = data.value.totalRows
  }
})

// Format date function
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const deleteItems = async (ids) => {
  if (ids.length === 0) {
    return
  }
  const { error } = await useFetch(`/api/ebooks/remove`, {
    method: 'POST',
    body: { ids, pk: route.query.pk },
  })
  if (error.value) {
    toast.add({
      title: 'Error',
      description: error.value.data.message,
    })
  }
  else {
    await refresh()
    toast.add({
      title: 'Success',
      description: 'Delete item successfully!',
    })
  }
}

// Handle delete single item
const deleteItem = async (row) => {
  await deleteItems([row.id])
}

// Handle delete selected items
const deleteSelected = async () => {
  await deleteItems(selectedItems.value.map(item => item.id))
}

// Hàm chuyển đổi MIME type sang display format
const getMimeTypeDisplay = (mimeType) => {
  const mimeTypeMap = {
    'application/pdf': 'PDF',
    'application/epub+zip': 'EPUB',
    'application/x-mobipocket-ebook': 'MOBI',
    'application/vnd.amazon.ebook': 'AZW3',
  }
  return mimeTypeMap[mimeType] || 'Unknown'
}

const handleSelect = (row) => {
  const index = selectedItems.value.findIndex(item => item.id === row.id)
  if (index === -1) {
    selectedItems.value.push(row)
  }
  else {
    selectedItems.value.splice(index, 1)
  }
}

const handleSubmit = async () => {
  try {
    isSaving.value = true
    const newSettings = {
      opds: parseInt(formSettings.value.opds),
      web: parseInt(formSettings.value.web),
    }
    await $fetch(`/api/ebooks/settings`, {
      method: 'PATCH',
      body: { pk, settings: newSettings },
    })
    toast.add({
      title: 'Success',
      description: 'Settings saved successfully!',
    })
  }
  catch (error) {
    toast.add({
      title: 'Error',
      description: error.message,
    })
  }
  finally {
    isSaving.value = false
  }
}

// Sửa lại watch
watch(pagination, () => {
  if (isMounted.value && initialFetchDone.value) {
    refresh()
  }
}, { deep: true })

// Sửa lại onMounted
onMounted(async () => {
  isMounted.value = true
  await refresh()
  initialFetchDone.value = true
  formSettings.value = await $fetch(`/api/ebooks/settings?pk=${pk}`)
})
</script>

<style scoped>
/* Thêm styles tùy chỉnh nếu cần */
  </style>
