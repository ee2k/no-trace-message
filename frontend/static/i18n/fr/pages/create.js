export default {
  create: {
    subtitle: 'Une plateforme <a href="{{global.opensource}}" class="hyperlink" target="_blank">open source</a> sécurisée et anonyme',
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
    tokenPlaceholder: '6~70 caractères\n\nUne phrase mémorable pourrait convenir~',
    tokenHintPlaceholder: 'Indice optionnel pour le jeton\n\nex : \'Notre café préféré\'',
    legal: 'En utilisant ce service, vous acceptez nos <a href="{{urls.tos}}" class="hyperlink" target="_blank">Conditions d\'Utilisation</a> et notre <a href="{{urls.privacy}}" class="hyperlink" target="_blank">Politique de Confidentialité</a>',
    validation: {
      emptyMessage: 'Veuillez saisir un message ou ajouter des images',
      tokenLength: 'Le mot de passe doit contenir au moins {{length}} caractères',
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
      TOO_MANY_ATTEMPTS: 'Trop de requêtes. Veuillez patienter {{minutes}} minutes',
      SERVER_ERROR: 'Erreur serveur. Veuillez réessayer plus tard',
      createFailed: 'Échec de la création du message. Veuillez réessayer',
      networkError: 'Erreur réseau. Veuillez réessayer plus tard'
    }
  },
  urls: {
    tos: '/static/i18n/fr/tos.html',
    privacy: '/static/i18n/fr/privacy.html'
  }
}