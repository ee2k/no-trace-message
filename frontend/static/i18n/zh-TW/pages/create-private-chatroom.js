export default {
  title: "NoTrace 聊天 - 建立私人房間",
  header: '建立私人房間',
  create: {
    useCustomID: "使用自訂房間ID",
    idPlaceholder: "例如：'jane 加入我的聊天'",
    createButton: "建立私人聊天室",
    useAccessToken: "使用存取權杖",
    tokenPlaceholder: "存取權杖（最多70個字元）",
    tokenHintPlaceholder: "可選的權杖提示"
  },
  validation: {
    emptyCustomID: "請輸入自訂房間ID。",
    emptyToken: "請輸入存取權杖。"
  },
  error: {
    creationFailed: "建立房間失敗，請重試。",
    roomIdExists: "該房間ID已被佔用，請選擇其他ID。",
    invalidRoomId: "無效的房間ID格式，請嘗試其他ID。",
    invalidToken: "無效的權杖格式，請嘗試其他權杖。"
  }
}; 