# CLAUDE.md

Copia personal e independiente de [Razdva122/clean-your-tv-lg-webos](https://github.com/Razdva122/clean-your-tv-lg-webos):
un launcher (pantalla de inicio) para TVs LG webOS sin root, instalado mediante Developer Mode.
El objetivo de este repo es **personalizar el diseño del launcher** (grupos, segmentos, fondos,
tipografía, temas). Responde en español.

## La TV

- LG OLED65C2PSA, firmware 43.21.74, SDK 11.2.0, en `192.168.1.2` (ver `.env`).
- Perfil de `ares`: `clean-your-tv-192-168-1-2` (lo creó `install.sh`).
- Developer Mode caduca a las ~50 h si no se pulsa **Extend** en la app Developer Mode.
  Si caduca, la TV borra el launcher y hay que repetir la instalación completa.
- Mantener pulsado **Home** ~2 s detiene el helper y vuelve a la pantalla de LG (recuperación).

## Flujo de trabajo

Todo corre en Ubuntu (WSL), desde la raíz del repo. Las tareas de VS Code (`.vscode/tasks.json`)
envuelven estos comandos:

| Paso | Comando | Tarea de VS Code |
|---|---|---|
| Vista previa con recarga | `python3 scripts/preview.py` → http://127.0.0.1:8765 | Vista previa |
| Enviar solo el launcher a la TV | `bash scripts/tv-deploy-launcher.sh` | Enviar launcher a la TV (Ctrl+Shift+B) |
| Captura de la pantalla real | `python3 scripts/tv-screenshot.py 192.168.1.2` → `build/screenshots/latest.jpg` | Captura de la TV |
| Releer apps instaladas en la TV | `python3 sync-apps.py 192.168.1.2` | Sincronizar apps de la TV |
| Reinstalar todo (helper incluido), TV ya emparejada | `bash scripts/tv-reinstall.sh` | Instalación completa |
| Primera instalación o re-emparejar | `./install.sh 192.168.1.2` (interactivo: pide passphrase) | Emparejar e instalar (install.sh) |

Ciclo habitual: editar `launcher/` → revisar en la vista previa → enviar a la TV → captura →
leer `build/screenshots/latest.jpg` para comprobar cómo se ve en la pantalla real.

`ares-launch` del helper no abre el launcher por sí solo; para comprobar el botón Home se puede
abrir otra app y pulsar Home desde la red con el socket de entrada SSAP
(`ssap://com.webos.service.networkinput/getPointerInputSocket`, mensaje `type:button\nname:HOME\n\n`).

Los scripts `tv-*` cargan `.env` y anteponen al PATH la CLI de webOS fijada en `build/tools/`
y el `.venv` de Python (los crea `install.sh`). Para ejecutar Python del repo usa `.venv/bin/python3`
o carga antes `scripts/lib/tv-env.sh`.

## Estructura relevante

- `launcher/`: la web app (HTML/CSS/JS) que se empaqueta como `com.gathin.tvhome`.
  - `index.html`, `style.css`: estructura y estilo.
  - `app.js`: lógica del launcher (cuadrícula, foco, dock, teclas del control, reloj).
    Las posiciones de los mosaicos se calculan aquí, en un lienzo fijo de 1920×1080.
  - `app-library.js`: disposición persistente de la pantalla (orden y apps ocultas, en
    `localStorage` con la clave `tvhome.layout`), independiente del inventario de la TV.
    Es el punto de partida natural para grupos o segmentos.
  - `config.js`: configuración del usuario (`columns` 1–8, `dockApps`, `hiddenApps`; IDs de app
    con `python3 sync-apps.py 192.168.1.2 --list`).
  - `apps.js` e `icons/`: generados por `sync-apps.py`, privados y en `.gitignore`.
  - `user-data.js`: debe ser idéntico a `updater-service/user-data.js` (lo comprueba `scripts/test.sh`).
- `preview/` y `scripts/preview.py`: vista previa con apps de ejemplo y servicios webOS simulados.
- `native/`: helper nativo que intercepta el botón Home. No tocarlo para cambios de diseño;
  si se toca, hay que usar la instalación completa.
- `root-edition/`: edición para TVs rooteadas, no usada aquí.
- `cytv/`: instalador asistido del autor (binarios en sus releases). Aquí se usa `install.sh` en WSL.

Versiones actuales: launcher `com.gathin.tvhome` 1.3.0, helper `com.local.nativehome` 0.6.14.
"Enviar launcher a la TV" solo reinstala el launcher: si un cambio de upstream toca `native/`
(sube la versión del helper), usa "Instalación completa".

## Pruebas

- `scripts/test.sh` es la batería del autor; necesita un compilador de C
  (`sudo apt install build-essential`).
- Sin compilador: `for f in launcher/*.js; do node --check "$f"; done`, los `tests/*.cjs` y
  `.venv/bin/python3 -m unittest discover -s tests -p test_preview.py`.
- `tests/renewal-ui.cjs` falla también en upstream (falta un módulo) y no está en `test.sh`: ignóralo.

## Reglas y trampas

- **Archivos nuevos en `launcher/`** (fuentes, fondos, JS o CSS): añádelos a `LAUNCHER_FILES` en
  `scripts/preview.py`; si no, la vista previa responde 404 aunque en la TV funcionen.
- **Fuentes e imágenes van dentro del paquete**, no desde una CDN: la TV puede arrancar sin red.
  Usa solo fuentes con licencia libre y anota la licencia (como `launcher/fonts/OFL.txt`).
- **Control remoto**: todo debe navegarse con flechas, OK (Enter, keyCode 13) y Atrás (keyCode 461;
  Esc en la vista previa). Comprueba la navegación con el teclado en la vista previa.
- **Rendimiento**: el hardware de la TV es modesto. Evita `backdrop-filter` grandes, vídeo de fondo
  y animaciones de propiedades que provoquen layout; anima `transform` y `opacity`.
  Confirma con una captura de la TV real, no solo con la vista previa.
- **Compatibilidad**: el motor web de la TV es un Chromium de hace unos años. Evita CSS o JS
  muy recientes (anidamiento CSS, `:has()`, container queries…) salvo que se pruebe en la TV.
- **Secretos**: nunca imprimas ni subas `.env`, `.lgtv-key.json`, claves de `~/.ssh/` ni la
  passphrase de Developer Mode. No ejecutes `ares-setup-device --listfull` (muestra passphrases).
- `app.js` y `app-library.js` vienen minificados de upstream; en este fork se formatearon con
  Prettier (`npx prettier@3.3.3 --write`) para poder editarlos en este repo. Al traer cambios de upstream a
  esos archivos habrá conflictos: toma la versión de upstream, formatéala con el mismo comando,
  comprueba que `npx esbuild --minify` da lo mismo que el original y reaplica encima los cambios
  propios.
- Crear archivos desde Windows (`\\wsl.localhost\...`) puede dejarlos con dueño `root` y romper
  `git switch`. Créalos desde Ubuntu o corrige con `sudo chown -R airen:airen <ruta>`.

## Git

- `origin`: [Yanco-X/Yanco_TVLG_Webos_Clean](https://github.com/Yanco-X/Yanco_TVLG_Webos_Clean),
  repo independiente (no es un fork). Todos los cambios se suben solo aquí.
- `upstream`: Razdva122/clean-your-tv-lg-webos, **solo lectura** (push deshabilitado). Nunca abras
  pull requests ni subas nada al repo original.
- `main` sigue a upstream; el trabajo propio va en la rama `mi-launcher`.
- Para traer novedades: `git fetch upstream && git switch main && git merge upstream/main`,
  y luego `git switch mi-launcher && git merge main`.
