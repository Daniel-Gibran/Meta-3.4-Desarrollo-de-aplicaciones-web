import axios from 'axios'

/**
 * Cliente único de la API.
 *
 * `withCredentials` hace que el navegador envíe la cookie HttpOnly del JWT en
 * cada petición. Sin esto, el backend respondería 401 siempre.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1',
  withCredentials: true,
})

/**
 * Lee una cookie por nombre. El token CSRF no es HttpOnly precisamente para
 * que el frontend pueda leerlo y reenviarlo en la cabecera.
 */
function leerCookie (nombre: string): string | null {
  const partes = document.cookie.split('; ')
  const encontrada = partes.find((parte) => parte.startsWith(`${nombre}=`))

  return encontrada ? decodeURIComponent(encontrada.split('=').slice(1).join('=')) : null
}

/**
 * Patrón de doble envío: en cada escritura se copia el token CSRF de la cookie
 * a la cabecera `x-csrf-token`. El servidor comprueba que coincide con el que
 * guarda el JWT.
 */
api.interceptors.request.use((config) => {
  const metodo = (config.method ?? 'get').toLowerCase()

  // Solo las peticiones que modifican datos llevan CSRF.
  if (['post', 'put', 'patch', 'delete'].includes(metodo)) {
    const csrf = leerCookie('csrf_token')

    if (csrf) {
      config.headers['x-csrf-token'] = csrf
    }
  }

  return config
})

export default api
