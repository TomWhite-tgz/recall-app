import { LinkItem } from '../types'

export function handleLinkOpen(item: LinkItem): void {
  switch (item.type) {

    case 'video': {
      let url = item.url
      if (item.timestamp) {
        url += `?t=${item.timestamp}`
      }
      window.open(url, '_blank')
      break
    }

    case 'link': {
      window.open(item.url, '_blank')
      break
    }

    case 'app_link': {
      openAppOrFallback(item.scheme, item.fallback_url)
      break
    }
  }
}

function openAppOrFallback(scheme: string, fallbackUrl: string): void {
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent)

  if (isMobile) {
    const start = Date.now()
    window.location.href = scheme

    setTimeout(() => {
      // 如果还在页面上，说明 App 没打开，走网页
      if (Date.now() - start < 3000) {
        window.open(fallbackUrl, '_blank')
      }
    }, 2500)
  } else {
    window.open(fallbackUrl, '_blank')
  }
}