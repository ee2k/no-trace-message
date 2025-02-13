export default {
  create: {
    title: 'Burning Message - 作成',
    subtitle: '安全で匿名なオープンソースプラットフォーム',
    features: {
      noHistory: '履歴なし',
      noTracking: 'トラッキングなし',
      noDatabase: 'データベースなし'
    },
    messageInput: 'メッセージを入力してください...',
    createButton: '自動消去メッセージを作成',
    dropZoneText: '画像をクリックまたはドロップ',
    dropZoneHint: '画像1枚、最大3MB',
    dropZoneFormat: '( jpg png gif webp )',
    useAccessToken: 'アクセストークンを使用',
    visible: '表示期間',
    validity: '有効期限',
    tokenPlaceholder: '6～70文字\n\n覚えやすいフレーズがおすすめです～',
    tokenHintPlaceholder: 'トークンのヒント（任意）\n\n例：\'お気に入りのカフェ\'',
    validation: {
      emptyCustomID: 'カスタムメッセージIDを入力してください',
      emptyMessage: 'メッセージを入力するか画像を追加してください',
      emptyToken: 'カスタムトークンを入力してください',
      maxImages: '画像は{{count}}枚のみ許可されています。既存の画像を削除してください',
      fileType: 'ファイル形式{{type}}はサポートされていません',
      fileSize: 'ファイルサイズが{{size}}MBの制限を超えています'
    },
    errors: {
      INVALID_EXPIRY: '無効な有効期限が選択されました',
      INVALID_BURN: '無効な表示時間が選択されました',
      INVALID_FONT: '無効なフォントサイズが選択されました',
      MAX_IMAGES_EXCEEDED: '画像は1枚のみ許可されています',
      INVALID_FILE_TYPE: 'サポートされていないファイル形式です',
      FILE_TOO_LARGE: 'ファイルサイズが3MBの制限を超えています',
      TOO_MANY_ATTEMPTS: 'リクエストが多すぎます。しばらくお待ちください',
      SERVER_ERROR: 'サーバーエラーが発生しました。後でもう一度お試しください',
      createFailed: 'メッセージの作成に失敗しました。もう一度お試しください',
      networkError: 'ネットワークエラーが発生しました。後でもう一度お試しください',
      MESSAGE_ID_EXISTS: 'メッセージIDは既に存在します。別のものを選んでください'
    }
  }
} 