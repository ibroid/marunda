<template>
  <div>
    <NuxtLoadingIndicator :throttle="0" :height="3" color="#0284c7" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <LoadingOverlay />
    <UNotifications />
  </div>
</template>
