export default {
  create: {
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
    tokenPlaceholder: '输入访问令牌\n\n可以是你们共同知道的信息~',
    tokenHintPlaceholder: '可选的令牌提示\n\n例如：\'我们最喜欢的咖啡店\'',
    legal: '使用本服务即表示您同意我们的<a href="{{tosUrl}}" class="hyperlink" target="_blank">服务条款</a>和<a href="{{privacyUrl}}" class="hyperlink" target="_blank">隐私政策</a>',
    validation: {
      emptyMessage: '请输入消息或添加图片',
      tokenLength: '密码长度至少需要 {{length}} 个字符',
      maxImages: '只能上传 {{count}} 张图片，请先删除现有图片',
      fileType: '不支持的文件类型 {{type}}',
      fileSize: '文件大小超过 {{size}}MB 限制'
    },
    errors: {
      createFailed: '创建消息失败，请重试',
      tooManyRequests: '请求过于频繁，请稍后再试',
      networkError: '网络错误，请稍后重试'
    }
  },
  urls: {
    tos: '/static/i18n/zh-CN/tos.html',
    privacy: '/static/i18n/zh-CN/privacy.html',
    opensource: 'https://github.com/ee2k/burning-message'
  }
}