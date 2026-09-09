import { AppError } from '../errors'

const supportedTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
export const maxImageMegabytes = 20
const maxImageBytes = maxImageMegabytes * 1024 * 1024
const minDimension = 224

export function isHeicImage(file: Pick<Blob, 'type'> & { name?: string }) {
  return file.type === 'image/heic'
    || file.type === 'image/heif'
    || /\.(heic|heif)$/i.test(file.name ?? '')
}

export async function validateImageFile(file: Blob & { name?: string }) {
  if (!supportedTypes.has(file.type) && !isHeicImage(file)) {
    throw new AppError('IMAGE_INVALID', 'Unsupported image type')
  }

  if (file.size > maxImageBytes) {
    throw new AppError('IMAGE_TOO_LARGE', 'Image is too large')
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    const dimensions = await decodeImageDimensions(objectUrl)

    if (dimensions.width < minDimension || dimensions.height < minDimension) {
      throw new AppError('IMAGE_INVALID', 'Image dimensions are too small')
    }

    return dimensions
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function decodeImageDimensions(src: string) {
  const image = new Image()
  image.decoding = 'async'
  image.src = src

  try {
    await image.decode()
  } catch (error) {
    throw new AppError('IMAGE_DECODE_FAILED', 'Image could not be decoded', error)
  }

  if (!image.naturalWidth || !image.naturalHeight) {
    throw new AppError('IMAGE_INVALID', 'Image is empty')
  }

  return { width: image.naturalWidth, height: image.naturalHeight }
}
