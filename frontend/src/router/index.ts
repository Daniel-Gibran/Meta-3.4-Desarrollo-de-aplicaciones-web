import { createRouter, createWebHistory } from 'vue-router'

import { useAuth } from '@/stores/auth'
import AdminLayout from '@/views/admin/AdminLayout.vue'
import JugadoresView from '@/views/admin/JugadoresView.vue'
import LoginView from '@/views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/admin' },
    { path: '/login', name: 'login', component: LoginView },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiereAdmin: true },
      children: [
        { path: '', name: 'admin-jugadores', component: JugadoresView },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const { usuario, esAdmin, restaurarSesion } = useAuth()

  // Al recargar, primero se pregunta al backend si la cookie sigue siendo válida.
  await restaurarSesion()

  // El panel es solo para Admin. Si hay sesión pero es rol público, también
  // se le manda al login.
  if (to.meta.requiereAdmin && !esAdmin.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Si ya hay sesión, el login no tiene sentido.
  if (to.name === 'login' && usuario.value) {
    return { name: 'admin-jugadores' }
  }
})

export default router
