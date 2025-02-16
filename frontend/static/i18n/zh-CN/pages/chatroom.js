export default {
  chatroom: {
    title: "NoTrace Chat - 私密房间",
    homepage: "首页",
    status: {
      connected: "已连接",
      roomNotFound: "未找到房间",
      connecting: "连接中...",
      reconnecting: "重新连接中...",
      disconnected: "已断开连接"
    },
    menu: {
      clearMessages: "清除消息",
      leaveRoom: "离开房间",
      deleteRoom: "删除房间"
    },
    message: {
      typePlaceholder: "输入消息...",
      failedToSend: "发送消息失败，请重试。",
      invalidImage: "无效的图片文件",
      imageTooLarge: "图片太大（最大 {maxSize}MB）",
      messageFailed: "消息发送失败，点击重试按钮重试。",
      clearedBy: "{username} 清除了消息",
      roomDeleted: "此房间已被 {username} 删除",
      disconnected: "已断开聊天连接",
      tryRefreshing: "尝试刷新或重新加入聊天室",
      connectionLost: "连接丢失",
      invalidFormat: "无效的消息格式",
      policyViolation: "由于违反政策而断开连接",
      serverError: "服务器错误 - 请稍后重试",
      inactiveDisconnect: "由于不活动而断开连接",
      invalidToken: "无效或缺少访问令牌",
      unexpectedError: "发生意外错误",
      genericError: "发生错误",
      joinFailed: "{username} 的加入尝试未成功"
    },
    alert: {
      sessionNotFound: "未找到会话，请加入一个房间。",
      tokenRequired: "此私密房间需要令牌。"
    },
    confirmation: {
      deleteRoom: "确定要删除此房间吗？此操作无法撤销。",
      leaveRoom: "确定要离开房间吗？"
    }
  }
};
