const DARK_LUMINANCE = 52
const GLARE_LUMINANCE = 222
const MIN_CONTRAST = 16
const MIN_SHARPNESS = 3.5

export function measureFrameQuality(sample: Uint8ClampedArray, width: number) {
  const luminance = averageLuminance(sample)
  if (luminance < DARK_LUMINANCE) return { good: false, message: 'Too dark. Move to brighter, even light.' }
  if (luminance > GLARE_LUMINANCE) return { good: false, message: 'Too much glare. Tilt the item or soften the light.' }

  const height = sample.length / 4 / width
  const luminances: number[] = []

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const red = sample[index]
      const green = sample[index + 1]
      const blue = sample[index + 2]
      luminances.push(red * 0.2126 + green * 0.7152 + blue * 0.0722)
    }
  }

  const mean = luminances.reduce((total, value) => total + value, 0) / luminances.length
  const contrast = Math.sqrt(
    luminances.reduce((total, value) => total + (value - mean) ** 2, 0) / luminances.length,
  )
  let sharpness = 0
  let sharpnessComparisons = 0

  for (let y = 1; y < height; y += 1) {
    for (let x = 1; x < width; x += 1) {
      const luminanceIndex = y * width + x
      sharpness += Math.abs(luminances[luminanceIndex] - luminances[luminanceIndex - 1])
      sharpness += Math.abs(luminances[luminanceIndex] - luminances[luminanceIndex - width])
      sharpnessComparisons += 2
    }
  }

  const averageSharpness = sharpness / sharpnessComparisons
  if (contrast < MIN_CONTRAST) {
    return { good: false, message: 'The photo does not show enough visual detail yet.' }
  }
  if (averageSharpness < MIN_SHARPNESS) {
    return { good: false, message: 'Hold steady and let the camera focus.' }
  }

  return { good: true, message: 'Frame quality is good.' }
}

function averageLuminance(sample: Uint8ClampedArray) {
  let luminance = 0

  for (let index = 0; index < sample.length; index += 4) {
    luminance += sample[index] * 0.2126
    luminance += sample[index + 1] * 0.7152
    luminance += sample[index + 2] * 0.0722
  }

  return luminance / (sample.length / 4)
}
