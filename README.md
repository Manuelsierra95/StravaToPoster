# StravaToPoster

Genera posters imprimibles a partir de actividades de Strava con un mapa
interactivo y métricas editables.

## Configuración

1. Crea una app en https://www.strava.com/settings/api
   - **Authorization Callback Domain**: `localhost` (para desarrollo)
   - Scopes por defecto: `activity:read`
2. Copia `.env.example` a `.env.local` y rellena los valores:

   ```bash
   cp .env.example .env.local
   ```

3. Instala dependencias y arranca:

   ```bash
   pnpm install
   pnpm dev
   ```

4. Abre http://localhost:3000, pulsa **Conectar con Strava** y autoriza la
   aplicación. Después pega una URL o ID de actividad en el panel derecho.

## Stack

- Next.js 16 con **Cache Components** + **Instant Navigations** (PPR + `unstable_instant`)
- React 19
- Tailwind v4 + shadcn/ui
- [mapcn](https://www.mapcn.dev) sobre MapLibre GL
- OAuth 2.0 de Strava (sin API key expuesta al cliente)

## Performance
La app usa Next.js 16 Cache Components para que la primera carga y las navegaciones
entre rutas se vean al instant. el shell estático (layout + poster vacío + esqueleto
del editor) se prerenderiza y se sirve desde el edge; el contenido dinámico (Strava
auth, datos de la actividad) se carga por streaming detrás de `<Suspense>`. La
regla completa está en [AGENTS.md](./AGENTS.md).

Para depurar el shell estático en dev: abre Next.js DevTools → **Instant Navs**.
