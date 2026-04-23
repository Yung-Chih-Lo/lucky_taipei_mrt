import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ShareableTicket from './ShareableTicket'

const TOKEN = 'tok-abc'
const NAME = '板橋'
const PNG_URL = `/api/ticket/${encodeURIComponent(TOKEN)}`

function pngResponse() {
  const blob = new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' })
  return { ok: true, status: 200, blob: async () => blob }
}

function setMaxTouchPoints(value: number) {
  Object.defineProperty(navigator, 'maxTouchPoints', { value, configurable: true })
}

function defineNav(prop: string, value: unknown) {
  Object.defineProperty(navigator, prop, { value, configurable: true })
}

function installClipboardItem() {
  class FakeClipboardItem {
    readonly types: string[]
    readonly data: Record<string, Blob>
    constructor(data: Record<string, Blob>) {
      this.data = data
      this.types = Object.keys(data)
    }
  }
  ;(window as unknown as { ClipboardItem: typeof ClipboardItem }).ClipboardItem =
    FakeClipboardItem as unknown as typeof ClipboardItem
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(pngResponse()))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  delete (navigator as { clipboard?: unknown }).clipboard
  delete (navigator as { share?: unknown }).share
  delete (navigator as { canShare?: unknown }).canShare
  delete (window as { ClipboardItem?: unknown }).ClipboardItem
})

describe('ShareableTicket — desktop (maxTouchPoints = 0)', () => {
  it('writes exactly one image/png ClipboardItem and does not call navigator.share', async () => {
    setMaxTouchPoints(0)
    const writeMock = vi.fn().mockResolvedValue(undefined)
    defineNav('clipboard', { write: writeMock })
    installClipboardItem()
    const shareMock = vi.fn()
    defineNav('share', shareMock)

    render(<ShareableTicket token={TOKEN} stationNameZh={NAME} />)
    const btn = await screen.findByRole('button', { name: /複製籤紙圖片/ })
    await userEvent.click(btn)

    await vi.waitFor(() => expect(writeMock).toHaveBeenCalledTimes(1))
    const items = writeMock.mock.calls[0][0] as Array<{ types: string[] }>
    expect(items).toHaveLength(1)
    expect(items[0].types).toEqual(['image/png'])
    expect(shareMock).not.toHaveBeenCalled()
  })

  it('falls back to window.open when clipboard.write throws', async () => {
    setMaxTouchPoints(0)
    const writeMock = vi.fn().mockRejectedValue(new Error('denied'))
    defineNav('clipboard', { write: writeMock })
    installClipboardItem()
    const openMock = vi.fn().mockReturnValue(null)
    vi.stubGlobal('open', openMock)

    render(<ShareableTicket token={TOKEN} stationNameZh={NAME} />)
    const btn = await screen.findByRole('button', { name: /複製籤紙圖片/ })
    await userEvent.click(btn)

    await vi.waitFor(() => expect(openMock).toHaveBeenCalled())
    expect(openMock).toHaveBeenCalledWith(PNG_URL, '_blank', 'noopener,noreferrer')
  })
})

describe('ShareableTicket — mobile (maxTouchPoints > 0)', () => {
  it('calls navigator.share once with files: [File]', async () => {
    setMaxTouchPoints(1)
    const shareMock = vi.fn().mockResolvedValue(undefined)
    const canShareMock = vi.fn().mockReturnValue(true)
    defineNav('share', shareMock)
    defineNav('canShare', canShareMock)

    render(<ShareableTicket token={TOKEN} stationNameZh={NAME} />)
    const btn = await screen.findByRole('button', { name: /曬出我的籤/ })
    await userEvent.click(btn)

    await vi.waitFor(() => expect(shareMock).toHaveBeenCalledTimes(1))
    const payload = shareMock.mock.calls[0][0] as { files: File[] }
    expect(payload.files).toHaveLength(1)
    expect(payload.files[0]).toBeInstanceOf(File)
    expect(payload.files[0].type).toBe('image/png')
  })
})
