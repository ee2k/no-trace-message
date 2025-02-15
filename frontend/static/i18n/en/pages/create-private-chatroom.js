export default {
  title: "NoTrace Chat - Create a private room",
  header: 'Create a private room',
  create: {
    useCustomID: "Use custom Chatroom ID",
    idPlaceholder: "eg, 'jane join me in this chat'",
    createButton: "Create Private Chatroom",
    useAccessToken: "Use access token",
    tokenPlaceholder: "Access token (70 chars max)",
    tokenHintPlaceholder: "Optional token hint"
  },
  validation: {
    emptyCustomID: "Please enter a custom chatroom ID.",
    emptyToken: "Please enter an access token."
  },
  error: {
    creationFailed: "Failed to create chatroom. Please try again.",
    roomIdExists: "This room ID is already taken. Please choose a different one.",
    invalidRoomId: "Invalid room ID format. Please try a different one.",
    invalidToken: "Invalid token format. Please try a different one."
  }
};