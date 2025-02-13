export default {
  create: {
    title: 'Burning Message - إنشاء',
    subtitle: 'منصة مفتوحة المصدر آمنة ومجهولة',
    features: {
      noHistory: 'لا سجل',
      noTracking: 'لا تتبع',
      noDatabase: 'لا قاعدة بيانات'
    },
    messageInput: 'اكتب رسالتك هنا...',
    createButton: 'إنشاء رسالة ذاتية التدمير',
    dropZoneText: 'انقر أو اسحب الصورة هنا',
    dropZoneHint: 'صورة واحدة، الحد الأقصى ٣ ميجابايت',
    dropZoneFormat: '( jpg png gif webp )',
    useAccessToken: 'استخدام رمز الوصول',
    visible: 'مدة العرض',
    validity: 'مدة الصلاحية',
    tokenPlaceholder: '٦~٧٠ حرف\n\nيمكن استخدام عبارة سهلة التذكر~',
    tokenHintPlaceholder: 'تلميح اختياري للرمز\n\nمثال: \'مقهانا المفضل\'',
    validation: {
      emptyCustomID: 'الرجاء إدخال معرف الرسالة المخصص',
      emptyMessage: 'الرجاء إدخال رسالة أو إضافة صور',
      emptyToken: 'الرجاء إدخال الرمز المخصص',
      maxImages: 'مسموح بصورة {{count}} فقط. الرجاء حذف الصورة الموجودة أولاً',
      fileType: 'نوع الملف {{type}} غير مدعوم',
      fileSize: 'حجم الملف يتجاوز الحد المسموح به {{size}} ميجابايت'
    },
    errors: {
      INVALID_EXPIRY: 'تم اختيار وقت انتهاء صلاحية غير صالح',
      INVALID_BURN: 'تم اختيار وقت قراءة غير صالح',
      INVALID_FONT: 'تم اختيار حجم خط غير صالح',
      MAX_IMAGES_EXCEEDED: 'مسموح بصورة واحدة فقط',
      INVALID_FILE_TYPE: 'نوع الملف غير مدعوم',
      FILE_TOO_LARGE: 'حجم الملف يتجاوز الحد المسموح به ٣ ميجابايت',
      TOO_MANY_ATTEMPTS: 'طلبات كثيرة جداً. الرجاء الانتظار قليلاً',
      SERVER_ERROR: 'خطأ في الخادم. الرجاء المحاولة لاحقاً',
      createFailed: 'فشل إنشاء الرسالة. الرجاء المحاولة مرة أخرى',
      networkError: 'خطأ في الشبكة. الرجاء المحاولة لاحقاً',
      MESSAGE_ID_EXISTS: 'معرف الرسالة موجود بالفعل، الرجاء اختيار قيمة أخرى'
    }
  }
} 