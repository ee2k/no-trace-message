export default {
  create: {
    title: 'Burning Message - Crear',
    subtitle: 'Una plataforma de código abierto segura y anónima',
    features: {
      noHistory: 'Sin historial',
      noTracking: 'Sin rastreo',
      noDatabase: 'Sin base de datos'
    },
    messageInput: 'Escribe tu mensaje aquí...',
    createButton: 'Crear Mensaje Efímero',
    dropZoneText: 'Haz clic o arrastra una imagen aquí',
    dropZoneHint: '1 imagen, máx. 3MB',
    dropZoneFormat: '( jpg png gif webp )',
    useAccessToken: 'Usar token de acceso',
    visible: 'Visible',
    validity: 'Validez',
    tokenPlaceholder: '6~70 caracteres\n\nPuede ser una frase memorable~',
    tokenHintPlaceholder: 'Pista opcional para el token\n\np.ej. \'Nuestro café favorito\'',
    validation: {
      emptyCustomID: 'Por favor, ingresa un ID de mensaje personalizado',
      emptyMessage: 'Por favor, ingresa un mensaje o agrega imágenes',
      emptyToken: 'Por favor, ingresa un token personalizado',
      maxImages: 'Solo se permite {{count}} imagen. Por favor, elimina la imagen existente primero',
      fileType: 'Tipo de archivo {{type}} no soportado',
      fileSize: 'El tamaño del archivo excede el límite de {{size}}MB'
    },
    errors: {
      INVALID_EXPIRY: 'Tiempo de expiración seleccionado no válido',
      INVALID_BURN: 'Tiempo de lectura seleccionado no válido',
      INVALID_FONT: 'Tamaño de fuente seleccionado no válido',
      MAX_IMAGES_EXCEEDED: 'Solo se permite 1 imagen',
      INVALID_FILE_TYPE: 'Tipo de archivo no soportado',
      FILE_TOO_LARGE: 'El tamaño del archivo excede el límite de 3MB',
      TOO_MANY_ATTEMPTS: 'Demasiadas solicitudes. Por favor, espera un momento',
      SERVER_ERROR: 'Error del servidor. Por favor, inténtalo más tarde',
      createFailed: 'No se pudo crear el mensaje. Por favor, inténtalo de nuevo',
      networkError: 'Error de red. Por favor, inténtalo más tarde',
      MESSAGE_ID_EXISTS: 'El ID del mensaje ya existe, por favor elige otro.'
    }
  }
}