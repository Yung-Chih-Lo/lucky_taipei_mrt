'use client'

import { useEffect, useState } from 'react'
import { Button, message } from 'antd'
import { ShareAltOutlined } from '@ant-design/icons'

type Props = {
  token: string
  stationNameZh: string
}

export default function ShareableTicket({ token, stationNameZh }: Props) {
  const [isSharing, setIsSharing] = useState(false)
  const [isTouch, setIsTouch] = useState<boolean | null>(null)
  const [messageApi, contextHolder] = message.useMessage()
  const pngUrl = `/api/ticket/${encodeURIComponent(token)}`

  useEffect(() => {
    setIsTouch(typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
  }, [])

  const openFallback = (hint: string) => {
    window.open(pngUrl, '_blank', 'noopener,noreferrer')
    messageApi.info(hint)
  }

  const handleMobileShare = async () => {
    const canShareFiles =
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function'

    try {
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
      openFallback('長按圖片儲存或分享')
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError'
      if (!aborted) {
        window.open(pngUrl, '_blank', 'noopener,noreferrer')
      }
    }
  }

  const handleDesktopCopy = async () => {
    const canWriteClipboard =
      typeof navigator !== 'undefined' &&
      typeof navigator.clipboard?.write === 'function' &&
      typeof window.ClipboardItem === 'function'

    if (!canWriteClipboard) {
      openFallback('長按圖片儲存或分享')
      return
    }

    try {
      const res = await fetch(pngUrl)
      if (!res.ok) throw new Error(`ticket fetch failed: ${res.status}`)
      const blob = await res.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      messageApi.success('已複製籤紙圖片，貼到 Line / Instagram 即可分享')
    } catch {
      openFallback('長按圖片儲存或分享')
    }
  }

  const handleClick = async () => {
    setIsSharing(true)
    try {
      if (isTouch === false) {
        await handleDesktopCopy()
      } else {
        await handleMobileShare()
      }
    } finally {
      setIsSharing(false)
    }
  }

  const buttonLabel = isTouch === false ? '複製籤紙圖片' : '曬出我的籤'

  return (
    <>
      {contextHolder}
      <Button
        size="large"
        block
        icon={<ShareAltOutlined />}
        loading={isSharing}
        onClick={handleClick}
      >
        {buttonLabel}
      </Button>
    </>
  )
}
