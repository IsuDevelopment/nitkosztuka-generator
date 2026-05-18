export default defineNuxtRouteMiddleware(async (to) => {
  // Public routes
  const publicRoutes = ['/login', '/share']
  const isPublic = publicRoutes.some(r => to.path.startsWith(r))
  if (isPublic) return

  const { loggedIn } = useUserSession()
  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
