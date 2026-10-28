# CLAUDE.md — manuelcaipocc.github.io

Sitio personal / CV académico de **Manuel Caipo** (ML & Data Engineer, Mechanical Engineer).
Publicado en `https://manuelcaipocc.github.io/`.

---

## 1. Stack

| Pieza | Valor | Dónde se define |
|---|---|---|
| Generador | Hugo **extended 0.136.5** | `hugoblox.yaml`, `netlify.toml`, `.github/workflows/publish.yaml` (mantener las 3 sincronizadas) |
| Tema | HugoBlox `blox-tailwind v0.3.1` + `blox-plugin-netlify` | `go.mod`, `config/_default/module.yaml` |
| Starter base | `hugo-blox-builder/starters/academic-cv` | `go.mod` (nombre del módulo) |
| CSS | Tailwind (vía tema) + overrides propios | `assets/css/custom.css` |
| Búsqueda | Pagefind (post-build) | workflow / netlify |
| Deploy oficial | GitHub Actions → GitHub Pages en push a `main` | `.github/workflows/publish.yaml` |

Comandos:

```bash
hugo server -D                      # desarrollo local
hugo --gc --minify                  # build de producción a /public
npx pagefind --source public        # índice de búsqueda (opcional local)
```

`deploy.sh` es un deploy manual legacy a `gh-pages`; el camino oficial es el workflow.

---

## 2. Estructura

```
config/_default/
  hugo.yaml        # title, baseURL, outputs, imaging, taxonomies
  params.yaml      # apariencia, SEO, header/footer, analytics
  menus.yaml       # navbar (anclas #about, #publications, #experience, #contact + CV)
  languages.yaml   # solo en-us
  module.yaml      # imports del tema + mounts

content/
  _index.md        # HOME (type: landing): hero + resume-biography-3 + timeline
  experience.md    # landing: resume-experience / skills / awards / languages
  projects.md      # landing: grid de content/project
  authors/admin/   # FUENTE ÚNICA del perfil (bio, education, interests, profiles, experience...)
  publication/     # REAL: ape001, ape002, bsc_thesis_unsa, msc_master_hfu, Hydraulic (index.md + cite.bib)
  project/         # PLACEHOLDER del starter (pandas, pytorch, scikit)
  post/            # PLACEHOLDER del starter (get-started, data-visualization, ...)
  event/, platform/, teaching/   # PLACEHOLDER / sin uso real

layouts/
  404.html
  partials/hooks/head-end/
    custom.html          # meta google-site-verification
    manuel-schema.html   # JSON-LD Person/ProfilePage (sameAs: LinkedIn, ORCID, ...)
    github-button.html   # GitHub buttons + GoatCounter
  _partials/hbx/blocks/resume-biography-3/block.html   # ver §5 (posible override muerto)

assets/css/custom.css    # gradiente de fondo animado, .keyword, .wg-about, .focus-area, dark mode
static/
  uploads/               # PDFs (CV)
  cv-mcaipocc/index.html # CV en HTML standalone
  google*.html           # verificación Search Console
docs/                    # documentación interna (no se publica)
resources/_gen/, hugo_stats.json, public/   # GENERADOS — no editar a mano
```

---

## 3. Reglas de desarrollo

### 3.1 Reutilizar antes de crear
1. **Antes de añadir algo, buscar si ya existe**: bloque HugoBlox, partial, hook, clase CSS, campo de front matter.
2. **Datos personales en un solo lugar**: `content/authors/admin/_index.md`. Las páginas los leen con `username: admin`. No duplicar bio/experiencia/skills en otras páginas.
3. **Usar bloques del tema** (`hero`, `resume-biography-3`, `resume-experience`, `collection`, `markdown`, ...) configurados por YAML antes de escribir HTML propio.
4. **Personalización por capas, en este orden**:
   1. `config/_default/params.yaml` (opciones del tema)
   2. `assets/css/custom.css` (estilos)
   3. `layouts/partials/hooks/**` (inyectar en head/body)
   4. Override de un partial/bloque del tema en `layouts/` — solo si 1–3 no alcanzan, copiando el archivo original de la **misma versión** del tema y documentándolo en §5.
5. **Nuevo contenido = copiar la estructura de un item real existente** (p.ej. `content/publication/ape001/` para publicaciones: `index.md` + `cite.bib` + `featured.*`).

### 3.2 Mejorar cuando no tiene sentido
- Si algo existente es placeholder, está roto, duplicado o es mejorable: **reemplazarlo o eliminarlo** en vez de construir encima. Explicar el cambio en el commit/respuesta.
- No borrar contenido real ni archivos dudosos sin confirmar con el usuario.
- Cada mejora debe dejar la base más simple, no más grande.

### 3.3 Convenciones
- Contenido del sitio en **inglés**. Comentarios/código interno pueden ir en español o inglés, pero coherente por archivo.
- Carpetas de contenido en `snake_case` minúsculas (`Hydraulic/` es la excepción a corregir).
- Publicaciones: `authors: [admin]`, `publication_types`, `featured`, `url_pdf` (Zenodo), `url_code` (GitHub), `doi` si existe.
- Imágenes de un item: `featured.jpg|png` dentro de su carpeta (page bundle).
- No editar `resources/_gen/`, `public/`, `hugo_stats.json`, `go.sum` a mano.
- Cambiar la versión de Hugo = actualizar `hugoblox.yaml`, `netlify.toml` y `publish.yaml` juntos.
- SEO: identidad (nombre, links sociales) debe coincidir entre `authors/admin`, `manuel-schema.html` y `params.yaml`.

### 3.4 Verificación
- Tras cambios en layouts/config/CSS: `hugo --gc --minify` sin errores ni warnings nuevos.
- Revisar en `hugo server` la home, `/experience/`, `/publication/` y modo oscuro.

---

## 4. Qué es real vs placeholder

| Real (mantener) | Placeholder (reemplazar o eliminar) |
|---|---|
| `_index.md`, `experience.md`, `authors/admin` | `post/*` (get-started, data-visualization, project-management, second-brain, teach-courses) |
| `publication/*` | `project/{pandas,pytorch,scikit}` → sustituir por proyectos propios |
| hooks head-end, `custom.css`, `404.html` | `event/event1`, `platform/platform1`, `teaching/{js,python}` |

---

## 5. Deuda técnica conocida (backlog)

- [x] `.gitignore` añadido; `resources/_gen/`, `hugo_stats.json`, `.hugo_build.lock` fuera del índice. `static/uploads/resume.txt` (datos personales) ignorado.
- [ ] `layouts/_partials/hbx/blocks/resume-biography-3/block.html`: la convención `_partials/` y `hbx/blocks/` es de Hugo ≥ 0.146 / HugoBlox nuevo. Con Hugo 0.136.5 + blox-tailwind 0.3.1 probablemente **no se aplica**. Verificar; si no tiene efecto, moverlo a la ruta correcta del tema (`layouts/partials/blox/resume-biography-3/block.html`) o eliminarlo.
- [ ] Dos códigos de verificación de Google (uno en `custom.html`/`hugo.yaml`, otro en `params.yaml`). Dejar solo el vigente.
- [ ] `LICENSE` (MIT propio) y `LICENSE.md` (MIT del starter de George Cushen): unificar o renombrar el del starter para dejar clara la atribución.
- [ ] `deploy.sh` duplica el workflow y tiene un remote inválido (`git@github.com:manuelcaipocc.git`). Eliminar o corregir.
- [ ] Renombrar `content/publication/Hydraulic/` a minúsculas.
- [ ] Secciones comentadas en `content/_index.md` (news, talks, platforms): borrar o activar.
- [ ] Reemplazar contenido placeholder (§4).

Al resolver un punto, marcarlo `[x]` o eliminarlo de esta lista, y actualizar §2/§4 si cambia la estructura.

---

## 6. Documentación interna
- `docs/token_optimization.md` — guía de uso eficiente de Claude Code (costes/tokens). No forma parte del sitio.
