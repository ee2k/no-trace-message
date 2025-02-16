export default {
  chatroom: {
    title: "NoTrace Chat - プライベートルーム",
    homepage: "ホームページ",
    status: {
      connected: "接続済み",
      roomNotFound: "ルームが見つかりません",
      connecting: "接続中...",
      reconnecting: "再接続中...",
      disconnected: "切断されました"
    },
    menu: {
      clearMessages: "メッセージをクリア",
      leaveRoom: "ルームを退出",
      deleteRoom: "ルームを削除"
    },
    message: {
      typePlaceholder: "メッセージを入力...",
      failedToSend: "メッセージの送信に失敗しました。もう一度お試しください。",
      invalidImage: "無効な画像ファイル",
      imageTooLarge: "画像が大きすぎます（最大 {maxSize}MB）",
      messageFailed: "メッセージの送信に失敗しました。再試行ボタンをクリックしてください。",
      clearedBy: "{username} がメッセージをクリアしました",
      roomDeleted: "このルームは {username} によって削除されました",
      disconnected: "チャットから切断されました",
      tryRefreshing: "更新するか、再度チャットルームに参加してください",
      connectionLost: "接続が失われました",
      invalidFormat: "無効なメッセージ形式",
      policyViolation: "ポリシー違反により切断されました",
      serverError: "サーバーエラー - 後でもう一度お試しください",
      inactiveDisconnect: "非アクティブにより切断されました",
      invalidToken: "無効または欠落しているアクセストークン",
      unexpectedError: "予期しないエラーが発生しました",
      genericError: "エラーが発生しました",
      joinFailed: "{username} の参加試行が失敗しました"
    },
    alert: {
      sessionNotFound: "セッションが見つかりません。ルームに参加してください。",
      tokenRequired: "このプライベートルームにはトークンが必要です。"
    },
    confirmation: {
      deleteRoom: "このルームを削除してもよろしいですか？この操作は元に戻せません。",
      leaveRoom: "ルームを退出してもよろしいですか？"
    }
  }
}; 