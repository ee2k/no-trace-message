export default {
  create: {
    title: 'Mensaje Autodestructivo - Crear',
    header: 'Mensaje que se autodestruye',
    subtitle: 'Una plataforma de código abierto segura y anónima',
    features: {
      noHistory: 'Sin historial',
      noTracking: 'Sin rastreo',
      noDatabase: 'Sin base de datos'
    },
    messageInput: 'Escribe tu mensaje aquí...',
    createButton: 'Crear Mensaje Autodestructivo',
    dropZoneText: 'Haz clic o suelta la imagen aquí',
    dropZoneHint: '1 imagen, 3MB máximo',
    dropZoneFormat: '( jpg png gif webp )',
    useCustomID: 'Usar ID de mensaje personalizado',
    useAccessToken: 'Usar token de acceso',
    visible: 'Visible',
    validity: 'Validez',
    tokenPlaceholder: 'una línea memorable podría ser buena~',
    tokenHintPlaceholder: 'Pista de token opcional\n\nej., \'Nuestra cafetería favorita\'',
    validation: {
      emptyCustomID: 'Por favor ingrese un ID de mensaje personalizado.',
      emptyMessage: 'Por favor ingrese un mensaje o agregue imágenes',
      emptyToken: 'Por favor ingrese un token personalizado.',
      maxImages: 'Solo se permite {{count}} imagen. Por favor elimine la imagen existente primero.',
      fileType: 'Tipo de archivo {{type}} no soportado',
      fileSize: 'El tamaño del archivo excede el límite de {{size}}MB'
    },
    errors: {
      INVALID_EXPIRY: 'Tiempo de expiración seleccionado inválido',
      INVALID_BURN: 'Tiempo de destrucción seleccionado inválido',
      INVALID_FONT: 'Tamaño de fuente seleccionado inválido',
      MAX_IMAGES_EXCEEDED: 'Solo se permite 1 imagen',
      INVALID_FILE_TYPE: 'Tipo de archivo no soportado',
      FILE_TOO_LARGE: 'El tamaño del archivo excede el límite de 3MB',
      TOO_MANY_ATTEMPTS: 'Demasiadas solicitudes. Por favor espere un momento.',
      SERVER_ERROR: 'Error del servidor. Por favor intente nuevamente más tarde.',
      createFailed: 'Error al crear el mensaje. Por favor intente nuevamente.',
      networkError: 'Error de red. Por favor intente nuevamente más tarde.',
      MESSAGE_ID_EXISTS: 'El ID de mensaje ya existe, por favor elija otro.'
    }
  }
}