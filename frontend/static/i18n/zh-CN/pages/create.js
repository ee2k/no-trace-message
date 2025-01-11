export default {
  create: {
    title: '阅后即焚',
    subtitle: '一个安全、匿名的<a href="{{urls.opensource}}" class="hyperlink" target="_blank">开源平台</a>',
    features: {
      noHistory: '无历史记录',
      noTracking: '无跟踪',
      noDatabase: '无数据库'
    },
    messageInput: '在此输入消息...',
    createButton: '创建阅后即焚消息',
    dropZoneText: '点击或拖放图片上传',
    dropZoneHint: '1张图片，3MB以内',
    dropZoneFormat: '( jpg png gif webp )',
    useAccessToken: '使用访问令牌',
    visible: '可见',
    validity: '有效期',
    tokenPlaceholder: '输入访问令牌\n\n一个容易记住的句子~',
    tokenHintPlaceholder: '可选的令牌提示\n\n例如：\'我们最喜欢的咖啡店\'',
    legal: '使用本服务即表示您同意我们的<a href="{{tosUrl}}" class="hyperlink" target="_blank">服务条款</a>和<a href="{{privacyUrl}}" class="hyperlink" target="_blank">隐私政策</a>'
  },
  urls: {
    tos: '/static/i18n/zh-CN/tos.html',
    privacy: '/static/i18n/zh-CN/privacy.html',
    opensource: 'https://github.com/ee2k/burning-message'
  }
}