# Portafolio Estefania Farias 2026

Repositorio del portafolio de Estefania Farias, disenadora de ambientes.

## Contenido

- `portfolio/`: version web del portafolio.
- `portfolio/index.html`: archivo principal para abrir el sitio.
- `portfolio/css/`: estilos de la version web.
- `portfolio/js/`: interacciones del sitio.
- `portfolio/assets/`: imagenes usadas por el portafolio.
- `portfolio/tools/build_share_pdf.py`: generador de la version PDF editorial para compartir.
- `Portafolio EstefaniaFarias 2026.pdf`: PDF original de referencia.
- `Portafolio-Estefania-Farias-Share-2026.pdf`: PDF final preparado para compartir.
- `Renders/` y `Trabajos reales/`: material visual fuente.

## Abrir la version web

En PowerShell:

```powershell
Start-Process ".\portfolio\index.html"
```

## Regenerar el PDF para compartir

Desde esta carpeta:

```powershell
python ".\portfolio\tools\build_share_pdf.py"
```

El script genera el PDF en:

```powershell
..\output\pdf\fanny-portfolio-share-2026.pdf
```

Luego se puede copiar al archivo final del repositorio:

```powershell
Copy-Item "..\output\pdf\fanny-portfolio-share-2026.pdf" ".\Portafolio-Estefania-Farias-Share-2026.pdf" -Force
```
