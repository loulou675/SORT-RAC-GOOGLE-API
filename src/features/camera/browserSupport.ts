export function isEmbeddedSocialBrowser(userAgent = navigator.userAgent) {
  return /Instagram|FBAN|FBAV|FB_IAB|MessengerForiOS|Line\//i.test(userAgent)
}
