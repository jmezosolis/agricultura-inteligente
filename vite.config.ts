import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
// @ts-expect-error módulo JavaScript del servidor, sin tipos
import { imagenSatelite, MODOS } from './scripts/satelite-api.mjs'

const RAIZ = path.dirname(fileURLToPath(import.meta.url))

/** POST /api/satelite: imagen Sentinel-2 del polígono. Las credenciales viven solo en el servidor. */
function sateliteApi(): Plugin {
  return {
    name: 'satelite-api',
    configureServer(server) {
      server.middlewares.use('/api/satelite', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end()
        }
        let cuerpo = ''
        for await (const trozo of req) cuerpo += trozo
        try {
          const datos = JSON.parse(cuerpo || '{}') as { anillo?: [number, number][]; modo?: string }
          if (!datos.modo || !MODOS.includes(datos.modo)) throw new Error('Modo de imagen no válido.')
          const png: Buffer = await imagenSatelite({ raiz: RAIZ, anillo: datos.anillo, modo: datos.modo })
          res.setHeader('Content-Type', 'image/png')
          res.setHeader('Cache-Control', 'no-store')
          res.end(png)
        } catch (e) {
          res.statusCode = 503
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'Error desconocido' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), sateliteApi()],
})
