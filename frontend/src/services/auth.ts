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

export async function login (email: string, password: string): Promise<Usuario> {
  const { data } = await api.post<RespuestaLogin>('/auth/login', { email, password })

  return data.usuario
}

export async function logout (): Promise<void> {
  await api.post('/auth/logout')
}

export async function obtenerSesion (): Promise<Usuario> {
  const { data } = await api.get<{ usuario: Usuario }>('/auth/me')

  return data.usuario
}
