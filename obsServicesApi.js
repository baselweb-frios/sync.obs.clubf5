/**
 * OBS (Object Storage Service) API Services
 * Basado en la API de Huawei Cloud OBS
 * @see https://support.huaweicloud.com/intl/en-us/api-obs/obs_04_0005.html
 *
 * Operaciones soportadas:
 * - Listar objetos (GET /)
 * - Subir objetos (PUT/POST)
 * - Descargar objetos (GET /ObjectName)
 * - Eliminar objetos (DELETE /ObjectName)
 * - Eliminar objetos en batch
 * - Copiar/Mover objetos
 * - Generar URLs firmadas
 * - Consultar metadatos
 */

import api from './api'

/**
 * Configuracion del servicio OBS
 */
const OBS_CONFIG = {
  // Endpoints base del backend
  BASE_PATH: '/ObsCloud',
  // Tamano maximo para upload directo (5GB segun API OBS)
  MAX_DIRECT_UPLOAD_SIZE: 5 * 1024 * 1024 * 1024,
  // Tamano recomendado para multipart (100MB)
  MULTIPART_THRESHOLD: 100 * 1024 * 1024,
  // Tamano de cada parte en multipart upload (5MB minimo segun OBS)
  PART_SIZE: 5 * 1024 * 1024,
  // Tipos de contenido comunes
  CONTENT_TYPES: {
    audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
    video: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'webm'],
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
    document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
    archive: ['zip', 'rar', '7z', 'tar', 'gz']
  }
}

/**
 * Servicio de OBS API
 */
const obsServicesApi = {}

// ============================================================================
// OPERACIONES DE LISTADO
// ============================================================================

/**
 * Listar objetos en un bucket con prefijo opcional
 * @see https://support.huaweicloud.com/intl/en-us/api-obs/obs_04_0005.html
 * @param {string} prefix - Prefijo para filtrar objetos (carpeta)
 * @param {Object} options - Opciones adicionales
 * @param {string} options.marker - Marcador para paginacion
 * @param {number} options.maxKeys - Maximo de objetos a retornar (default: 1000)
 * @param {string} options.delimiter - Delimitador para agrupar (default: '/')
 * @returns {Promise<Array>} Lista de objetos
 */
obsServicesApi.ListarObject = async function (prefix = '', options = {}) {
  const params = {
    prefix,
    ...options
  }
  return api.get(`${OBS_CONFIG.BASE_PATH}/Listar`, { params }).then(res => res.data)
}

/**
 * Listar objetos con paginacion completa
 * @param {string} prefix - Prefijo para filtrar
 * @param {number} maxKeys - Maximo de objetos por pagina
 * @returns {AsyncGenerator} Generador asincrono de objetos
 */
obsServicesApi.ListarObjectPaginado = async function* (prefix = '', maxKeys = 1000) {
  let marker = ''
  let hasMore = true

  while (hasMore) {
    const response = await obsServicesApi.ListarObject(prefix, { marker, maxKeys })
    const objects = Array.isArray(response) ? response : response.objects || []

    for (const obj of objects) {
      yield obj
    }

    // Verificar si hay mas paginas
    if (response.isTruncated && response.nextMarker) {
      marker = response.nextMarker
    } else {
      hasMore = false
    }
  }
}

/**
 * Listar solo carpetas (directorios) en una ruta
 * @param {string} prefix - Prefijo/ruta
 * @returns {Promise<Array>} Lista de carpetas
 */
obsServicesApi.ListarCarpetas = async function (prefix = '') {
  const objetos = await obsServicesApi.ListarObject(prefix)
  return objetos.filter(obj => obj.objectKey && obj.objectKey.endsWith('/'))
}

/**
 * Listar solo archivos (no carpetas) en una ruta
 * @param {string} prefix - Prefijo/ruta
 * @returns {Promise<Array>} Lista de archivos
 */
obsServicesApi.ListarArchivos = async function (prefix = '') {
  const objetos = await obsServicesApi.ListarObject(prefix)
  return objetos.filter(obj => obj.objectKey && !obj.objectKey.endsWith('/'))
}

/**
 * Buscar archivos por extension
 * @param {string} prefix - Prefijo/ruta
 * @param {string|Array<string>} extensiones - Extension(es) a buscar
 * @returns {Promise<Array>} Lista de archivos filtrados
 */
obsServicesApi.BuscarPorExtension = async function (prefix = '', extensiones) {
  const exts = Array.isArray(extensiones) ? extensiones : [extensiones]
  const archivos = await obsServicesApi.ListarArchivos(prefix)

  return archivos.filter(archivo => {
    const ext = archivo.objectKey.split('.').pop().toLowerCase()
    return exts.includes(ext)
  })
}

/**
 * Buscar archivos de audio
 * @param {string} prefix - Prefijo/ruta
 * @returns {Promise<Array>} Lista de archivos de audio
 */
obsServicesApi.BuscarAudio = async function (prefix = '') {
  return obsServicesApi.BuscarPorExtension(prefix, OBS_CONFIG.CONTENT_TYPES.audio)
}

/**
 * Buscar archivos de video
 * @param {string} prefix - Prefijo/ruta
 * @returns {Promise<Array>} Lista de archivos de video
 */
obsServicesApi.BuscarVideo = async function (prefix = '') {
  return obsServicesApi.BuscarPorExtension(prefix, OBS_CONFIG.CONTENT_TYPES.video)
}

/**
 * Buscar archivos de imagen
 * @param {string} prefix - Prefijo/ruta
 * @returns {Promise<Array>} Lista de archivos de imagen
 */
obsServicesApi.BuscarImagenes = async function (prefix = '') {
  return obsServicesApi.BuscarPorExtension(prefix, OBS_CONFIG.CONTENT_TYPES.image)
}

// ============================================================================
// OPERACIONES DE UPLOAD
// ============================================================================

/**
 * Subir archivo(s) al OBS
 * @see https://support.huaweicloud.com/intl/en-us/api-obs/obs_04_0005.html (PUT Object)
 * @param {FormData} formdata - FormData con archivo y ruta
 * @param {Object} options - Opciones adicionales
 * @param {Function} options.onProgress - Callback de progreso (0-100)
 * @returns {Promise<*>} Resultado de la operacion
 */
obsServicesApi.SubirFiles = async function (formdata, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }

  // Agregar seguimiento de progreso si se proporciona callback
  if (options.onProgress) {
    config.onUploadProgress = (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      options.onProgress(percentCompleted)
    }
  }

  return api.post(`${OBS_CONFIG.BASE_PATH}/Upload`, formdata, config).then(res => res.data)
}

/**
 * Subir archivo con metadata personalizada
 * @param {File} file - Archivo a subir
 * @param {string} objectKey - Ruta/nombre del objeto en OBS
 * @param {Object} metadata - Metadata personalizada
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<*>} Resultado de la operacion
 */
obsServicesApi.SubirConMetadata = async function (file, objectKey, metadata = {}, options = {}) {
  const formdata = new FormData()
  formdata.append('file', file)
  formdata.append('filePath', objectKey)

  // Agregar metadata como JSON
  if (Object.keys(metadata).length > 0) {
    formdata.append('metadata', JSON.stringify(metadata))
  }

  return obsServicesApi.SubirFiles(formdata, options)
}

/**
 * Subir multiples archivos en paralelo
 * @param {Array<{file: File, objectKey: string}>} archivos - Lista de archivos
 * @param {Object} options - Opciones
 * @param {number} options.concurrency - Concurrencia maxima (default: 3)
 * @param {Function} options.onFileProgress - Callback por archivo
 * @param {Function} options.onTotalProgress - Callback de progreso total
 * @returns {Promise<Array>} Resultados de cada upload
 */
obsServicesApi.SubirMultiples = async function (archivos, options = {}) {
  const { concurrency = 3, onFileProgress, onTotalProgress } = options
  const results = []
  let completados = 0

  // Procesar en lotes segun concurrencia
  for (let i = 0; i < archivos.length; i += concurrency) {
    const batch = archivos.slice(i, i + concurrency)

    const batchPromises = batch.map(async ({ file, objectKey }, batchIndex) => {
      const formdata = new FormData()
      formdata.append('file', file)
      formdata.append('filePath', objectKey)

      try {
        const result = await obsServicesApi.SubirFiles(formdata, {
          onProgress: (progress) => {
            if (onFileProgress) {
              onFileProgress(i + batchIndex, progress, file.name)
            }
          }
        })

        completados++
        if (onTotalProgress) {
          onTotalProgress(Math.round((completados / archivos.length) * 100))
        }

        return { success: true, objectKey, result }
      } catch (error) {
        completados++
        if (onTotalProgress) {
          onTotalProgress(Math.round((completados / archivos.length) * 100))
        }
        return { success: false, objectKey, error }
      }
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
  }

  return results
}

/**
 * Crear una carpeta (objeto vacio con '/' al final)
 * @param {string} folderPath - Ruta de la carpeta
 * @returns {Promise<*>} Resultado de la operacion
 */
obsServicesApi.CrearCarpeta = async function (folderPath) {
  // Asegurar que termina con '/'
  const path = folderPath.endsWith('/') ? folderPath : `${folderPath}/`

  const formdata = new FormData()
  // Crear un blob vacio para la carpeta
  const emptyBlob = new Blob([''], { type: 'application/x-directory' })
  formdata.append('file', emptyBlob, '.folder')
  formdata.append('filePath', path)

  return api.post(`${OBS_CONFIG.BASE_PATH}/Upload`, formdata, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data)
}

// ============================================================================
// OPERACIONES DE DESCARGA
// ============================================================================

/**
 * Descargar archivo del OBS
 * @see https://support.huaweicloud.com/intl/en-us/api-obs/obs_04_0083.html
 * @param {string} objectName - Nombre/ruta del objeto
 * @param {Object} options - Opciones de descarga
 * @param {string} options.range - Rango de bytes (ej: 'bytes=0-1023')
 * @param {string} options.versionId - ID de version especifica
 * @returns {Promise<Blob>} Blob del archivo
 */
obsServicesApi.Download = async function (objectName, options = {}) {
  const params = { objectName, ...options }

  return api.get(`${OBS_CONFIG.BASE_PATH}/Download`, {
    params,
    responseType: 'blob'
  }).then(res => res.data)
}

/**
 * Descargar archivo y guardarlo automaticamente
 * @param {string} objectName - Nombre/ruta del objeto
 * @param {string} fileName - Nombre para guardar (opcional)
 * @returns {Promise<void>}
 */
obsServicesApi.DownloadYGuardar = async function (objectName, fileName = null) {
  const blob = await obsServicesApi.Download(objectName)
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName || objectName.split('/').pop()
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

/**
 * Obtener URL de descarga directa (pre-firmada)
 * @param {string} objectKey - Clave del objeto
 * @param {number} expirationMinutes - Minutos de validez (default: 60)
 * @returns {Promise<string>} URL firmada
 */
obsServicesApi.GetDownloadUrl = async function (objectKey, expirationMinutes = 60) {
  return api.get(`${OBS_CONFIG.BASE_PATH}/GenLink`, {
    params: { objectKey, expiration: expirationMinutes }
  }).then(res => res.data)
}

/**
 * Descargar rango de bytes (para streaming o descarga parcial)
 * @param {string} objectName - Nombre del objeto
 * @param {number} start - Byte inicial
 * @param {number} end - Byte final
 * @returns {Promise<Blob>} Blob parcial
 */
obsServicesApi.DownloadRango = async function (objectName, start, end) {
  return obsServicesApi.Download(objectName, {
    range: `bytes=${start}-${end}`
  })
}

// ============================================================================
// OPERACIONES DE ELIMINACION
// ============================================================================

/**
 * Eliminar un archivo del OBS
 * @see https://support.huaweicloud.com/intl/en-us/api-obs/obs_04_0005.html (DELETE Object)
 * @param {string} objectName - Nombre/ruta del objeto
 * @returns {Promise<*>} Resultado de la operacion
 */
obsServicesApi.EliminarArchivo = async function (objectName) {
  return api.delete(`${OBS_CONFIG.BASE_PATH}/Delete`, {
    params: { objectName }
  }).then(res => res.data)
}

/**
 * Eliminar un objeto (carpeta/directorio) y su contenido
 * @param {string} objectKey - Clave del objeto/carpeta
 * @returns {Promise<*>} Resultado de la operacion
 */
obsServicesApi.EliminarObjeto = async function (objectKey) {
  return api.delete(`${OBS_CONFIG.BASE_PATH}/EliminarObjeto`, {
    params: { objectKey }
  }).then(res => res.data)
}

/**
 * Eliminar multiples archivos en batch
 * @param {Array<string>} objectKeys - Lista de claves de objetos
 * @returns {Promise<Array>} Resultados de cada eliminacion
 */
obsServicesApi.EliminarMultiples = async function (objectKeys) {
  const promises = objectKeys.map(key =>
    obsServicesApi.EliminarArchivo(key)
      .then(() => ({ success: true, objectKey: key }))
      .catch(error => ({ success: false, objectKey: key, error }))
  )
  return Promise.all(promises)
}

/**
 * Eliminar carpeta y todo su contenido recursivamente
 * @param {string} folderPath - Ruta de la carpeta
 * @param {Function} onProgress - Callback de progreso
 * @returns {Promise<{deleted: number, errors: Array}>}
 */
obsServicesApi.EliminarCarpetaRecursivo = async function (folderPath, onProgress = null) {
  const path = folderPath.endsWith('/') ? folderPath : `${folderPath}/`
  const objetos = await obsServicesApi.ListarObject(path)

  let deleted = 0
  const errors = []

  for (const obj of objetos) {
    try {
      if (obj.objectKey.endsWith('/')) {
        // Es una subcarpeta, eliminar recursivamente
        await obsServicesApi.EliminarCarpetaRecursivo(obj.objectKey)
      } else {
        await obsServicesApi.EliminarArchivo(obj.objectKey)
      }
      deleted++

      if (onProgress) {
        onProgress(deleted, objetos.length)
      }
    } catch (error) {
      errors.push({ objectKey: obj.objectKey, error })
    }
  }

  // Eliminar la carpeta principal
  try {
    await obsServicesApi.EliminarObjeto(path)
    deleted++
  } catch (error) {
    errors.push({ objectKey: path, error })
  }

  return { deleted, errors }
}

/**
 * Eliminar archivo y notificar a clientes via SignalR
 * @param {string} objectKey - Clave del objeto
 * @param {string} fileName - Nombre del archivo
 * @param {string} radioId - ID de la radio (opcional)
 * @param {Object} signalR - Instancia de useSignalRAuth (opcional)
 * @returns {Promise<*>}
 */
obsServicesApi.EliminarArchivoYNotificar = async function (objectKey, fileName, radioId = null, signalR = null) {
  try {
    // 1. Eliminar el archivo del OBS
    const result = await api.delete(`${OBS_CONFIG.BASE_PATH}/Delete`, {
      params: { objectName: objectKey }
    }).then(res => res.data)

    // 2. Enviar notificacion por SignalR
    if (signalR && signalR.connected()) {
      try {
        const notificationData = {
          fileName,
          objectKey,
          radioId,
          deletedAt: new Date().toISOString(),
          action: 'MusicFileDeleted'
        }

        await signalR.sendMessageToAll(JSON.stringify({
          type: 'MusicFileDeleted',
          data: notificationData,
          message: `Archivo de musica eliminado: ${fileName}`
        }))

        console.log('[OBS API] Notificacion de eliminacion enviada via SignalR:', notificationData)
      } catch (signalrError) {
        console.error('[OBS API] Error al enviar notificacion SignalR:', signalrError)
      }
    } else {
      console.warn('[OBS API] SignalR no disponible para notificacion')
    }

    return result
  } catch (error) {
    console.error('[OBS API] Error al eliminar archivo:', error)
    throw error
  }
}

// ============================================================================
// OPERACIONES DE COPIA/MOVIMIENTO
// ============================================================================

/**
 * Mover objeto a nueva ubicacion
 * @param {Object} postData - Datos de movimiento
 * @param {string} postData.origen - Ruta origen
 * @param {string} postData.destino - Ruta destino
 * @returns {Promise<*>} Resultado de la operacion
 */
obsServicesApi.Mover = async function (postData) {
  return api.post(`${OBS_CONFIG.BASE_PATH}/Mover`, postData).then(res => res.data)
}

/**
 * Copiar objeto (sin eliminar el original)
 * @param {string} origen - Ruta origen
 * @param {string} destino - Ruta destino
 * @returns {Promise<*>} Resultado de la operacion
 */
obsServicesApi.Copiar = async function (origen, destino) {
  return api.post(`${OBS_CONFIG.BASE_PATH}/Copiar`, { origen, destino }).then(res => res.data)
}

/**
 * Renombrar objeto
 * @param {string} objectKey - Clave actual del objeto
 * @param {string} nuevoNombre - Nuevo nombre (solo nombre, no ruta completa)
 * @returns {Promise<*>} Resultado de la operacion
 */
obsServicesApi.Renombrar = async function (objectKey, nuevoNombre) {
  const partes = objectKey.split('/')
  partes[partes.length - 1] = nuevoNombre
  const nuevoObjectKey = partes.join('/')

  return obsServicesApi.Mover({
    origen: objectKey,
    destino: nuevoObjectKey
  })
}

/**
 * Mover multiples archivos a una carpeta destino
 * @param {Array<string>} objectKeys - Lista de claves de objetos
 * @param {string} carpetaDestino - Carpeta destino
 * @returns {Promise<Array>} Resultados de cada movimiento
 */
obsServicesApi.MoverMultiples = async function (objectKeys, carpetaDestino) {
  const destino = carpetaDestino.endsWith('/') ? carpetaDestino : `${carpetaDestino}/`

  const promises = objectKeys.map(key => {
    const nombreArchivo = key.split('/').pop()
    return obsServicesApi.Mover({
      origen: key,
      destino: `${destino}${nombreArchivo}`
    })
      .then(() => ({ success: true, objectKey: key }))
      .catch(error => ({ success: false, objectKey: key, error }))
  })

  return Promise.all(promises)
}

// ============================================================================
// OPERACIONES DE LINKS Y URLS
// ============================================================================

/**
 * Generar link de acceso temporal (URL firmada)
 * @param {string} objectKey - Clave del objeto
 * @param {number} expirationMinutes - Minutos de validez
 * @returns {Promise<string>} URL firmada
 */
obsServicesApi.GetLink = async function (objectKey, expirationMinutes = 60) {
  return api.get(`${OBS_CONFIG.BASE_PATH}/GenLink`, {
    params: { objectKey, expiration: expirationMinutes }
  }).then(res => res.data)
}

/**
 * Generar links para multiples objetos
 * @param {Array<string>} objectKeys - Lista de claves
 * @param {number} expirationMinutes - Minutos de validez
 * @returns {Promise<Array<{objectKey: string, url: string}>>}
 */
obsServicesApi.GetLinksMultiples = async function (objectKeys, expirationMinutes = 60) {
  const promises = objectKeys.map(async key => {
    try {
      const url = await obsServicesApi.GetLink(key, expirationMinutes)
      return { objectKey: key, url, success: true }
    } catch (error) {
      return { objectKey: key, url: null, success: false, error }
    }
  })

  return Promise.all(promises)
}

// ============================================================================
// OPERACIONES DE MUSICA (ESPECIFICAS DEL PROYECTO)
// ============================================================================

/**
 * Obtener musica desde API
 * @param {Object} listaRadioDescarga - Lista de radios para descarga
 * @param {string} marker - Marcador de paginacion
 * @returns {Promise<*>} Datos de musica
 */
obsServicesApi.GetMusicApi = async function (listaRadioDescarga, marker = '') {
  return api.post(`${OBS_CONFIG.BASE_PATH}/GetMusicApi`, {
    listaRadioDescarga,
    marker
  }).then(res => res.data)
}

/**
 * Sincronizar radios desde OBS
 * @returns {Promise<*>} Resultado de sincronizacion
 */
obsServicesApi.SincronizarRadios = async function () {
  return api.post(`${OBS_CONFIG.BASE_PATH}/SincronizarRadios`).then(res => res.data)
}

/**
 * Buscar archivos de musica en una carpeta de genero
 * @param {string} codigoGenero - Codigo del genero musical
 * @returns {Promise<Array>} Lista de archivos de audio
 */
obsServicesApi.BuscarMusicaPorGenero = async function (codigoGenero) {
  const prefix = `musica/generos/${codigoGenero}/`
  return obsServicesApi.BuscarAudio(prefix)
}

/**
 * Buscar archivos de musica en una carpeta de subgenero
 * @param {string} codigoGenero - Codigo del genero musical
 * @param {string} codigoSubgenero - Codigo del subgenero
 * @returns {Promise<Array>} Lista de archivos de audio
 */
obsServicesApi.BuscarMusicaPorSubgenero = async function (codigoGenero, codigoSubgenero) {
  const prefix = `musica/generos/${codigoGenero}/${codigoSubgenero}/`
  return obsServicesApi.BuscarAudio(prefix)
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Obtener informacion de un objeto (metadatos)
 * @param {string} objectKey - Clave del objeto
 * @returns {Promise<Object>} Metadatos del objeto
 */
obsServicesApi.GetObjectInfo = async function (objectKey) {
  return api.get(`${OBS_CONFIG.BASE_PATH}/ObjectInfo`, {
    params: { objectKey }
  }).then(res => res.data)
}

/**
 * Verificar si un objeto existe
 * @param {string} objectKey - Clave del objeto
 * @returns {Promise<boolean>}
 */
obsServicesApi.ExisteObjeto = async function (objectKey) {
  try {
    await obsServicesApi.GetObjectInfo(objectKey)
    return true
  } catch {
    return false
  }
}

/**
 * Obtener el tipo de contenido basado en la extension
 * @param {string} filename - Nombre del archivo
 * @returns {string} Tipo de contenido
 */
obsServicesApi.GetContentType = function (filename) {
  const ext = filename.split('.').pop().toLowerCase()

  const mimeTypes = {
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    aac: 'audio/aac',
    m4a: 'audio/mp4',
    // Video
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    mov: 'video/quicktime',
    webm: 'video/webm',
    // Imagen
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    // Documento
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
    // Archivo
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed'
  }

  return mimeTypes[ext] || 'application/octet-stream'
}

/**
 * Formatear tamano de bytes a formato legible
 * @param {number} bytes - Tamano en bytes
 * @param {number} decimals - Decimales a mostrar
 * @returns {string} Tamano formateado
 */
obsServicesApi.FormatSize = function (bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

/**
 * Obtener icono segun el tipo de archivo
 * @param {string} filename - Nombre del archivo
 * @returns {string} Clase CSS del icono
 */
obsServicesApi.GetFileIcon = function (filename) {
  const ext = filename.split('.').pop().toLowerCase()

  if (OBS_CONFIG.CONTENT_TYPES.audio.includes(ext)) return 'fas fa-file-audio'
  if (OBS_CONFIG.CONTENT_TYPES.video.includes(ext)) return 'fas fa-file-video'
  if (OBS_CONFIG.CONTENT_TYPES.image.includes(ext)) return 'fas fa-file-image'
  if (ext === 'pdf') return 'fas fa-file-pdf'
  if (['doc', 'docx'].includes(ext)) return 'fas fa-file-word'
  if (['xls', 'xlsx'].includes(ext)) return 'fas fa-file-excel'
  if (['ppt', 'pptx'].includes(ext)) return 'fas fa-file-powerpoint'
  if (OBS_CONFIG.CONTENT_TYPES.archive.includes(ext)) return 'fas fa-file-archive'
  if (ext === 'txt') return 'fas fa-file-alt'

  return 'fas fa-file'
}

/**
 * Obtener nombre de archivo de una ruta completa
 * @param {string} objectKey - Clave del objeto
 * @returns {string} Nombre del archivo
 */
obsServicesApi.GetNombreArchivo = function (objectKey) {
  const parts = objectKey.split('/').filter(p => p)
  return parts[parts.length - 1] || objectKey
}

/**
 * Obtener la carpeta padre de un objeto
 * @param {string} objectKey - Clave del objeto
 * @returns {string} Ruta de la carpeta padre
 */
obsServicesApi.GetCarpetaPadre = function (objectKey) {
  const parts = objectKey.split('/').filter(p => p)
  parts.pop()
  return parts.length > 0 ? parts.join('/') + '/' : ''
}

/**
 * Validar si el archivo es de un tipo permitido
 * @param {string} filename - Nombre del archivo
 * @param {Array<string>} allowedTypes - Tipos permitidos (ej: ['audio', 'video'])
 * @returns {boolean}
 */
obsServicesApi.ValidarTipoArchivo = function (filename, allowedTypes) {
  const ext = filename.split('.').pop().toLowerCase()

  for (const type of allowedTypes) {
    if (OBS_CONFIG.CONTENT_TYPES[type]?.includes(ext)) {
      return true
    }
  }

  return false
}

/**
 * Validar tamano de archivo
 * @param {number} size - Tamano en bytes
 * @param {number} maxSizeMB - Tamano maximo en MB
 * @returns {{valid: boolean, message: string}}
 */
obsServicesApi.ValidarTamanoArchivo = function (size, maxSizeMB = 100) {
  const maxBytes = maxSizeMB * 1024 * 1024

  if (size > maxBytes) {
    return {
      valid: false,
      message: `El archivo excede el tamano maximo permitido de ${maxSizeMB}MB`
    }
  }

  return { valid: true, message: '' }
}

// Exportar configuracion para uso externo
obsServicesApi.CONFIG = OBS_CONFIG

export default obsServicesApi
