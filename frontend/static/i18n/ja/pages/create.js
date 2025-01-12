export default {
  create: {
    subtitle: '安全で匿名な<a href="{{urls.opensource}}" class="hyperlink" target="_blank">オープンソース</a>プラットフォーム',
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
    legal: 'このサービスを利用することで、<a href="{{urls.tos}}" class="hyperlink" target="_blank">利用規約</a>および<a href="{{urls.privacy}}" class="hyperlink" target="_blank">プライバシーポリシー</a>に同意したものとみなされます',
    validation: {
      emptyMessage: 'メッセージを入力するか画像を追加してください',
      tokenLength: 'パスワードは{{length}}文字以上である必要があります',
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
      TOO_MANY_ATTEMPTS: 'リクエストが多すぎます。{{minutes}}分お待ちください',
      SERVER_ERROR: 'サーバーエラーが発生しました。後でもう一度お試しください',
      createFailed: 'メッセージの作成に失敗しました。もう一度お試しください',
      networkError: 'ネットワークエラーが発生しました。後でもう一度お試しください'
    }
  },
  urls: {
    tos: '/static/i18n/ja/tos.html',
    privacy: '/static/i18n/ja/privacy.html',
    opensource: 'https://github.com/ee2k/burning-message'
  }
} 