export default {
  title: "NoTrace Chat - 创建私密聊天室",
  header: '创建私密聊天室',
  create: {
    useCustomID: "使用自定义房间ID",
    idPlaceholder: "例如：'jane 邀我加入聊天室'",
    createButton: "创建私密房间",
    useAccessToken: "使用访问令牌",    
    tokenPlaceholder: "访问令牌（最多70个字符）",
    tokenHintPlaceholder: "可选令牌提示"
  },
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
