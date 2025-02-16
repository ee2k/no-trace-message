export default {
  title: "NoTrace Chat - Crea stanza privata",
  header: 'Crea stanza privata',
  create: {
    useCustomID: "Usa ID personalizzato",
    idPlaceholder: "es, 'jane unisciti a questa chat'",
    createButton: "Crea stanza privata",
    useAccessToken: "Usa token di accesso",
    tokenPlaceholder: "Token di accesso (massimo 70 caratteri)",
    tokenHintPlaceholder: "Suggerimento opzionale per il token"
  },
  validation: {
    emptyCustomID: "Per favore inserisci un ID personalizzato.",
    emptyToken: "Per favore inserisci un token di accesso."
  },
  error: {
    creationFailed: "Creazione della stanza fallita. Per favore riprova.",
    roomIdExists: "Questo ID stanza esiste già. Per favore scegline un altro.",
    invalidRoomId: "Formato ID stanza non valido. Per favore provane un altro.",
    invalidToken: "Formato token non valido. Per favore provane un altro."
  }
}; 