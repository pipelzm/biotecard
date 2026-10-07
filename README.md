# BioteCard · Aukantun Team

Versión final del prototipo, preparada para GitHub Pages. Incluye las 40 cartas originales, el carrusel Cover Flow, las fichas de organismos, el catálogo, los manuales, los iconos ATP/GEN/NUCLEÓTIDO, los colores por grupo y las redes sociales.

## Publicar en GitHub Pages

1. Descomprime este ZIP en tu equipo.
2. Crea un repositorio en GitHub, por ejemplo `biotecard`.
3. Sube el contenido descomprimido a la raíz del repositorio y guarda los cambios en la rama `main`. `index.html` debe quedar directamente en la raíz; conserva las carpetas `assets` y `data` con su estructura. Puedes subir los archivos en varias tandas. No subas únicamente el ZIP.
4. En el repositorio, abre **Settings → Pages**.
5. En **Build and deployment → Source**, elige **Deploy from a branch**.
6. Selecciona la rama **main**, la carpeta **/(root)** y pulsa **Save**.
7. Cuando finalice la publicación, abre la dirección que muestra GitHub Pages.

No requiere instalar paquetes ni ejecutar una compilación. Se incluye `.nojekyll` para servir el contenido estático directamente.

Guía oficial: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Editar el sitio

- `index.html`: estructura, textos y redes sociales.
- `style.css`: colores, botones y animaciones.
- `identity.css`: identidad tipográfica, cabecera y sección de juego.
- `assets/fonts/`: Space Grotesk, Fraunces e IBM Plex Mono incluidas, junto con sus licencias.
- `app.js`: carrusel, búsqueda, filtros y fichas.
- `data/cards.json`: catálogo de las 40 cartas y referencias científicas.
- `assets/cards/`: cartas completas y miniaturas.
- `assets/branding/biotecard-logo.png`: logotipo con transparencia y letras azules originales; en la página, CSS las muestra claras para los fondos oscuros.
- `assets/branding/favicon.svg`: icono de pestaña basado en las cartas del nuevo logo.
- `assets/resources/`: imágenes de ATP, GEN y NUCLEÓTIDO.
- `assets/credits.json`: créditos y licencias de fotografías.
- `assets/manual-1.pdf` y `assets/manual-2.pdf`: manual inicial.

Las rutas son relativas y permiten publicar el sitio dentro de un repositorio de proyecto. Conserva los créditos de las fotografías y las referencias científicas.

## Previsualizar en tu equipo

Desde la carpeta descomprimida, si tienes Python instalado, ejecuta:

```sh
python3 -m http.server 8000
```

Abre http://localhost:8000 en el navegador. En Windows puedes usar `py -m http.server 8000`.
El catálogo se carga desde JSON: utiliza un servidor local para visualizarlo, en lugar de abrir `index.html` con doble clic.

© 2026 Aukantun Team  
Powered by RAVEN | プログラム

Actualización de diseño: nuevo logotipo BioteCard transparente en cabecera, pie e icono de pestaña. Se retiró el bloque de cuatro cartas grandes y se dejó una introducción compacta a las reglas. Las fuentes están incluidas y no requieren conexión a Google Fonts.
