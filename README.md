# Sync OBS

Aplicación de escritorio multiplataforma para sincronizar archivos locales con Huawei Object Storage Service (OBS).

## Características

- 📁 **Navegación dual**: Paneles estilo Total Commander (Local | OBS)
- ⬆️ **Upload/Download**: Transferencia de archivos con progreso
- 🔄 **Sincronización**: Comparar y sincronizar carpetas
- 👁️ **Watch automático**: Detectar cambios en tiempo real
- 🎯 **Filtros**: Patrones de exclusión configurables
- 🌙 **Tema oscuro**: Soporte para tema claro/oscuro

## Requisitos

- Node.js 18+
- npm o yarn

## Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Construir para Windows
npm run build:win

# Construir para macOS
npm run build:mac

# Construir para Linux
npm run build:linux
```

## Configuración

1. Abre la aplicación
2. Ve a Configuración (⚙️)
3. Ingresa tus credenciales de Huawei Cloud OBS:
   - **Access Key ID**: Tu AK
   - **Secret Access Key**: Tu SK
   - **Endpoint**: URL del servicio OBS (ej: `https://obs.la-south-2.myhuaweicloud.com`)
   - **Bucket**: Nombre del bucket

## Atajos de teclado

| Atajo | Acción |
|-------|--------|
| F2 | Actualizar |
| F5 | Copiar |
| F6 | Mover |
| F7 | Nueva carpeta |
| Del | Eliminar |
| Ctrl+Click | Selección múltiple |

## Estructura del proyecto

```
src/
├── main/           # Proceso principal Electron
│   ├── index.ts    # Entry point
│   ├── fileSystem.ts   # APIs del sistema de archivos
│   ├── watchService.ts # Monitor de cambios
│   └── configService.ts # Almacenamiento de configuración
├── preload/        # Script de preload
│   └── index.ts    # Bridge electron-renderer
└── renderer/       # Aplicación Vue
    ├── App.vue
    ├── main.ts
    ├── components/
    ├── services/
    ├── stores/
    └── styles/
```

## Tecnologías

- **Electron** - Framework de aplicación de escritorio
- **Vue 3** - Framework de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Pinia** - State management
- **Tailwind CSS** - Estilos
- **esdk-obs-browserjs** - SDK oficial de Huawei OBS
- **chokidar** - Watch de archivos

## Licencia

MIT
