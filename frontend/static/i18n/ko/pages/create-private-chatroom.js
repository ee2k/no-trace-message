export default {
  title: "NoTrace 채팅 - 비공개 방 만들기",
  header: '비공개 방 만들기',
  create: {
    useCustomID: "사용자 정의 ID 사용",
    idPlaceholder: "예: 'jane 이 채팅에 참여'",
    createButton: "비공개 방 만들기",
    useAccessToken: "액세스 토큰 사용",
    tokenPlaceholder: "액세스 토큰 (최대 70자)",
    tokenHintPlaceholder: "선택적 토큰 힌트"
  },
  validation: {
    emptyCustomID: "사용자 정의 ID를 입력해 주세요.",
    emptyToken: "액세스 토큰을 입력해 주세요."
  },
  error: {
    creationFailed: "방 생성에 실패했습니다. 다시 시도해 주세요.",
    roomIdExists: "이 방 ID는 이미 존재합니다. 다른 ID를 선택해 주세요.",
    invalidRoomId: "잘못된 방 ID 형식입니다. 다른 ID를 시도해 주세요.",
    invalidToken: "잘못된 토큰 형식입니다. 다른 토큰을 시도해 주세요."
  }
}; 