export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/edit' && !to.query.pk) {
    return navigateTo('/')
  }
})
