import { AppError } from '../../lib/errors'
import { isHeicImage, validateImageFile } from '../../lib/validation/imageValidation'

const MAX_UPLOAD_DIMENSION = 1600

export async function fileToDataUrl(file: File) {
  const source = isHeicImage(file) ? await convertHeicToJpeg(file) : file
  const dimensions = await validateImageFile(source)
  return normalizeImageFile(source, dimensions)
}

async function convertHeicToJpeg(file: File) {
  try {
    const { default: heic2any } = await import('heic2any')
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
    return Array.isArray(converted) ? converted[0] : converted
  } catch (error) {
    throw new AppError('IMAGE_DECODE_FAILED', 'HEIC image could not be converted', error)
  }
}

async function normalizeImageFile(file: Blob, dimensions: { width: number; height: number }) {
  const objectUrl = URL.createObjectURL(file)

  try {
    const image = new Image()
    image.decoding = 'async'
    image.src = objectUrl
    await image.decode()

    const scale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(dimensions.width, dimensions.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(dimensions.width * scale))
    canvas.height = Math.max(1, Math.round(dimensions.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is unavailable')

    // Re-encoding through canvas removes EXIF/GPS and other source metadata.
    // A white background avoids turning transparent PNG pixels black.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.88)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
