export default {
  create: {
    title: 'Burning Message - 생성',
    subtitle: '안전하고 익명의 <a href="{{global.opensource}}" class="hyperlink" target="_blank">오픈소스</a> 플랫폼',
    features: {
      noHistory: '기록 없음',
      noTracking: '추적 없음',
      noDatabase: '데이터베이스 없음'
    },
    messageInput: '메시지를 입력하세요...',
    createButton: '자동 삭제 메시지 생성',
    dropZoneText: '이미지를 클릭하거나 드롭하세요',
    dropZoneHint: '이미지 1개, 최대 3MB',
    dropZoneFormat: '( jpg png gif webp )',
    useAccessToken: '액세스 토큰 사용',
    visible: '표시 기간',
    validity: '유효 기간',
    tokenPlaceholder: '6~70자\n\n기억하기 쉬운 문구를 추천합니다~',
    tokenHintPlaceholder: '토큰 힌트 (선택사항)\n\n예: \'우리가 좋아하는 카페\'',
    legal: '이 서비스를 이용함으로써 <a href="{{urls.tos}}" class="hyperlink" target="_blank">이용약관</a>과 <a href="{{urls.privacy}}" class="hyperlink" target="_blank">개인정보 처리방침</a>에 동의하게 됩니다',
    validation: {
      emptyMessage: '메시지를 입력하거나 이미지를 추가해 주세요',
      tokenLength: '비밀번호는 {{length}}자 이상이어야 합니다',
      maxImages: '이미지는 {{count}}개만 허용됩니다. 기존 이미지를 먼저 삭제해 주세요',
      fileType: '{{type}} 파일 형식은 지원되지 않습니다',
      fileSize: '파일 크기가 {{size}}MB 제한을 초과했습니다'
    },
    errors: {
      INVALID_EXPIRY: '잘못된 만료 시간이 선택되었습니다',
      INVALID_BURN: '잘못된 읽기 시간이 선택되었습니다',
      INVALID_FONT: '잘못된 글꼴 크기가 선택되었습니다',
      MAX_IMAGES_EXCEEDED: '이미지는 1개만 허용됩니다',
      INVALID_FILE_TYPE: '지원되지 않는 파일 형식입니다',
      FILE_TOO_LARGE: '파일 크기가 3MB 제한을 초과했습니다',
      TOO_MANY_ATTEMPTS: '요청이 너무 많습니다. 잠시만 기다려 주세요',
      SERVER_ERROR: '서버 오류가 발생했습니다. 나중에 다시 시도해 주세요',
      createFailed: '메시지 생성에 실패했습니다. 다시 시도해 주세요',
      networkError: '네트워크 오류가 발생했습니다. 나중에 다시 시도해 주세요'
    }
  },
  urls: {
    tos: '/static/i18n/ko/tos.html',
    privacy: '/static/i18n/ko/privacy.html'
  }
} 