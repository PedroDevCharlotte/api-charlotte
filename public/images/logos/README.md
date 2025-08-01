# Charlotte Chemical - Logos

Esta carpeta contiene los logos y recursos gráficos de Charlotte Chemical.

## Archivos recomendados:

- `charlotte-logo.png` - Logo principal (formato PNG con transparencia)
- `charlotte-logo.svg` - Logo vectorial (escalable)
- `charlotte-logo-white.png` - Logo en blanco para fondos oscuros
- `charlotte-logo-horizontal.png` - Logo horizontal para emails
- `charlotte-logo-small.png` - Logo pequeño (para favicons, etc.)

## Uso en la aplicación:

Los logos se sirven estáticamente desde esta carpeta y pueden ser accedidos mediante:
- URL local: `http://localhost:3006/images/logos/charlotte-logo.png`
- URL producción: `https://tu-dominio.com/images/logos/charlotte-logo.png`

## Configuración:

Para usar estos logos en los emails, actualiza la variable de entorno:
```
CHARLOTTE_LOGO_URL=http://localhost:3006/images/logos/charlotte-logo.png
```
