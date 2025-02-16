export default {
  title: "NoTrace Chat - Créer une salle privée",
  header: 'Créer une salle privée',
  create: {
    useCustomID: "Utiliser un ID personnalisé",
    idPlaceholder: "ex, 'jane rejoins-moi dans ce chat'",
    createButton: "Créer une salle privée",
    useAccessToken: "Utiliser un jeton d'accès",
    tokenPlaceholder: "Jeton d'accès (70 caractères max)",
    tokenHintPlaceholder: "Indice facultatif du jeton"
  },
  validation: {
    emptyCustomID: "Veuillez entrer un ID personnalisé.",
    emptyToken: "Veuillez entrer un jeton d'accès."
  },
  error: {
    creationFailed: "Échec de la création de la salle. Veuillez réessayer.",
    roomIdExists: "Cet ID de salle est déjà pris. Veuillez en choisir un autre.",
    invalidRoomId: "Format d'ID de salle invalide. Veuillez en essayer un autre.",
    invalidToken: "Format de jeton invalide. Veuillez en essayer un autre."
  }
}; 