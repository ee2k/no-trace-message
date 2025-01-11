export default {
  create: {
    title: '閱後即焚',
    subtitle: '一個安全、匿名的<a href="{{urls.opensource}}" class="hyperlink" target="_blank">開源平台</a>',
    features: {
      noHistory: '無歷史記錄',
      noTracking: '無跟蹤',
      noDatabase: '無數據庫'
    },
    messageInput: '在此輸入消息...',
    createButton: '創建閱後即焚消息',
    dropZoneText: '點擊或拖放圖片上傳',
    dropZoneHint: '1張圖片，3MB以內',
    dropZoneFormat: '( jpg png gif webp )',
    useAccessToken: '使用訪問令牌',
    visible: '可見',
    validity: '有效期',
    tokenPlaceholder: '輸入訪問令牌\n\n一個容易記住的句子~',
    tokenHintPlaceholder: '可選的令牌提示\n\n例如：\'我們最喜歡的咖啡店\'',
    legal: '使用本服務即表示您同意我們的<a href="{{urls.tos}}" class="hyperlink" target="_blank">服務條款</a>和<a href="{{urls.privacy}}" class="hyperlink" target="_blank">隱私政策</a>'
  },
  urls: {
    tos: '/static/i18n/zh-TW/tos.html',
    privacy: '/static/i18n/zh-TW/privacy.html',
    opensource: 'https://github.com/ee2k/burning-message'
  }
}