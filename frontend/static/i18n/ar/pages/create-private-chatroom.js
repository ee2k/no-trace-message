export default {
  title: "NoTrace دردشة - إنشاء غرفة خاصة",
  header: 'إنشاء غرفة خاصة',
  create: {
    useCustomID: "استخدام معرف مخصص",
    idPlaceholder: "مثال: 'jane انضم إلى هذه الدردشة'",
    createButton: "إنشاء غرفة خاصة",
    useAccessToken: "استخدام رمز الوصول",
    tokenPlaceholder: "رمز الوصول (70 حرفًا كحد أقصى)",
    tokenHintPlaceholder: "تلميح اختياري للرمز"
  },
  validation: {
    emptyCustomID: "الرجاء إدخال معرف مخصص.",
    emptyToken: "الرجاء إدخال رمز الوصول."
  },
  error: {
    creationFailed: "فشل إنشاء الغرفة. الرجاء المحاولة مرة أخرى.",
    roomIdExists: "معرف الغرفة هذا موجود بالفعل. الرجاء اختيار آخر.",
    invalidRoomId: "تنسيق معرف الغرفة غير صالح. الرجاء تجربة آخر.",
    invalidToken: "تنسيق الرمز غير صالح. الرجاء تجربة آخر."
  }
}; 