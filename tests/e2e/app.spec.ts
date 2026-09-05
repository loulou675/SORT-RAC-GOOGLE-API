import { expect, test, type Page } from '@playwright/test'
import { deflateSync } from 'node:zlib'

test('successful uploaded-image flow in mock mode', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('sot-rac-mock-item', 'plastic_takeaway_cup'))
  await uploadMockImage(page)

  await expect(page.getByText(/Plastic takeaway cup/i).first()).toBeVisible()
  await expect(page.getByText(/Clean Plastic/).first()).toBeVisible()
})

test('AI failure followed by retake', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('sot-rac-mock-item', 'force_error'))
  await page.goto('/')
  await setImageFile(page)

  await expect(page.getByText(/this image matched Unknown/i)).toBeVisible()
  await expect(page).toHaveURL(/\/$/)
})

test('manual search to disposal result', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel(/Search waste item/i).fill('pizza')
  await page.getByRole('button', { name: /Pizza box/i }).click()

  await expect(page).toHaveURL(/\/\?item=pizza_box&source=search$/)
  await expect(page.getByText(/Paper & Cardboard/).first()).toBeVisible()
})

test('result links to an illustrated Eco Tip guide', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel(/Search waste item/i).fill('cardboard box')
  await page.getByRole('button', { name: /Cardboard box/i }).click()

  await expect(page.getByRole('heading', { name: /Ways to recycle/i })).toBeVisible()
  await page.getByRole('link', { name: /Make a cardboard cable dock/i }).click()

  await expect(page).toHaveURL(/\/eco-tips\/cardboard_storage$/)
  await expect(page.getByRole('heading', { name: /Make a cardboard cable dock/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Step by step/i })).toBeVisible()
})

test('Eco Tips library supports search and category filters', async ({ page }) => {
  await page.goto('/#/eco-tips')
  await expect(page.getByRole('heading', { name: /Small waste/i })).toBeVisible()

  const ecoTipSearch = page.getByRole('textbox', { name: /Search Eco Tips/i })
  await ecoTipSearch.fill('gift')
  await expect(page.getByRole('link', { name: /Wrap a gift with used paper/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Make a self-watering bottle planter/i })).not.toBeVisible()

  await ecoTipSearch.fill('')
  await page.getByRole('tab', { name: /^Compost/i }).click()
  await expect(page.getByRole('link', { name: /Start a small compost mix/i })).toBeVisible()
})

test('plastic cup condition flow', async ({ page }) => {
  await page.goto('/#/search')
  await page.getByPlaceholder(/Search an item/i).fill('plastic cup')
  await page.getByRole('button', { name: /Plastic takeaway cup/i }).click()
  await page.getByRole('button', { name: /Cannot be cleaned/i }).click()

  await expect(page.getByText(/Landfill/).first()).toBeVisible()
})

test('special-handling item flow', async ({ page }) => {
  await page.goto('/#/search')
  await page.getByPlaceholder(/Search an item/i).fill('battery')
  await page.getByRole('button', { name: /^Battery/i }).click()

  await expect(page.getByText(/Battery/i).first()).toBeVisible()
  await expect(page.getByText(/Special handling required/i)).toBeVisible()
})

test('camera permission denied flow', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError')),
      },
      configurable: true,
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: /^Start Scanning/i }).dispatchEvent('click')
  await expect(page.getByText(/Camera access was blocked/i)).toBeVisible()
})

test('camera startup does not remain stuck when the browser never answers', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: () => new Promise(() => undefined),
      },
      configurable: true,
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: /^Start Scanning/i }).click()
  await expect(page.getByText(/No camera was found/i)).toBeVisible()
})

test('camera waits for a manual photo before recognition', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    sessionStorage.setItem('sot-rac-mock-item', 'plastic_takeaway_cup')

    const track = {
      applyConstraints: () => Promise.resolve(),
      getCapabilities: () => ({ focusMode: ['continuous'] }),
      stop: () => undefined,
    }
    const stream = new MediaStream()
    Object.defineProperties(stream, {
      getTracks: { value: () => [track] },
      getVideoTracks: { value: () => [track] },
    })
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: () => Promise.resolve(stream),
      },
      configurable: true,
    })
    Object.defineProperties(HTMLVideoElement.prototype, {
      readyState: { get: () => HTMLMediaElement.HAVE_ENOUGH_DATA, configurable: true },
      videoWidth: { get: () => 1280, configurable: true },
      videoHeight: { get: () => 720, configurable: true },
    })
    HTMLMediaElement.prototype.play = () => Promise.resolve()
    HTMLMediaElement.prototype.pause = () => undefined

    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: function getContext() {
        return {
          drawImage: () => undefined,
          getImageData: () => {
            const size = 64
            const data = new Uint8ClampedArray(size * size * 4)
            for (let y = 0; y < size; y += 1) {
              for (let x = 0; x < size; x += 1) {
                const index = (y * size + x) * 4
                const centered = x >= 17 && x < 47 && y >= 17 && y < 47
                const value = centered ? ((x + y) % 6 < 3 ? 55 : 95) : 205
                data[index] = value
                data[index + 1] = value
                data[index + 2] = value
                data[index + 3] = 255
              }
            }
            return { data }
          },
          scale: () => undefined,
          translate: () => undefined,
        }
      },
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: /^Start Scanning/i }).click()
  await expect(page.getByRole('button', { name: /Take photo/i })).toBeVisible()
  await expect(page.getByText(/Plastic takeaway cup/i)).not.toBeVisible()

  const shutterBox = await page.getByRole('button', { name: /Take photo/i }).boundingBox()
  expect(shutterBox).not.toBeNull()
  expect(Math.abs(shutterBox!.x + shutterBox!.width / 2 - 195)).toBeLessThan(2)

  await page.getByRole('button', { name: /Take photo/i }).click()
  await expect(page.getByText(/Plastic takeaway cup/i).first()).toBeVisible()
  await expect(page.getByText(/Clean Plastic/).first()).toBeVisible()
})

test('Instagram in-app browser is directed to a supported camera browser', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 Instagram 371.0.0.0 Mobile',
      configurable: true,
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: /^Start Scanning/i }).click()

  await expect(page.getByText(/not reliable inside Instagram or Facebook/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /Upload an Image/i })).toBeVisible()
})

test('mobile survey controls stay above the bottom navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => sessionStorage.setItem('sot-rac-mock-item', 'plastic_takeaway_cup'))
  await uploadMockImage(page)
  await expect(page.getByText(/Plastic takeaway cup/i).first()).toBeVisible()

  const dialog = page.getByRole('dialog', { name: /How was your first scan/i })
  await expect(dialog).toBeVisible()
  await dialog.evaluate((element) => element.scrollTo({ top: element.scrollHeight }))
  await expect(page.getByLabel(/Additional feedback/i)).toBeVisible()

  const submitBox = await page.getByRole('button', { name: /Send feedback/i }).boundingBox()
  const navigationBox = await page.getByLabel('Primary').boundingBox()

  expect(submitBox).not.toBeNull()
  expect(navigationBox).not.toBeNull()
  expect(submitBox!.y + submitBox!.height).toBeLessThan(navigationBox!.y)
})

test('history stores a searched item', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel(/Search waste item/i).fill('fruit peel')
  await page.getByRole('button', { name: /Fruit peel/i }).click()
  await page.getByRole('button', { name: /Scan history/i }).click()

  await expect(page).toHaveURL(/\/history$/)
  await expect(page.getByText(/Fruit peel/i).first()).toBeVisible()
  await expect(page.getByText(/Organic Waste/i).first()).toBeVisible()
})

async function uploadMockImage(page: Page) {
  await page.goto('/')
  await setImageFile(page)
}

async function setImageFile(page: Page) {
  await page.getByRole('button', { name: /Upload an Image/i }).click()
  await page.setInputFiles('input[type="file"]', {
    name: 'waste-item.png',
    mimeType: 'image/png',
    buffer: createPng(320, 320),
  })
}

function createPng(width: number, height: number) {
  const rows: Buffer[] = []

  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 4)
    row[0] = 0

    for (let x = 0; x < width; x += 1) {
      const offset = 1 + x * 4
      row[offset] = 235
      row[offset + 1] = 241
      row[offset + 2] = 230
      row[offset + 3] = 255
    }

    rows.push(row)
  }

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = pngChunk('IHDR', Buffer.concat([uint32(width), uint32(height), Buffer.from([8, 6, 0, 0, 0])]))
  const idat = pngChunk('IDAT', deflateSync(Buffer.concat(rows)))
  const iend = pngChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([header, ihdr, idat, iend])
}

function pngChunk(type: string, data: Buffer) {
  const typeBuffer = Buffer.from(type)
  return Buffer.concat([uint32(data.length), typeBuffer, data, uint32(crc32(Buffer.concat([typeBuffer, data])))])
}

function uint32(value: number) {
  const buffer = Buffer.alloc(4)
  buffer.writeUInt32BE(value >>> 0)
  return buffer
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff

  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }

  return (crc ^ 0xffffffff) >>> 0
}
