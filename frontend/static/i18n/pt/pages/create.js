export default {
  create: {
    title: 'Burning Message - Criar',
    subtitle: 'Uma plataforma open source segura e anônima',
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
    tokenPlaceholder: 'Uma frase memorável pode ser boa~',
    tokenHintPlaceholder: 'Dica opcional para o token\n\nex: \'Nosso café favorito\'',
    validation: {
      emptyCustomID: 'Por favor, insira um ID de mensagem personalizado',
      emptyMessage: 'Por favor, digite uma mensagem ou adicione imagens',
      emptyToken: 'Por favor, insira um token personalizado',
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
      networkError: 'Erro de rede. Por favor, tente novamente mais tarde',
      MESSAGE_ID_EXISTS: 'O ID da mensagem já existe, por favor escolha outro.'
    }
  }
} 