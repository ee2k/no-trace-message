export default {
  create: {
    title: 'Burning Message - Créer',
    subtitle: 'Une plateforme open source sécurisée et anonyme',
    features: {
      noHistory: 'Pas d\'historique',
      noTracking: 'Pas de traçage',
      noDatabase: 'Pas de base de données'
    },
    messageInput: 'Écrivez votre message ici...',
    createButton: 'Créer un Message Éphémère',
    dropZoneText: 'Cliquez ou déposez une image ici',
    dropZoneHint: '1 image, max. 3 Mo',
    dropZoneFormat: '( jpg png gif webp )',
    useAccessToken: 'Utiliser un jeton d\'accès',
    visible: 'Visible',
    validity: 'Validité',
    tokenPlaceholder: 'Une phrase mémorable pourrait convenir~',
    tokenHintPlaceholder: 'Indice optionnel pour le jeton\n\nex : \'Notre café préféré\'',
    validation: {
      emptyCustomID: 'Veuillez saisir un identifiant de message personnalisé',
      emptyMessage: 'Veuillez saisir un message ou ajouter des images',
      emptyToken: 'Veuillez saisir un jeton personnalisé',
      maxImages: 'Une seule image autorisée. Veuillez d\'abord supprimer l\'image existante',
      fileType: 'Type de fichier {{type}} non pris en charge',
      fileSize: 'La taille du fichier dépasse la limite de {{size}} Mo'
    },
    errors: {
      INVALID_EXPIRY: 'Durée d\'expiration sélectionnée non valide',
      INVALID_BURN: 'Temps de lecture sélectionné non valide',
      INVALID_FONT: 'Taille de police sélectionnée non valide',
      MAX_IMAGES_EXCEEDED: 'Une seule image autorisée',
      INVALID_FILE_TYPE: 'Type de fichier non pris en charge',
      FILE_TOO_LARGE: 'La taille du fichier dépasse la limite de 3 Mo',
      TOO_MANY_ATTEMPTS: 'Trop de requêtes. Veuillez patienter un moment',
      SERVER_ERROR: 'Erreur serveur. Veuillez réessayer plus tard',
      createFailed: 'Échec de la création du message. Veuillez réessayer',
      networkError: 'Erreur réseau. Veuillez réessayer plus tard',
      MESSAGE_ID_EXISTS: 'L\'identifiant du message existe déjà, veuillez en choisir un autre.'
    }
  }
}