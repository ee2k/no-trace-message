export default {
  title: "NoTrace チャット - プライベートルームを作成",
  header: 'プライベートルームを作成',
  create: {
    useCustomID: "カスタムIDを使用",
    idPlaceholder: "例：'jane このチャットに参加'",
    createButton: "プライベートルームを作成",
    useAccessToken: "アクセストークンを使用",
    tokenPlaceholder: "アクセストークン（最大70文字）",
    tokenHintPlaceholder: "オプションのトークンヒント"
  },
  validation: {
    emptyCustomID: "カスタムIDを入力してください。",
    emptyToken: "アクセストークンを入力してください。"
  },
  error: {
    creationFailed: "ルームの作成に失敗しました。もう一度お試しください。",
    roomIdExists: "このルームIDは既に存在します。別のIDを選択してください。",
    invalidRoomId: "無効なルームID形式です。別のIDをお試しください。",
    invalidToken: "無効なトークン形式です。別のトークンをお試しください。"
  }
}; 