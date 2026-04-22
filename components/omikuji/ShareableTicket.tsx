'use client'

import { useState } from 'react'
import { Button, message } from 'antd'
import { ShareAltOutlined } from '@ant-design/icons'

type Props = {
  token: string
  stationNameZh: string
}

export default function ShareableTicket({ token, stationNameZh }: Props) {
  const [isSharing, setIsSharing] = useState(false)
  const pngUrl = `/api/ticket/${encodeURIComponent(token)}`

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const canShareFiles =
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function'

      if (canShareFiles) {
        const res = await fetch(pngUrl)
        if (res.ok) {
          const blob = await res.blob()
          const file = new File([blob], `${stationNameZh}-坐火行.png`, {
            type: 'image/png',
          })
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `${stationNameZh} · 坐火行 · 此站有緣`,
              text: `我把今天的決定權交給了捷運。它叫我去「${stationNameZh}」，我就去了。你敢嗎？`,
            })
            return
          }
        }
      }

      // Fallback: open the PNG in a new tab for manual save.
      window.open(pngUrl, '_blank', 'noopener,noreferrer')
      message.info('長按圖片儲存或分享')
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError'
      if (!aborted) {
        window.open(pngUrl, '_blank', 'noopener,noreferrer')
      }
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Button
      size="large"
      block
      icon={<ShareAltOutlined />}
      loading={isSharing}
      onClick={handleShare}
    >
      曬出我的籤
    </Button>
  )
}
