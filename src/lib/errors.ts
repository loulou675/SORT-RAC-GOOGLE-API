export type AppErrorCode =
  | 'CAMERA_EMBEDDED_BROWSER'
  | 'CAMERA_PERMISSION_DENIED'
  | 'CAMERA_NOT_AVAILABLE'
  | 'IMAGE_INVALID'
  | 'IMAGE_TOO_LARGE'
  | 'IMAGE_DECODE_FAILED'
  | 'MODEL_NOT_CONFIGURED'
  | 'MODEL_LOAD_FAILED'
  | 'INFERENCE_FAILED'
  | 'INFERENCE_TIMEOUT'
  | 'SCAN_TIMEOUT'
  | 'ITEM_NOT_RECOGNISED'
  | 'ITEM_AMBIGUOUS'
  | 'MATERIAL_NOT_RECOGNISED'
  | 'MULTIPLE_ITEMS_DETECTED'
  | 'DATABASE_UNAVAILABLE'
  | 'RULE_NOT_FOUND'
  | 'OFFLINE'

export class AppError extends Error {
  code: AppErrorCode

  constructor(code: AppErrorCode, message?: string, cause?: unknown) {
    super(message ?? code)
    this.name = 'AppError'
    this.code = code
    this.cause = cause
  }
}

export const retryMessage =
  'We could not clearly identify this item. Please photograph one item clearly and try again.'

export function messageForError(code?: AppErrorCode) {
  if (code === 'CAMERA_EMBEDDED_BROWSER') {
    return 'Camera scanning is not reliable inside Instagram or Facebook. Open this page in Safari or Chrome, or upload an image here.'
  }

  if (code === 'CAMERA_PERMISSION_DENIED') {
    return 'Camera access was blocked. You can upload an image or search manually.'
  }

  if (code === 'CAMERA_NOT_AVAILABLE') {
    return 'No camera was found on this device. You can upload an image or search manually.'
  }

  if (code === 'IMAGE_TOO_LARGE') {
    return 'This image is larger than 20 MB. Please choose a smaller JPG, PNG or WEBP image.'
  }

  if (code === 'IMAGE_INVALID' || code === 'IMAGE_DECODE_FAILED') {
    return 'This image could not be read. Please choose a JPG, PNG or WEBP image.'
  }

  if (code === 'DATABASE_UNAVAILABLE') {
    return 'Disposal guidance is temporarily unavailable. Please try manual search again.'
  }

  if (code === 'MODEL_NOT_CONFIGURED') {
    return 'Google recognition is not configured on this deployment. Add GEMINI_API_KEY in the server environment.'
  }

  if (code === 'MODEL_LOAD_FAILED') {
    return 'Google recognition could not start. Check the server API key and deployment settings.'
  }

  if (code === 'INFERENCE_FAILED') {
    return 'Google recognition could not process this image. Try a clearer photo or try again.'
  }

  if (code === 'INFERENCE_TIMEOUT') {
    return 'AI recognition took too long. Try a smaller image or reload the page.'
  }

  if (code === 'SCAN_TIMEOUT') {
    return 'We could not get a clear scan. Try brighter, even light, one visible item, and a plain background.'
  }

  if (code === 'ITEM_NOT_RECOGNISED') {
    return 'The AI ran, but this image matched Unknown. Photograph one clear item and try again.'
  }

  if (code === 'ITEM_AMBIGUOUS') {
    return 'The AI ran, but confidence was too low. Move closer to one item or use a clearer photo.'
  }

  if (code === 'MATERIAL_NOT_RECOGNISED') {
    return 'Neither the exact-item model nor the broad-material model was confident. Please identify the item below.'
  }

  if (code === 'OFFLINE') {
    return 'You appear to be offline. Local scan guidance may be limited.'
  }

  return retryMessage
}

export function messageForErrorVi(code?: AppErrorCode) {
  if (code === 'CAMERA_EMBEDDED_BROWSER') return 'Camera có thể không hoạt động ổn định trong Instagram hoặc Facebook. Hãy mở trang bằng Safari hoặc Chrome, hoặc tải ảnh lên.'
  if (code === 'CAMERA_PERMISSION_DENIED') return 'Quyền truy cập camera đã bị chặn. Bạn có thể tải ảnh lên hoặc tìm kiếm thủ công.'
  if (code === 'CAMERA_NOT_AVAILABLE') return 'Không tìm thấy camera trên thiết bị. Bạn có thể tải ảnh lên hoặc tìm kiếm thủ công.'
  if (code === 'IMAGE_TOO_LARGE') return 'Ảnh lớn hơn 20 MB. Hãy chọn ảnh JPG, PNG hoặc WEBP nhỏ hơn.'
  if (code === 'IMAGE_INVALID' || code === 'IMAGE_DECODE_FAILED') return 'Không thể đọc ảnh này. Hãy chọn ảnh JPG, PNG hoặc WEBP.'
  if (code === 'DATABASE_UNAVAILABLE') return 'Hướng dẫn phân loại đang tạm thời gián đoạn. Hãy thử tìm kiếm thủ công.'
  if (code === 'MODEL_NOT_CONFIGURED') return 'Chưa cấu hình Google recognition cho deployment này. Hãy thêm GEMINI_API_KEY ở server environment.'
  if (code === 'MODEL_LOAD_FAILED') return 'Không thể khởi động Google recognition. Hãy kiểm tra API key và cấu hình deploy.'
  if (code === 'INFERENCE_FAILED') return 'Google recognition không thể xử lý ảnh này. Hãy thử ảnh rõ hơn hoặc thử lại.'
  if (code === 'INFERENCE_TIMEOUT') return 'Nhận diện mất quá nhiều thời gian. Hãy thử ảnh nhỏ hơn hoặc tải lại trang.'
  if (code === 'SCAN_TIMEOUT') return 'Chưa có ảnh quét đủ rõ. Hãy tăng ánh sáng, chụp một vật rõ ràng và dùng nền đơn giản.'
  if (code === 'ITEM_NOT_RECOGNISED') return 'AI đã chạy nhưng ảnh được xếp vào Unknown. Hãy chụp rõ một vật và thử lại.'
  if (code === 'ITEM_AMBIGUOUS') return 'Độ tin cậy của AI còn thấp. Hãy đưa camera gần một vật hoặc dùng ảnh rõ hơn.'
  if (code === 'MATERIAL_NOT_RECOGNISED') return 'Cả mô hình vật thể và vật liệu đều chưa đủ chắc chắn. Hãy xác định vật ở phần bên dưới.'
  if (code === 'OFFLINE') return 'Thiết bị có vẻ đang ngoại tuyến. Hướng dẫn quét có thể bị giới hạn.'
  return 'Chưa thể nhận diện rõ vật này. Hãy chụp rõ một vật rồi thử lại.'
}

export function toAppError(error: unknown, fallback: AppErrorCode) {
  if (error instanceof AppError) {
    return error
  }

  return new AppError(fallback, fallback, error)
}
