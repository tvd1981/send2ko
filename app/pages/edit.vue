<template>
  <div class="p-4">
    <template v-if="isMounted">
      <!-- Header -->
      <UContainer>
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold">
            Send2Ko
          </h1>
          <!-- Action bar khi có items được chọn -->
          <div v-if="hasSelectedItems" class="flex items-center gap-2">
            <span class="text-sm text-gray-500">
              Đã chọn {{ selectedItems.length }} mục
            </span>
            <UButton
              icon="i-heroicons-trash"
              color="red"
              variant="soft"
              @click="deleteSelected"
            >
              Xóa đã chọn
            </UButton>
          </div>
          <!-- Settings button khi không có items được chọn -->
          <UButton
            v-else
            icon="i-heroicons-cog-6-tooth"
            color="gray"
            variant="ghost"
            @click="openSettings"
          />
        </div>
      </UContainer>

      <!-- Table -->
      <UTable
        v-model:selected="selectedItems"
        :rows="items"
        :columns="columns"
        :loading="loading"
        :sort="sort"
        :pagination="pagination"
        selection="multiple"
        @update:sort="sort = $event"
        @update:pagination="pagination = $event"
      >
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

        <!-- Thêm template cho selection -->
        <template #selection="{ selected, row }">
          <UCheckbox
            :model-value="selected"
            @update:model-value="$emit('update:selected', row)"
          />
        </template>
      </UTable>
    </template>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
})
const route = useRoute()

// Pagination state
const pagination = ref({
  page: 1,
  perPage: 10,
  totalItems: 0,
})
// Cập nhật khai báo API URL và data fetching
const apiURL = computed(() => {
  const params = new URLSearchParams({
    pk: route.query.pk,
    page: pagination.value.page.toString(),
    limit: pagination.value.perPage.toString(),
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
const totalItems = computed(() => data.value?.total || 0)

const selectedItems = ref([])

// Table columns definition
const columns = computed(() => [{
  key: 'content',
  label: '',
}])

// Sorting state
const sort = ref({
  column: 'uploadAt',
  direction: 'desc',
})

// Watch totalItems để cập nhật pagination
watchEffect(() => {
  pagination.value.totalItems = totalItems.value
})

// Check if any items are selected

const hasSelectedItems = computed(() => selectedItems.value.length > 0)

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

// Handle settings button click
const openSettings = () => {
  // Thêm logic mở settings dialog
  console.log('Open settings')
}

// Handle delete single item
const deleteItem = (row) => {
  // Thêm logic xóa item
  console.log('Delete item:', row)
}

// Handle delete selected items

const deleteSelected = () => {
  console.log('Delete selected items:', selectedItems.value)
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

// Hàm xác định màu cho type badge
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getTypeColor = (mimeType) => {
  const typeColors = {
    PDF: 'red',
    EPUB: 'blue',
    MOBI: 'green',
    AZW3: 'purple',
    default: 'gray',
  }
  const displayType = getMimeTypeDisplay(mimeType)
  return typeColors[displayType] || typeColors.default
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
})

// Khai báo emit để sử dụng cho việc cập nhật selected
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const emit = defineEmits(['update:selected'])
</script>

<style scoped>
/* Thêm styles tùy chỉnh nếu cần */
  </style>
