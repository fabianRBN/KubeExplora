# KubeExplora

Kubernetes, pieza por pieza. Aplicación educativa en español con arquitectura interactiva, ejemplos y escenarios de producción.

**[Abrir KubeExplora](https://fabianrbn.github.io/KubeExplora/)** · [Fuentes y créditos](https://fabianrbn.github.io/KubeExplora/credits.html)

## Qué puedes explorar

- 75 unidades: fundamentos, arquitectura, cargas de trabajo, redes, almacenamiento, configuración, seguridad, operación y extensiones.
- Diagramas con objetos seleccionables, relaciones explicadas y recorridos animados. Las preferencias de movimiento reducido se respetan.
- Descripción ampliada, propiedades clave y comandos con orientación para interpretar sus resultados.
- Simulaciones y guías de diagnóstico con síntomas, causas posibles y comandos. Los incidentes documentados incluyen el enlace al informe original.
- Ejemplos YAML o shell, recomendaciones y enlaces a documentación oficial en cada unidad.
- Cuatro laboratorios: capacidad de réplicas, memoria, selectores de Service y CrashLoopBackOff.
- Ruta de aprendizaje y progreso guardado en el navegador, búsqueda por componente o problema y diseño adaptable.

El catálogo incluye los componentes arquitectónicos oficiales y una selección amplia de recursos nativos y conceptos operativos. Gateway API, VPA, snapshots y otras extensiones están identificadas: su disponibilidad depende de CRDs, controladores y versiones instaladas. No pretende enumerar todos los CRDs del ecosistema.

Las simulaciones son modelos didácticos locales. No ejecutan comandos ni se conectan a un clúster. Los manifiestos muestran conceptos mínimos; deben adaptarse, revisarse y probarse antes de usarlos en un entorno real.

## Ejecutar localmente

Requiere Node.js 22 o superior; el pipeline usa Node.js 24.

```sh
npm ci --ignore-scripts
npm run dev
```

Abre `http://127.0.0.1:8780/`. El servidor acepta otro puerto: `node scripts/server.mjs 8781`.

```sh
npm run check
npm test
npm run build
node scripts/server.mjs --dist
```

El build valida el contenido y copia únicamente los recursos publicados a `dist/`. `dist/build.json` permite identificar el commit desplegado y los conteos del catálogo.

## Estructura

```text
index.html                    Portada y shell de la aplicación
credits.html                  Alcance, fuentes y atribuciones
src/main.js                   Navegación e interacciones
src/diagrams.js                Objetos y diagramas SVG
src/core.js                    Búsqueda y modelos de las simulaciones
src/styles.css                Diseño y adaptación móvil
src/data/catalog.json         Contenido de las 75 unidades
assets/                       Símbolo y tipografía local
scripts/                      Servidor, validación y build
tests/                        Pruebas de contenido y modelos
.github/workflows/            Validación y despliegue
```

No hay dependencias de ejecución, CDN, backend ni claves. La única dependencia de desarrollo es el parser YAML, fijado en el lockfile. Las rutas hash funcionan tanto en la raíz como en `/KubeExplora/` de GitHub Pages.

## Publicación

El workflow `deploy-pages.yml` comprueba JavaScript, ejecuta pruebas, valida los manifiestos y construye el sitio. Las pull requests solo validan; cada push a `main` publica el artefacto en GitHub Pages usando `GITHUB_TOKEN` y OIDC. Las acciones están fijadas por SHA.

En **Settings → Pages → Build and deployment → Source**, debe estar seleccionado **GitHub Actions**. El entorno `github-pages` debe permitir despliegues desde `main`. No hace falta una rama `gh-pages`, un PAT ni secretos de despliegue.

## Añadir o actualizar contenido

Cada unidad define su categoría, explicación, tres pasos, prácticas, dos o más problemas, ejemplo, relaciones y fuente primaria. Los IDs relacionados y las aristas del diagrama deben existir en el catálogo. `npm test` comprueba integridad, categorías, referencias, ejemplos YAML y comportamiento de los modelos.

Al cambiar explicaciones o ejemplos, contrasta la documentación oficial enlazada y especifica cualquier dependencia de versión, feature gate o extensión. Un YAML parseable no equivale a una validación contra la API de un clúster.

## Atribuciones

Proyecto de Fabián Toapanta. Contenido y gráficos propios basados en las fuentes oficiales enlazadas en cada lección. Interfaz basada en las maquetas KubeExplora aprobadas.

- Símbolo de Kubernetes: [CNCF Artwork](https://github.com/cncf/artwork/tree/main/projects/kubernetes). Kubernetes es una marca de The Linux Foundation; este proyecto educativo es independiente y no implica afiliación oficial.
- Manrope: Google Fonts, bajo SIL Open Font License; licencia incluida en `assets/fonts/OFL.txt`.

Consulta `credits.html` para el alcance y las fuentes.
