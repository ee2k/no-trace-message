export default {
  create: {
    subtitle: 'Una piattaforma <a href="{{global.opensource}}" class="hyperlink" target="_blank">open source</a> sicura e anonima',
    features: {
      noHistory: 'Nessuna cronologia',
      noTracking: 'Nessun tracciamento',
      noDatabase: 'Nessun database'
    },
    messageInput: 'Scrivi il tuo messaggio qui...',
    createButton: 'Crea Messaggio Autodistruttivo',
    dropZoneText: 'Clicca o trascina un\'immagine qui',
    dropZoneHint: '1 immagine, max. 3MB',
    dropZoneFormat: '( jpg png gif webp )',
    useAccessToken: 'Usa token di accesso',
    visible: 'Visibile',
    validity: 'Validità',
    tokenPlaceholder: '6~70 caratteri\n\nUna frase memorabile potrebbe essere utile~',
    tokenHintPlaceholder: 'Suggerimento opzionale per il token\n\nes: \'Il nostro caffè preferito\'',
    legal: 'Utilizzando questo servizio, accetti i nostri <a href="{{urls.tos}}" class="hyperlink" target="_blank">Termini di Servizio</a> e la nostra <a href="{{urls.privacy}}" class="hyperlink" target="_blank">Politica sulla Privacy</a>',
    validation: {
      emptyMessage: 'Inserisci un messaggio o aggiungi immagini',
      tokenLength: 'La password deve contenere almeno {{length}} caratteri',
      maxImages: 'È consentita solo {{count}} immagine. Rimuovi prima l\'immagine esistente',
      fileType: 'Tipo di file {{type}} non supportato',
      fileSize: 'La dimensione del file supera il limite di {{size}}MB'
    },
    errors: {
      INVALID_EXPIRY: 'Tempo di scadenza selezionato non valido',
      INVALID_BURN: 'Tempo di lettura selezionato non valido',
      INVALID_FONT: 'Dimensione del carattere selezionata non valida',
      MAX_IMAGES_EXCEEDED: 'È consentita una sola immagine',
      INVALID_FILE_TYPE: 'Tipo di file non supportato',
      FILE_TOO_LARGE: 'La dimensione del file supera il limite di 3MB',
      TOO_MANY_ATTEMPTS: 'Troppe richieste. Attendi {{minutes}} minuti',
      SERVER_ERROR: 'Errore del server. Riprova più tardi',
      createFailed: 'Impossibile creare il messaggio. Riprova',
      networkError: 'Errore di rete. Riprova più tardi'
    }
  },
  urls: {
    tos: '/static/i18n/it/tos.html',
    privacy: '/static/i18n/it/privacy.html'
  }
}