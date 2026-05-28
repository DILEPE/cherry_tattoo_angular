# Cherry Tattoo — Panel Angular

Frontend del panel operativo Cherry Ink / Rock City. Consume la API Litestar del proyecto [cherry-tatto](https://github.com/DILEPE/cherry-tatto) (`/api/*`).

## Requisitos

- Node 20+
- API en `http://127.0.0.1:5000` (o proxy en desarrollo)

## Desarrollo

```powershell
$env:NODE_OPTIONS="--use-system-ca"   # si npm falla por certificados en Windows
npm start
```

Abre `http://localhost:4200`. El proxy (`proxy.conf.json`) reenvía `/api` al backend.

## Ramas

| Rama | Uso |
|------|-----|
| `main` | Producción / releases |
| `develop` | Integración |
| `feature/*` | Trabajo por bloque (PR → `develop`) |

## Documentación de arquitectura

Ver `.cursor/rules/angular-architecture-agent.md` y `src/app/store/README.md`.
