export default {
  // Page title (use data-i18n="title" in your HTML's <title> element)
  title: "NoTrace Chat - Create a private room",
  
  create: {
    // Button that toggles the custom Chatroom ID input.
    useCustomID: "Use custom Chatroom ID",
    
    // Placeholder for the custom Chatroom ID input.
    idPlaceholder: "eg, 'jane join me in this chat'",
    
    // Legal notice with placeholder URLs (to be replaced by actual values).
    legal: "By using this service, you agree to our <a href=\"{{urls.tos}}\" class=\"hyperlink\" target=\"_blank\">Terms of Service</a> and <a href=\"{{urls.privacy}}\" class=\"hyperlink\" target=\"_blank\">Privacy Policy</a>",
    
    // The text on the button to create a new private chatroom.
    createButton: "Create Private Chatroom",
    
    // Label text for the access token toggle button.
    useAccessToken: "Use access token",
    
    // Placeholder for the access token input field.
    tokenPlaceholder: "Access token (70 chars max)",
    
    // Placeholder for the token hint input field.
    tokenHintPlaceholder: "Optional token hint"
  },

  // Validation texts to be used in JavaScript.
  validation: {
    emptyCustomID: "Please enter a custom chatroom ID.",
    emptyToken: "Please enter an access token."
  },

  error: {
    creationFailed: "Failed to create chatroom. Please try again.",
    roomIdExists: "This room ID is already taken. Please choose a different one.",
    invalidRoomId: "Invalid room ID format. Please try a different one.",
    invalidToken: "Invalid token format. Please try a different one."
  },

  urls: {
    tos: "/static/i18n/en/tos.html",
    privacy: "/static/i18n/en/privacy.html"
  }
};
