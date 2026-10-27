/**
 * Prueba de humo del flujo completo contra el backend en localhost:3000.
 *
 * Cubre login, CRUD de jugadores, filtros, CRUD de rosters, asignaciones,
 * reglas de negocio, permisos por rol y CSRF.
 *
 * Uso:
 *   node tools/e2e.mjs
 */

const BASE = process.env.API_URL || 'http://localhost:3000/api/v1'

const cookies = new Map()
let correctas = 0
let fallidas = 0

function guardarCookies (res) {
  const lista = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : []

  for (const cookie of lista) {
    const [par] = cookie.split(';')
    const separador = par.indexOf('=')
    const nombre = par.slice(0, separador)
    const valor = par.slice(separador + 1)
    const expirada = cookie.includes('Expires=Thu, 01 Jan 1970')

    if (expirada || valor === '') cookies.delete(nombre)
    else cookies.set(nombre, valor)
  }
}

function cabeceraCookies () {
  return [...cookies.entries()].map(([nombre, valor]) => `${nombre}=${valor}`).join('; ')
}

async function api (method, path, body, { csrf, enviarCookies = true } = {}) {
  const headers = {}

  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (enviarCookies && cookies.size > 0) headers.Cookie = cabeceraCookies()
  if (csrf) headers['x-csrf-token'] = csrf

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  guardarCookies(res)

  const texto = await res.text()
  let json = null

  try {
    json = texto ? JSON.parse(texto) : null
  } catch {
    json = null
  }

  return { status: res.status, json, texto }
}

function check (nombre, resultado, esperado) {
  if (resultado.status === esperado) {
    correctas += 1
    console.log(`OK   ${nombre} -> ${resultado.status}`)
  } else {
    fallidas += 1
    console.log(`FAIL ${nombre} -> ${resultado.status} (esperado ${esperado}): ${resultado.texto}`)
  }
}

async function main () {
  const sufijo = Date.now().toString().slice(-6)
  const nick1 = `E2EMid${sufijo}`
  const nick2 = `E2ETop${sufijo}`
  const nick3 = `E2EMid2${sufijo}`
  const nombreRoster = `E2E Roster ${sufijo}`

  // Login Admin
  const login = await api('POST', '/auth/login', {
    email: 'admin@esports.local',
    password: 'Admin123!',
  })
  check('login admin', login, 200)

  const csrf = login.json?.csrfToken
  if (!csrf) throw new Error('El login no devolvió csrfToken')

  // Lecturas y filtros
  check('listar jugadores', await api('GET', '/jugadores'), 200)
  check('filtrar por rol', await api('GET', '/jugadores?rol=Mid'), 200)
  check('filtrar por estado', await api('GET', '/jugadores?estado=activo'), 200)
  check('buscar por nickname', await api('GET', '/jugadores?search=Faker'), 200)
  check('filtro inválido', await api('GET', '/jugadores?rol=Capa'), 400)
  check('detalle inexistente', await api('GET', '/jugadores/999999'), 404)

  // CSRF: sin cabecera debe ser 403
  check('crear sin CSRF', await api('POST', '/jugadores', {
    nickname: `SinCsrf${sufijo}`,
    rol: 'Mid',
  }), 403)

  // CRUD jugadores
  const p1 = await api('POST', '/jugadores', {
    nickname: nick1,
    nombre_real: 'Test Mid',
    pais: 'México',
    rol: 'Mid',
    estado: 'activo',
  }, { csrf })
  check('crear jugador 1', p1, 201)
  const id1 = p1.json?.data?.id

  const p2 = await api('POST', '/jugadores', {
    nickname: nick2,
    nombre_real: 'Test Top',
    pais: 'México',
    rol: 'Top',
    estado: 'activo',
  }, { csrf })
  check('crear jugador 2', p2, 201)
  const id2 = p2.json?.data?.id

  const p3 = await api('POST', '/jugadores', {
    nickname: nick3,
    rol: 'Mid',
    estado: 'activo',
  }, { csrf })
  check('crear jugador 3', p3, 201)
  const id3 = p3.json?.data?.id

  check('detalle jugador', await api('GET', `/jugadores/${id1}`), 200)

  check('editar jugador', await api('PUT', `/jugadores/${id1}`, {
    nickname: nick1,
    nombre_real: 'Test Mid Editado',
    pais: 'México',
    rol: 'Mid',
    estado: 'activo',
  }, { csrf }), 200)

  check('editar inexistente', await api('PUT', '/jugadores/999999', {
    nickname: 'X',
    rol: 'Mid',
  }, { csrf }), 404)

  // CRUD rosters
  const roster = await api('POST', '/rosters', {
    nombre: nombreRoster,
    juego: 'League of Legends',
    tipo: 'Academy',
    temporada: '2026',
  }, { csrf })
  check('crear roster', roster, 201)
  const idRoster = roster.json?.data?.id

  check('listar rosters', await api('GET', '/rosters'), 200)
  check('filtrar rosters', await api('GET', '/rosters?tipo=Academy&temporada=2026'), 200)
  check('detalle roster', await api('GET', `/rosters/${idRoster}`), 200)

  check('editar roster', await api('PUT', `/rosters/${idRoster}`, {
    nombre: `${nombreRoster} Editado`,
    juego: 'League of Legends',
    tipo: 'Academy',
    temporada: '2026',
  }, { csrf }), 200)

  // Asignaciones
  check('asignar titular', await api('POST', `/rosters/${idRoster}/jugadores`, {
    jugador_id: id1,
    rol_en_roster: 'Titular',
  }, { csrf }), 201)

  check('asignar suplente', await api('POST', `/rosters/${idRoster}/jugadores`, {
    jugador_id: id2,
    rol_en_roster: 'Suplente',
  }, { csrf }), 201)

  check('listar jugadores del roster', await api('GET', `/rosters/${idRoster}/jugadores`), 200)

  check('cambiar a titular', await api('PUT', `/rosters/${idRoster}/jugadores/${id2}`, {
    rol_en_roster: 'Titular',
  }, { csrf }), 200)

  // RN-03: ya hay un Mid titular (jugador 1)
  check('rol duplicado', await api('POST', `/rosters/${idRoster}/jugadores`, {
    jugador_id: id3,
    rol_en_roster: 'Titular',
  }, { csrf }), 409)

  // RN-04: no repetir jugador en el mismo roster
  check('jugador ya asignado', await api('POST', `/rosters/${idRoster}/jugadores`, {
    jugador_id: id1,
    rol_en_roster: 'Suplente',
  }, { csrf }), 409)

  // No se puede borrar un jugador con asignaciones
  check('eliminar jugador asignado', await api('DELETE', `/jugadores/${id1}`, undefined, { csrf }), 409)

  // Limpieza
  check('quitar jugador 1', await api('DELETE', `/rosters/${idRoster}/jugadores/${id1}`, undefined, { csrf }), 204)
  check('quitar jugador 2', await api('DELETE', `/rosters/${idRoster}/jugadores/${id2}`, undefined, { csrf }), 204)
  check('eliminar roster', await api('DELETE', `/rosters/${idRoster}`, undefined, { csrf }), 204)
  check('eliminar jugador 1', await api('DELETE', `/jugadores/${id1}`, undefined, { csrf }), 204)
  check('eliminar jugador 2', await api('DELETE', `/jugadores/${id2}`, undefined, { csrf }), 204)
  check('eliminar jugador 3', await api('DELETE', `/jugadores/${id3}`, undefined, { csrf }), 204)

  // Rol Público: puede leer, no puede escribir
  cookies.clear()
  const loginPublico = await api('POST', '/auth/login', {
    email: 'publico@esports.local',
    password: 'Publico123!',
  })
  check('login público', loginPublico, 200)

  const csrfPublico = loginPublico.json?.csrfToken
  check('público puede leer', await api('GET', '/jugadores'), 200)
  check('público no puede crear', await api('POST', '/jugadores', {
    nickname: `NoPermitido${sufijo}`,
    rol: 'Mid',
  }, { csrf: csrfPublico }), 403)

  // Logout y verificación de que la sesión ya no sirve
  check('logout público', await api('POST', '/auth/logout', undefined, { csrf: csrfPublico }), 200)
  cookies.clear()
  check('sin sesión no puede escribir', await api('POST', '/jugadores', {
    nickname: `SinSesion${sufijo}`,
    rol: 'Mid',
  }), 401)

  console.log(`\n================  OK: ${correctas}   FALLAS: ${fallidas}  ================`)

  if (fallidas > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error('Error inesperado en la prueba:', error)
  process.exitCode = 1
})
