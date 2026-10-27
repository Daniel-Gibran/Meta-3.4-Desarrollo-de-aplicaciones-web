import { createRouter, createWebHistory } from 'vue-router'

import AdminLayout from '@/layouts/AdminLayout.vue'
import ConsultaLayout from '@/layouts/ConsultaLayout.vue'
import { useAuth } from '@/stores/auth'
import JugadoresView from '@/views/JugadoresView.vue'
import LoginView from '@/views/LoginView.vue'
import RosterDetailView from '@/views/RosterDetailView.vue'
import RostersView from '@/views/RostersView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/consulta/jugadores' },
    { path: '/login', name: 'login', component: LoginView },

    // Zona pública: consulta sin iniciar sesión (rol Público).
    {
      path: '/consulta',
      component: ConsultaLayout,
      children: [
        { path: '', redirect: '/consulta/jugadores' },
        { path: 'jugadores', name: 'consulta-jugadores', component: JugadoresView },
        { path: 'rosters', name: 'consulta-rosters', component: RostersView },
        { path: 'rosters/:id', name: 'consulta-roster', component: RosterDetailView },
      ],
    },

    // Zona Admin: exige sesión con rol admin.
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiereAdmin: true },
      children: [
        { path: '', redirect: '/admin/jugadores' },
        { path: 'jugadores', name: 'admin-jugadores', component: JugadoresView },
        { path: 'rosters', name: 'admin-rosters', component: RostersView },
        { path: 'rosters/:id', name: 'admin-roster', component: RosterDetailView },
      ],
    },

    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const { usuario, esAdmin, restaurarSesion } = useAuth()

  // Al recargar, primero se pregunta al backend si la cookie sigue siendo válida.
  await restaurarSesion()

  // El panel es solo para Admin.
  if (to.meta.requiereAdmin && !esAdmin.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Si ya hay sesión, el login redirige según el rol.
  if (to.name === 'login' && usuario.value) {
    return esAdmin.value
      ? { name: 'admin-jugadores' }
      : { name: 'consulta-jugadores' }
  }
})

export default router
