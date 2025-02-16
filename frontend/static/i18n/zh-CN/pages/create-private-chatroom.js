export default {
  title: "NoTrace 聊天 - 创建私人房间",
  header: '创建私人房间',
  create: {
    useCustomID: "使用自定义房间ID",
    idPlaceholder: "例如：'jane 加入我的聊天'",
    createButton: "创建私人聊天室",
    useAccessToken: "使用访问令牌",
    tokenPlaceholder: "访问令牌（最多70个字符）",
    tokenHintPlaceholder: "可选的令牌提示"
  },
  validation: {
    emptyCustomID: "请输入自定义房间ID。",
    emptyToken: "请输入访问令牌。"
  },
  error: {
    creationFailed: "创建房间失败，请重试。",
    roomIdExists: "该房间ID已被占用，请选择其他ID。",
    invalidRoomId: "无效的房间ID格式，请尝试其他ID。",
    invalidToken: "无效的令牌格式，请尝试其他令牌。"
  }
};
