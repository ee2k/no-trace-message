export default {
  title: "NoTrace Chat - Privaten Raum erstellen",
  header: 'Privaten Raum erstellen',
  create: {
    useCustomID: "Benutzerdefinierte ID verwenden",
    idPlaceholder: "z.B. 'jane komm in diesen Chat'",
    createButton: "Privaten Raum erstellen",
    useAccessToken: "Zugriffstoken verwenden",
    tokenPlaceholder: "Zugriffstoken (max. 70 Zeichen)",
    tokenHintPlaceholder: "Optionale Token-Hinweis"
  },
  validation: {
    emptyCustomID: "Bitte geben Sie eine benutzerdefinierte ID ein.",
    emptyToken: "Bitte geben Sie einen Zugriffstoken ein."
  },
  error: {
    creationFailed: "Erstellung des Raums fehlgeschlagen. Bitte versuchen Sie es erneut.",
    roomIdExists: "Diese Raum-ID existiert bereits. Bitte wählen Sie eine andere.",
    invalidRoomId: "Ungültiges Raum-ID-Format. Bitte versuchen Sie ein anderes.",
    invalidToken: "Ungültiges Token-Format. Bitte versuchen Sie ein anderes."
  }
}; 