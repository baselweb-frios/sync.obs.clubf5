const fs = require('fs');
const path = require('path');

function generateIcons() {
  const publicDir = path.join(__dirname, '../public');
  const pngPath = path.join(publicDir, 'icon.png');
  const svgPath = path.join(publicDir, 'icon.svg');

  // Verificar si ya existe el icono PNG
  if (fs.existsSync(pngPath)) {
    console.log('✓ icon.png ya existe, saltando generación de iconos');
    console.log('Nota: electron-builder generará automáticamente los formatos .ico e .icns durante la compilación');
    return;
  }

  try {
    const { Resvg } = require('@resvg/resvg-js');

    console.log('Generando icon.png desde icon.svg...');

    // Leer el SVG
    const svg = fs.readFileSync(svgPath, 'utf8');

    // Renderizar con resvg a 512x512
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: 512,
      },
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Guardar el PNG
    fs.writeFileSync(pngPath, pngBuffer);

    console.log('✓ icon.png generado exitosamente (512x512)');
    console.log('Nota: electron-builder generará automáticamente los formatos .ico e .icns durante la compilación');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.warn('⚠️  @resvg/resvg-js no está instalado.');
      console.warn('Instálalo con: pnpm add -D @resvg/resvg-js');
      console.warn('O crea manualmente icon.png (512x512) desde icon.svg');
      process.exit(0);
    } else {
      console.error('⚠️  Error generando iconos:', error.message);
      console.warn('Por favor, crea manualmente icon.png (512x512) desde icon.svg');
      process.exit(0);
    }
  }
}

generateIcons();
