export default {
  create: {
    title: 'Burning Message - Create',
    header: 'Burn after reading Message',
    messageInput: 'Type your message here...',
    createButton: 'Create Burning Message',
    dropZoneText: 'Click or drop image here to upload',
    dropZoneHint: '1 image, 3MB max',
    dropZoneFormat: '( jpg png gif webp )',
    useCustomID: 'Use custom Message ID',
    useAccessToken: 'Use access token',
    visible: 'Visible',
    validity: 'Validity',
    tokenPlaceholder: 'a memorable line could be good~',
    tokenHintPlaceholder: 'Optional token hint\n\ne.g., \'Our favorite coffee shop\'',
    validation: {
      emptyCustomID: 'Please enter a custom message ID.',
      emptyMessage: 'Please enter a message or add images',
      emptyToken: 'Please enter a custom token.',
      maxImages: 'Only {{count}} image allowed. Please remove the existing image first.',
      fileType: 'File type {{type}} not supported',
      fileSize: 'File size exceeds {{size}}MB limit'
    },
    errors: {
      INVALID_EXPIRY: 'Invalid expiry time selected',
      INVALID_BURN: 'Invalid burn time selected',
      INVALID_FONT: 'Invalid font size selected',
      MAX_IMAGES_EXCEEDED: 'Only 1 image allowed',
      INVALID_FILE_TYPE: 'File type not supported',
      FILE_TOO_LARGE: 'File size exceeds 3MB limit',
      TOO_MANY_ATTEMPTS: 'Too many requests. Please wait a while.',
      SERVER_ERROR: 'Server error. Please try again later.',
      createFailed: 'Failed to create message. Please try again.',
      networkError: 'Network error. Please try again later.',
      MESSAGE_ID_EXISTS: 'Message ID exists, please choose another one.'
    }
  }
}