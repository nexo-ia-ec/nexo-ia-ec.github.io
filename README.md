# Nexo IA — sitio web

Sitio oficial de **Nexo IA**, el puente a la inteligencia artificial en los negocios (Santa Rosa, El Oro, Ecuador).

Sitio publicado: https://nexo-ia-ec.github.io/

## Estructura

```
index.html          Página principal
privacidad.html     Política de privacidad (LOPDP, art. 12)
404.html            Página de error
assets/css/         Estilos (variables de diseño al inicio del archivo)
assets/js/app.js    Menú móvil, selector de negocio, formulario y enlaces de WhatsApp
assets/img/         Logo (WebP), íconos e imagen para redes
assets/fonts/       Inter y Space Grotesk alojadas en el sitio (licencia SIL OFL 1.1)
robots.txt, sitemap.xml
```

## Cómo editar

- **Textos:** directamente en `index.html` o `privacidad.html`.
- **Mensajes de WhatsApp:** cada enlace tiene un atributo `data-mensaje` con el texto en español; `app.js` lo convierte en el enlace final. Si JavaScript falla, el enlace abre el chat igual, sin el mensaje.
- **Selector de negocio:** los textos de cada tipo están en el objeto `NEGOCIOS` de `app.js`.
- **Colores y tipografía:** variables en `:root`, al inicio de `assets/css/estilos.css`.

## Decisiones de calidad

- **Sin base de datos ni servidor:** el formulario valida en el navegador y envía la solicitud por WhatsApp. No se guardan datos personales en el sitio.
- **Privacidad:** sin cookies, sin analítica y con fuentes propias (no se envían datos a terceros al cargar la página).
- **Accesibilidad (WCAG 2.2 AA):** enlace "Saltar al contenido", foco visible, etiquetas en todos los campos, mensajes de error asociados a cada campo, contraste de al menos 4,5:1 y animaciones que respetan "reducir movimiento".
- **Rendimiento:** página estática, logo de 7 KB en WebP con tamaño declarado e imágenes sin cambios de diseño durante la carga.

## Publicación

GitHub Pages publica automáticamente la rama `main`. Cada cambio que se sube a `main` actualiza el sitio en uno o dos minutos.

© 2026 Nexo IA. Todos los derechos reservados.
