# FG Ultra Media PWA — Panel privado + Logo Fix

## Cambios
- El botón "Administrar" fue eliminado completamente de la aplicación pública.
- También se eliminaron textos públicos que indicaban que la app era administrable.
- El panel está separado en `/admin.html`.
- El logo ahora acepta:
  - URL directa PNG/JPG/WEBP
  - enlaces compartidos de Google Drive
  - enlaces `blob` de GitHub, convertidos a raw
  - enlaces de Dropbox
  - subida de imagen desde el dispositivo (máximo 1.5 MB)
- Si una URL externa bloquea la imagen, el panel lo avisa.

## Abrir
Aplicación pública:
`https://tu-dominio.vercel.app`

Panel privado local:
`https://tu-dominio.vercel.app/admin.html`

## Vercel
Framework Preset: Other
Build Command: vacío
Output Directory: vacío
Variables de entorno: ninguna

IMPORTANTE:
Como todavía no hay backend, los cambios del panel se guardan en el navegador mediante localStorage.
