import api from './api'

export interface Usuario {
  id: number
  nombre: string
  email: string
  rol: 'admin' | 'publico'
}

interface RespuestaLogin {
  success: boolean
  message: string
  usuario: Usuario
  csrfToken: string
}

// Envía email y contraseña. El backend crea las cookies de sesión.
export async function login (email: string, password: string): Promise<Usuario> {
  const { data } = await api.post<RespuestaLogin>('/auth/login', { email, password })

  return data.usuario
}

// Pide al backend que borre las cookies.
export async function logout (): Promise<void> {
  await api.post('/auth/logout')
}

// Pregunta quién es el usuario de la sesión actual.
export async function obtenerSesion (): Promise<Usuario> {
  const { data } = await api.get<{ usuario: Usuario }>('/auth/me')

  return data.usuario
}
