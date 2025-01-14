export default {
  create: {
    subtitle: 'Безопасная и анонимная <a href="{{global.opensource}}" class="hyperlink" target="_blank">open-source платформа</a>',
    features: {
      noHistory: 'Без истории',
      noTracking: 'Без отслеживания',
      noDatabase: 'Без базы данных'
    },
    messageInput: 'Введите ваше сообщение здесь...',
    createButton: 'Создать самоуничтожающееся сообщение',
    dropZoneText: 'Нажмите или перетащите изображение сюда',
    dropZoneHint: '1 изображение, макс. 3МБ',
    dropZoneFormat: '( jpg png gif webp )',
    useAccessToken: 'Использовать токен доступа',
    visible: 'Видимость',
    validity: 'Срок действия',
    tokenPlaceholder: '6~70 символов\n\nМожно использовать запоминающуюся фразу~',
    tokenHintPlaceholder: 'Необязательная подсказка для токена\n\nнапр.: \'Наше любимое кафе\'',
    legal: 'Используя этот сервис, вы соглашаетесь с нашими <a href="{{urls.tos}}" class="hyperlink" target="_blank">Условиями использования</a> и <a href="{{urls.privacy}}" class="hyperlink" target="_blank">Политикой конфиденциальности</a>',
    validation: {
      emptyMessage: 'Пожалуйста, введите сообщение или добавьте изображения',
      tokenLength: 'Пароль должен содержать не менее {{length}} символов',
      maxImages: 'Разрешено только {{count}} изображение. Пожалуйста, сначала удалите существующее',
      fileType: 'Тип файла {{type}} не поддерживается',
      fileSize: 'Размер файла превышает лимит в {{size}}МБ'
    },
    errors: {
      INVALID_EXPIRY: 'Выбрано недопустимое время истечения срока',
      INVALID_BURN: 'Выбрано недопустимое время чтения',
      INVALID_FONT: 'Выбран недопустимый размер шрифта',
      MAX_IMAGES_EXCEEDED: 'Разрешено только 1 изображение',
      INVALID_FILE_TYPE: 'Тип файла не поддерживается',
      FILE_TOO_LARGE: 'Размер файла превышает лимит в 3МБ',
      TOO_MANY_ATTEMPTS: 'Слишком много запросов. Пожалуйста, подождите немного',
      SERVER_ERROR: 'Ошибка сервера. Повторите попытку позже',
      createFailed: 'Не удалось создать сообщение. Повторите попытку',
      networkError: 'Ошибка сети. Повторите попытку позже'
    }
  },
  urls: {
    tos: '/static/i18n/ru/tos.html',
    privacy: '/static/i18n/ru/privacy.html'
  }
} 