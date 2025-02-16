export default {
  create: {
    title: '閲覧後消去メッセージ - 作成',
    header: '閲覧後消去メッセージ',
    subtitle: '安全で匿名なオープンソースプラットフォーム',
    features: {
      noHistory: '履歴なし',
      noTracking: 'トラッキングなし',
      noDatabase: 'データベースなし'
    },
    messageInput: 'ここにメッセージを入力してください...',
    createButton: '閲覧後消去メッセージを作成',
    dropZoneText: 'クリックまたは画像をドラッグしてアップロード',
    dropZoneHint: '画像1枚、最大3MB',
    dropZoneFormat: '( jpg png gif webp )',
    useCustomID: 'カスタムメッセージIDを使用',
    useAccessToken: 'アクセストークンを使用',
    visible: '表示',
    validity: '有効期間',
    tokenPlaceholder: '思い出に残るフレーズが良いかもしれません~',
    tokenHintPlaceholder: 'オプションのトークンヒント\n\n例：\'私たちのお気に入りのカフェ\'',
    validation: {
      emptyCustomID: 'カスタムメッセージIDを入力してください。',
      emptyMessage: 'メッセージを入力するか、画像を追加してください',
      emptyToken: 'カスタムトークンを入力してください。',
      maxImages: '画像は{{count}}枚のみ許可されています。既存の画像を削除してください。',
      fileType: '{{type}}ファイルタイプはサポートされていません',
      fileSize: 'ファイルサイズが{{size}}MB制限を超えています'
    },
    errors: {
      INVALID_EXPIRY: '選択した有効期限が無効です',
      INVALID_BURN: '選択した消去時間が無効です',
      INVALID_FONT: '選択したフォントサイズが無効です',
      MAX_IMAGES_EXCEEDED: '画像は1枚のみ許可されています',
      INVALID_FILE_TYPE: 'ファイルタイプがサポートされていません',
      FILE_TOO_LARGE: 'ファイルサイズが3MB制限を超えています',
      TOO_MANY_ATTEMPTS: 'リクエストが多すぎます。しばらくお待ちください。',
      SERVER_ERROR: 'サーバーエラーが発生しました。後でもう一度お試しください。',
      createFailed: 'メッセージの作成に失敗しました。もう一度お試しください。',
      networkError: 'ネットワークエラーが発生しました。後でもう一度お試しください。',
      MESSAGE_ID_EXISTS: 'メッセージIDが既に存在します。別のIDを選択してください。'
    }
  }
} 