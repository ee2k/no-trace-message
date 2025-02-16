export default {
  title: "NoTrace Chat - Criar sala privada",
  header: 'Criar sala privada',
  create: {
    useCustomID: "Usar ID personalizado",
    idPlaceholder: "ex, 'jane entre neste chat'",
    createButton: "Criar sala privada",
    useAccessToken: "Usar token de acesso",
    tokenPlaceholder: "Token de acesso (máx. 70 caracteres)",
    tokenHintPlaceholder: "Dica opcional do token"
  },
  validation: {
    emptyCustomID: "Por favor, insira um ID personalizado.",
    emptyToken: "Por favor, insira um token de acesso."
  },
  error: {
    creationFailed: "Falha ao criar a sala. Por favor, tente novamente.",
    roomIdExists: "Este ID de sala já existe. Por favor, escolha outro.",
    invalidRoomId: "Formato de ID de sala inválido. Por favor, tente outro.",
    invalidToken: "Formato de token inválido. Por favor, tente outro."
  }
}; 