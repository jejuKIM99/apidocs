import { SpeedInsights } from '@vercel/speed-insights/nuxt'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('SpeedInsights', SpeedInsights)
})