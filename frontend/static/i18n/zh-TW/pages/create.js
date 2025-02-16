export default {
  create: {
    title: '閱後即焚訊息 - 建立',
    header: '閱後即焚訊息',
    subtitle: '一個安全、匿名的開源平台',
    features: {
      noHistory: '無歷史記錄',
      noTracking: '無追蹤',
      noDatabase: '無資料庫'
    },
    messageInput: '在此輸入您的訊息...',
    createButton: '建立閱後即焚訊息',
    dropZoneText: '點擊或拖曳圖片至此上傳',
    dropZoneHint: '1 張圖片，最大 3MB',
    dropZoneFormat: '( jpg png gif webp )',
    useCustomID: '使用自訂訊息 ID',
    useAccessToken: '使用存取權杖',
    visible: '可見',
    validity: '有效期',
    tokenPlaceholder: '一個難忘的句子可能不錯~',
    tokenHintPlaceholder: '可選的權杖提示\n\n例如：\'我們最愛的咖啡店\'',
    validation: {
      emptyCustomID: '請輸入自訂訊息 ID。',
      emptyMessage: '請輸入訊息或添加圖片',
      emptyToken: '請輸入自訂權杖。',
      maxImages: '僅允許 {{count}} 張圖片。請先移除現有圖片。',
      fileType: '不支援的檔案類型 {{type}}',
      fileSize: '檔案大小超過 {{size}}MB 限制'
    },
    errors: {
      INVALID_EXPIRY: '選擇的到期時間無效',
      INVALID_BURN: '選擇的銷毀時間無效',
      INVALID_FONT: '選擇的字型大小無效',
      MAX_IMAGES_EXCEEDED: '僅允許 1 張圖片',
      INVALID_FILE_TYPE: '不支援的檔案類型',
      FILE_TOO_LARGE: '檔案大小超過 3MB 限制',
      TOO_MANY_ATTEMPTS: '請求過多。請稍後再試。',
      SERVER_ERROR: '伺服器錯誤。請稍後再試。',
      createFailed: '建立訊息失敗。請稍後再試。',
      networkError: '網路錯誤。請稍後再試。',
      MESSAGE_ID_EXISTS: '訊息 ID 已存在，請選擇其他 ID。'
    }
  }
}