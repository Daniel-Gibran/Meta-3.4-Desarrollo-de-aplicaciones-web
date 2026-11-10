import { defineConfig, devices } from '@playwright/test'

/**
 * Configuración de la suite e2e de la Meta 4.2.
 *
 * - `workers: 1` y `fullyParallel: false` porque todas las pruebas comparten la
 *   misma base de datos MySQL: si corrieran en paralelo, se pisarían los datos.
 * - El proyecto `setup` inicia sesión una vez como Admin y guarda las cookies
 *   en `playwright/.auth/admin.json`. Los proyectos `admin` reutilizan ese
 *   estado; `publico` corre sin sesión y `auth` prueba el login desde cero.
 * - `webServer` levanta backend y frontend automáticamente. Si ya están
 *   corriendo, los reutiliza.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 8_000 },

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'auth',
      testMatch: /login\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'admin',
      dependencies: ['setup'],
      testMatch: /admin-.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
    },
    {
      name: 'publico',
      testMatch: /publico-.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'npm start --prefix ../backend',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
})
