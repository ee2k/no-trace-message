export default {
  create: {
    title: 'Message auto-destructeur - Créer',
    header: 'Message à lecture unique',
    subtitle: 'Une plateforme open source sécurisée et anonyme',
    features: {
      noHistory: 'Pas d\'historique',
      noTracking: 'Pas de traçage',
      noDatabase: 'Pas de base de données'
    },
    messageInput: 'Tapez votre message ici...',
    createButton: 'Créer un message auto-destructeur',
    dropZoneText: 'Cliquez ou déposez une image ici',
    dropZoneHint: '1 image, 3MB max',
    dropZoneFormat: '( jpg png gif webp )',
    useCustomID: 'Utiliser un ID de message personnalisé',
    useAccessToken: 'Utiliser un jeton d\'accès',
    visible: 'Visible',
    validity: 'Validité',
    tokenPlaceholder: 'une phrase mémorable pourrait être bien~',
    tokenHintPlaceholder: 'Indice de jeton optionnel\n\npar ex., \'Notre café préféré\'',
    validation: {
      emptyCustomID: 'Veuillez entrer un ID de message personnalisé.',
      emptyMessage: 'Veuillez entrer un message ou ajouter des images',
      emptyToken: 'Veuillez entrer un jeton personnalisé.',
      maxImages: 'Seulement {{count}} image autorisée. Veuillez d\'abord supprimer l\'image existante.',
      fileType: 'Type de fichier {{type}} non supporté',
      fileSize: 'La taille du fichier dépasse la limite de {{size}}MB'
    },
    errors: {
      INVALID_EXPIRY: 'Durée de validité sélectionnée invalide',
      INVALID_BURN: 'Temps de destruction sélectionné invalide',
      INVALID_FONT: 'Taille de police sélectionnée invalide',
      MAX_IMAGES_EXCEEDED: 'Seulement 1 image autorisée',
      INVALID_FILE_TYPE: 'Type de fichier non supporté',
      FILE_TOO_LARGE: 'La taille du fichier dépasse la limite de 3MB',
      TOO_MANY_ATTEMPTS: 'Trop de requêtes. Veuillez patienter un moment.',
      SERVER_ERROR: 'Erreur serveur. Veuillez réessayer plus tard.',
      createFailed: 'Échec de la création du message. Veuillez réessayer.',
      networkError: 'Erreur réseau. Veuillez réessayer plus tard.',
      MESSAGE_ID_EXISTS: 'L\'ID de message existe déjà, veuillez en choisir un autre.'
    }
  }
}