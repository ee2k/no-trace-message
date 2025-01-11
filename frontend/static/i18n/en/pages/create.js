export default {
  create: {
    title: 'Burn after reading',
    subtitle: 'A secure, anonymous <a href="{{urls.opensource}}" class="hyperlink" target="_blank">open-source platform</a>',
    features: {
      noHistory: 'No history',
      noTracking: 'No tracking',
      noDatabase: 'No database'
    },
    messageInput: 'Type your message here...',
    createButton: 'Create Burning Message',
    dropZoneText: 'Click or drop image here to upload',
    dropZoneHint: '1 image, 3MB max',
    dropZoneFormat: '( jpg png gif webp )',
    useAccessToken: 'Use access token',
    visible: 'Visible',
    validity: 'Validity',
    tokenPlaceholder: '6~70 characters\n\na memorable line could be good~',
    tokenHintPlaceholder: 'Optional token hint\n\ne.g., \'Our favorite coffee shop\'',
    legal: 'By using this service, you agree to our <a href="{{urls.tos}}" class="hyperlink" target="_blank">Terms of Service</a> and <a href="{{urls.privacy}}" class="hyperlink" target="_blank">Privacy Policy</a>'
  },
  urls: {
    tos: '/static/i18n/en/tos.html',
    privacy: '/static/i18n/en/privacy.html',
    opensource: 'https://github.com/ee2k/burning-message'
  }
}