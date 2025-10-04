# Placeholders para Imágenes

Esta carpeta contiene imágenes genéricas que se subirán a Cloudinary como placeholders.

## Estructura

Las imágenes se organizarán en Cloudinary así:

```
/vibra/placeholders/rock/
/vibra/placeholders/pop/
/vibra/placeholders/jazz/
/vibra/placeholders/electronic/
/vibra/placeholders/default/
```

## Uso

1. Coloca imágenes genéricas aquí (formato: `.jpg`, `.png`)
2. Ejecuta el script de seeds para subirlas a Cloudinary
3. Las URLs se usarán como placeholders en el `StubImageGenerator`

## Recomendaciones

- Tamaño mínimo: 1024x1024px
- Formato: JPG o PNG
- Peso máximo: 2MB por imagen
- Estilo: Abstracto, colores vibrantes, relacionados con música

## Imágenes por Género

Puedes usar las imágenes de muestra que Cloudinary ya incluye, o agregar tus propias imágenes aquí.
