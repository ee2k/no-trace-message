export default {
  // Page title (use data-i18n="title" in your HTML's <title> element)
  title: "NoTrace Chat - 创建私密房间",  
  create: {
    // Button that toggles the custom Chatroom ID input.
    useCustomID: "使用自定义房间ID",
    
    // Placeholder for the custom Chatroom ID input.
    idPlaceholder: "例如：'jane 邀我加入聊天室'",
    
    // The text on the button to create a new private chatroom.
    createButton: "创建私密房间",
    
    // Label text for the access token toggle button.
    useAccessToken: "使用访问令牌",
    
    // Placeholder for the access token input field.
    tokenPlaceholder: "访问令牌（最多70个字符）",
    
    // Placeholder for the token hint input field.
    tokenHintPlaceholder: "可选令牌提示"
  },
  // Validation texts to be used in JavaScript.
  validation: {
    emptyCustomID: "请输入自定义房间ID。",
    emptyToken: "请输入访问令牌。"
  },
  error: {
    creationFailed: "创建房间失败，请重试。",
    roomIdExists: "该房间ID已被占用，请选择其他ID。",
    invalidRoomId: "房间ID格式无效，请尝试其他格式。",
    invalidToken: "令牌格式无效，请尝试其他格式。"
  }
};
