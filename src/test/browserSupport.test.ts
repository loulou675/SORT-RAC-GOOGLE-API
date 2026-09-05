import { isEmbeddedSocialBrowser } from '../features/camera/browserSupport'

describe('embedded browser camera support', () => {
  it.each([
    'Mozilla/5.0 Instagram 371.0.0.0 Mobile',
    'Mozilla/5.0 [FBAN/FBIOS;FBAV/503.0.0.0]',
    'Mozilla/5.0 MessengerForiOS/492.0',
  ])('detects social in-app browsers', (userAgent) => {
    expect(isEmbeddedSocialBrowser(userAgent)).toBe(true)
  })

  it.each([
    'Mozilla/5.0 Version/18.0 Mobile Safari/604.1',
    'Mozilla/5.0 Chrome/137.0 Mobile Safari/537.36',
  ])('allows regular mobile browsers', (userAgent) => {
    expect(isEmbeddedSocialBrowser(userAgent)).toBe(false)
  })
})
