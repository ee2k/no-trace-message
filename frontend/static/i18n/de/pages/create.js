export default {
  create: {
    subtitle: 'Eine sichere, anonyme <a href="{{global.opensource}}" class="hyperlink" target="_blank">Open-Source-Plattform</a>',
    features: {
      noHistory: 'Keine Historie',
      noTracking: 'Kein Tracking',
      noDatabase: 'Keine Datenbank'
    },
    messageInput: 'Nachricht hier eingeben...',
    createButton: 'Burning Message erstellen',
    dropZoneText: 'Klicken oder Bild hier ablegen',
    dropZoneHint: '1 Bild, max. 3MB',
    dropZoneFormat: '( jpg png gif webp )',
    useAccessToken: 'Zugangstoken verwenden',
    visible: 'Sichtbar',
    validity: 'Gültigkeit',
    tokenPlaceholder: '6~70 Zeichen\n\nEine einprägsame Zeile könnte gut sein~',
    tokenHintPlaceholder: 'Optionaler Token-Hinweis\n\nz.B. \'Unser Lieblingscafé\'',
    legal: 'Durch die Nutzung dieses Dienstes stimmen Sie unseren <a href="{{urls.tos}}" class="hyperlink" target="_blank">Nutzungsbedingungen</a> und der <a href="{{urls.privacy}}" class="hyperlink" target="_blank">Datenschutzerklärung</a> zu',
    validation: {
      emptyMessage: 'Bitte geben Sie eine Nachricht ein oder fügen Sie Bilder hinzu',
      tokenLength: 'Passwort muss mindestens {{length}} Zeichen lang sein',
      maxImages: 'Nur {{count}} Bild erlaubt. Bitte entfernen Sie zuerst das vorhandene Bild',
      fileType: 'Dateityp {{type}} wird nicht unterstützt',
      fileSize: 'Dateigröße überschreitet {{size}}MB Limit'
    },
    errors: {
      INVALID_EXPIRY: 'Ungültige Ablaufzeit ausgewählt',
      INVALID_BURN: 'Ungültige Lesezeit ausgewählt',
      INVALID_FONT: 'Ungültige Schriftgröße ausgewählt',
      MAX_IMAGES_EXCEEDED: 'Nur 1 Bild erlaubt',
      INVALID_FILE_TYPE: 'Dateityp wird nicht unterstützt',
      FILE_TOO_LARGE: 'Dateigröße überschreitet 3MB Limit',
      TOO_MANY_ATTEMPTS: 'Zu viele Anfragen. Bitte warten Sie einen Moment',
      SERVER_ERROR: 'Serverfehler. Bitte versuchen Sie es später erneut',
      createFailed: 'Nachricht konnte nicht erstellt werden. Bitte versuchen Sie es erneut',
      networkError: 'Netzwerkfehler. Bitte versuchen Sie es später erneut'
    }
  },
  urls: {
    tos: '/static/i18n/de/tos.html',
    privacy: '/static/i18n/de/privacy.html'
  }
} 