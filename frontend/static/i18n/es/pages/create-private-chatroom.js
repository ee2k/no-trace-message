export default {
  title: "NoTrace Chat - Crear una sala privada",
  header: 'Crear una sala privada',
  create: {
    useCustomID: "Usar ID personalizado",
    idPlaceholder: "ej, 'jane únete a este chat'",
    createButton: "Crear sala privada",
    useAccessToken: "Usar token de acceso",
    tokenPlaceholder: "Token de acceso (70 caracteres máximo)",
    tokenHintPlaceholder: "Pista opcional del token"
  },
  validation: {
    emptyCustomID: "Por favor ingrese un ID personalizado.",
    emptyToken: "Por favor ingrese un token de acceso."
  },
  error: {
    creationFailed: "Error al crear la sala. Por favor intente nuevamente.",
    roomIdExists: "Este ID de sala ya existe. Por favor elija otro.",
    invalidRoomId: "Formato de ID de sala inválido. Por favor intente otro.",
    invalidToken: "Formato de token inválido. Por favor intente otro."
  }
}; 