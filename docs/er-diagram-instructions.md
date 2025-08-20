# Instrucciones para exportar el diagrama ER (Mermaid)

Este archivo muestra cómo generar una imagen (SVG/PNG) a partir del diagrama Mermaid ubicado en `docs/er-diagram.mmd`.

Opciones rápidas (Windows PowerShell):

1) Usando npx (sin instalar globalmente)

```powershell
# instala y ejecuta la CLI temporalmente
npx -y @mermaid-js/mermaid-cli -i docs/er-diagram.mmd -o docs/er-diagram.svg
# para PNG
npx -y @mermaid-js/mermaid-cli -i docs/er-diagram.mmd -o docs/er-diagram.png
```

2) Instalando la CLI globalmente

```powershell
npm install -g @mermaid-js/mermaid-cli
mmdc -i docs/er-diagram.mmd -o docs/er-diagram.svg
```

3) Alternativas
- Abrir `docs/er-diagram.mmd` en VSCode con la extensión "Markdown Preview Mermaid Support" o usar el sitio https://mermaid.live para pegar el contenido y exportar.

Notas:
- Si el diagrama contiene caracteres especiales o nombres largos, puede requerir ajustar la opción `-w` (width) o `-H` (config) de la CLI.
- El comando `npx` descargará temporalmente la dependencia la primera vez. Asegúrate de estar conectado a internet.
- **Nota**: Si tienes problemas con la CLI de Mermaid (especialmente warnings sobre Puppeteer), usa las alternativas:
  - VSCode con extensión "Mermaid Preview" o "Markdown Preview Mermaid Support"
  - Sitio web https://mermaid.live para pegar el contenido y exportar manualmente
  - Plugin de Mermaid para editores como Obsidian, Notion, etc.
