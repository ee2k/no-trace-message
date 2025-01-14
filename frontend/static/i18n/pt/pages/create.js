export default {
  create: {
    subtitle: 'Uma plataforma <a href="{{global.opensource}}" class="hyperlink" target="_blank">open source</a> segura e anônima',
    features: {
      noHistory: 'Sem histórico',
      noTracking: 'Sem rastreamento',
      noDatabase: 'Sem banco de dados'
    },
    messageInput: 'Digite sua mensagem aqui...',
    createButton: 'Criar Mensagem Autodestrutiva',
    dropZoneText: 'Clique ou arraste uma imagem aqui',
    dropZoneHint: '1 imagem, máx. 3MB',
    dropZoneFormat: '( jpg png gif webp )',
    useAccessToken: 'Usar token de acesso',
    visible: 'Visível',
    validity: 'Validade',
    tokenPlaceholder: '6~70 caracteres\n\nUma frase memorável pode ser boa~',
    tokenHintPlaceholder: 'Dica opcional para o token\n\nex: \'Nosso café favorito\'',
    legal: 'Ao usar este serviço, você concorda com nossos <a href="{{urls.tos}}" class="hyperlink" target="_blank">Termos de Serviço</a> e <a href="{{urls.privacy}}" class="hyperlink" target="_blank">Política de Privacidade</a>',
    validation: {
      emptyMessage: 'Por favor, digite uma mensagem ou adicione imagens',
      tokenLength: 'A senha deve ter pelo menos {{length}} caracteres',
      maxImages: 'Apenas {{count}} imagem permitida. Por favor, remova a imagem existente primeiro',
      fileType: 'Tipo de arquivo {{type}} não suportado',
      fileSize: 'O tamanho do arquivo excede o limite de {{size}}MB'
    },
    errors: {
      INVALID_EXPIRY: 'Tempo de expiração selecionado inválido',
      INVALID_BURN: 'Tempo de leitura selecionado inválido',
      INVALID_FONT: 'Tamanho de fonte selecionado inválido',
      MAX_IMAGES_EXCEEDED: 'Apenas 1 imagem permitida',
      INVALID_FILE_TYPE: 'Tipo de arquivo não suportado',
      FILE_TOO_LARGE: 'O tamanho do arquivo excede o limite de 3MB',
      TOO_MANY_ATTEMPTS: 'Muitas solicitações. Por favor, aguarde um momento',
      SERVER_ERROR: 'Erro no servidor. Por favor, tente novamente mais tarde',
      createFailed: 'Falha ao criar mensagem. Por favor, tente novamente',
      networkError: 'Erro de rede. Por favor, tente novamente mais tarde'
    }
  },
  urls: {
    tos: '/static/i18n/pt/tos.html',
    privacy: '/static/i18n/pt/privacy.html'
  }
} 