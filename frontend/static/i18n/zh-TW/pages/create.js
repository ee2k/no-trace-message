export default {
  create: {
    title: 'Burning Message - 建立',
    subtitle: '一個安全、匿名的<a href="{{global.opensource}}" class="hyperlink" target="_blank">開源平台</a>',
    features: {
      noHistory: '無歷史記錄',
      noTracking: '無追蹤',
      noDatabase: '無資料庫'
    },
    messageInput: '在此輸入訊息...',
    createButton: '建立閱後即焚訊息',
    dropZoneText: '點擊或拖放圖片上傳',
    dropZoneHint: '1張圖片，3MB以內',
    dropZoneFormat: '( jpg png gif webp )',
    useAccessToken: '使用存取權杖',
    visible: '可見',
    validity: '有效期',
    tokenPlaceholder: '6~70個字元\n\n可以是你們共同知道的資訊~',
    tokenHintPlaceholder: '可選的權杖提示\n\n例如：\'我們最喜歡的咖啡店\'',
    legal: '使用本服務即表示您同意我們的<a href="{{urls.tos}}" class="hyperlink" target="_blank">服務條款</a>和<a href="{{urls.privacy}}" class="hyperlink" target="_blank">隱私權政策</a>',
    validation: {
      emptyMessage: '請輸入訊息或新增圖片',
      tokenLength: '密碼長度至少需要 {{length}} 個字元',
      maxImages: '只能上傳 {{count}} 張圖片，請先刪除現有圖片',
      fileType: '不支援的檔案類型 {{type}}',
      fileSize: '檔案大小超過 {{size}}MB 限制'
    },
    errors: {
      INVALID_EXPIRY: '選擇的有效期無效',
      INVALID_BURN: '選擇的閱讀時間無效',
      INVALID_FONT: '選擇的字型大小無效',
      MAX_IMAGES_EXCEEDED: '只能上傳1張圖片',
      INVALID_FILE_TYPE: '不支援的檔案類型',
      FILE_TOO_LARGE: '檔案大小超過3MB限制',
      TOO_MANY_ATTEMPTS: '請求過於頻繁，請稍等片刻',
      SERVER_ERROR: '伺服器錯誤，請稍後重試',
      createFailed: '建立訊息失敗，請重試',
      networkError: '網路錯誤，請稍後重試'
    }
  },
  urls: {
    tos: '/static/i18n/zh-TW/tos.html',
    privacy: '/static/i18n/zh-TW/privacy.html'
  }
}