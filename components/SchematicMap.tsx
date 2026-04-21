'use client'

import { useEffect, useRef, useState } from 'react'
import type {
  CanvasView,
  ConnectionPathPoint,
  ConnectionView,
  LabelAnchor,
  LineView,
  StationView,
} from './types'

const DIM_OPACITY = 0.15
const ACTIVE_OPACITY = 1
const DEFAULT_OPACITY = 0.85
const DEFAULT_CONNECTION_OPACITY = 0.7

const ANIMATION_STEP_MS = 180
const ANIMATION_SETTLE_MS = 600

// click vs drag thresholds (in screen pixels / ms)
const CLICK_MOVEMENT_PX = 4
const CLICK_MAX_MS = 250

export type StationPositionChange = {
  schematicX: number
  schematicY: number
  labelX: number
  labelY: number
}

export type SchematicMapProps = {
  stations: StationView[]
  connections: ConnectionView[]
  lines: LineView[]
  canvas: CanvasView
  selectedLineCodes?: string[]
  animationStations?: StationView[]
  isAnimating?: boolean
  onAnimationEnd?: () => void
  // Admin hooks
  adminMode?: boolean
  onStationPositionChange?: (id: number, next: StationPositionChange) => void
  onLabelPositionChange?: (id: number, labelX: number, labelY: number) => void
  onStationClick?: (id: number) => void
  onLabelClick?: (id: number, svgX: number, svgY: number) => void
  onBackgroundClick?: (svgX: number, svgY: number) => void
}

type DragState =
  | { kind: 'station'; id: number; startSvgX: number; startSvgY: number; startClientX: number; startClientY: number; startedAt: number; moved: boolean }
  | { kind: 'label'; id: number; startSvgX: number; startSvgY: number; startClientX: number; startClientY: number; startedAt: number; moved: boolean }
  | { kind: 'background'; startClientX: number; startClientY: number; startedAt: number; moved: boolean; startSvgX: number; startSvgY: number }

function pathPointsToD(points: ConnectionPathPoint[]): string {
  return points
    .map((p) => `${p.command} ${p.coordinates.join(' ')}`)
    .join(' ')
}

function screenToSvg(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: 0, y: 0 }
  const p = pt.matrixTransform(ctm.inverse())
  return { x: p.x, y: p.y }
}

export default function SchematicMap({
  stations,
  connections,
  lines,
  canvas,
  selectedLineCodes,
  animationStations,
  isAnimating = false,
  onAnimationEnd,
  adminMode = false,
  onStationPositionChange,
  onLabelPositionChange,
  onStationClick,
  onLabelClick,
  onBackgroundClick,
}: SchematicMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  // Visual offset (SVG units) applied to the dragged element during an active drag.
  const [liveOffset, setLiveOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 })

  const lineColor = (code: string) => lines.find((l) => l.code === code)?.color ?? '#999'
  const stationById = new Map(stations.map((s) => [s.id, s]))
  const hasFilter = (selectedLineCodes?.length ?? 0) > 0
  const isLineActive = (code: string) => !hasFilter || selectedLineCodes!.includes(code)
  const isStationActive = (s: StationView) =>
    !hasFilter || s.lineCodes.some((c) => selectedLineCodes!.includes(c))

  // Effective rendered positions (apply live drag offset)
  const stationDisplay = (s: StationView) => {
    if (drag?.kind === 'station' && drag.id === s.id) {
      return { x: s.schematicX + liveOffset.dx, y: s.schematicY + liveOffset.dy }
    }
    return { x: s.schematicX, y: s.schematicY }
  }
  const labelDisplay = (s: StationView) => {
    if (drag?.kind === 'station' && drag.id === s.id) {
      // Label moves with the station
      return { x: s.labelX + liveOffset.dx, y: s.labelY + liveOffset.dy }
    }
    if (drag?.kind === 'label' && drag.id === s.id) {
      return { x: s.labelX + liveOffset.dx, y: s.labelY + liveOffset.dy }
    }
    return { x: s.labelX, y: s.labelY }
  }

  // Global pointer move/up handlers while dragging
  useEffect(() => {
    if (!drag) return

    function handleMove(e: PointerEvent) {
      if (!svgRef.current) return
      const movedPx = Math.hypot(e.clientX - drag!.startClientX, e.clientY - drag!.startClientY)
      const nowSvg = screenToSvg(svgRef.current, e.clientX, e.clientY)
      const dx = nowSvg.x - drag!.startSvgX
      const dy = nowSvg.y - drag!.startSvgY
      setLiveOffset({ dx, dy })
      if (movedPx > CLICK_MOVEMENT_PX && !drag!.moved) {
        setDrag({ ...drag!, moved: true })
      }
    }

    function handleUp(e: PointerEvent) {
      if (!svgRef.current) {
        setDrag(null)
        setLiveOffset({ dx: 0, dy: 0 })
        return
      }
      const elapsed = Date.now() - drag!.startedAt
      const movedPx = Math.hypot(e.clientX - drag!.startClientX, e.clientY - drag!.startClientY)
      const endSvg = screenToSvg(svgRef.current, e.clientX, e.clientY)
      const dx = endSvg.x - drag!.startSvgX
      const dy = endSvg.y - drag!.startSvgY

      const isClick = movedPx < CLICK_MOVEMENT_PX && elapsed < CLICK_MAX_MS

      if (drag!.kind === 'station') {
        const s = stationById.get(drag!.id)
        if (isClick) {
          onStationClick?.(drag!.id)
        } else if (s && onStationPositionChange) {
          onStationPositionChange(drag!.id, {
            schematicX: s.schematicX + dx,
            schematicY: s.schematicY + dy,
            labelX: s.labelX + dx,
            labelY: s.labelY + dy,
          })
        }
      } else if (drag!.kind === 'label') {
        const s = stationById.get(drag!.id)
        if (isClick) {
          onLabelClick?.(drag!.id, endSvg.x, endSvg.y)
        } else if (s && onLabelPositionChange) {
          onLabelPositionChange(drag!.id, s.labelX + dx, s.labelY + dy)
        }
      } else if (drag!.kind === 'background') {
        if (isClick) onBackgroundClick?.(endSvg.x, endSvg.y)
      }

      setDrag(null)
      setLiveOffset({ dx: 0, dy: 0 })
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag])

  function handleStationPointerDown(e: React.PointerEvent, id: number) {
    if (!adminMode || !svgRef.current) return
    e.stopPropagation()
    const { x, y } = screenToSvg(svgRef.current, e.clientX, e.clientY)
    setDrag({
      kind: 'station',
      id,
      startSvgX: x,
      startSvgY: y,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startedAt: Date.now(),
      moved: false,
    })
    setLiveOffset({ dx: 0, dy: 0 })
  }

  function handleLabelPointerDown(e: React.PointerEvent, id: number) {
    if (!adminMode || !svgRef.current) return
    e.stopPropagation()
    const { x, y } = screenToSvg(svgRef.current, e.clientX, e.clientY)
    setDrag({
      kind: 'label',
      id,
      startSvgX: x,
      startSvgY: y,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startedAt: Date.now(),
      moved: false,
    })
    setLiveOffset({ dx: 0, dy: 0 })
  }

  function handleBackgroundPointerDown(e: React.PointerEvent) {
    if (!adminMode || !svgRef.current) return
    // Only left-button
    if (e.button !== 0) return
    const { x, y } = screenToSvg(svgRef.current, e.clientX, e.clientY)
    setDrag({
      kind: 'background',
      startSvgX: x,
      startSvgY: y,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startedAt: Date.now(),
      moved: false,
    })
    setLiveOffset({ dx: 0, dy: 0 })
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${canvas.width} ${canvas.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        cursor: drag ? 'grabbing' : 'default',
        touchAction: adminMode ? 'none' : 'auto',
      }}
    >
      {/* Background hit rect (admin only) */}
      {adminMode && (
        <rect
          x={0}
          y={0}
          width={canvas.width}
          height={canvas.height}
          fill="transparent"
          onPointerDown={handleBackgroundPointerDown}
        />
      )}

      {/* Connection paths */}
      <g pointerEvents="none">
        {connections.map((c) => {
          const from = stationById.get(c.fromStationId)
          const to = stationById.get(c.toStationId)
          if (!from || !to) return null
          const active = isLineActive(c.lineCode)
          const opacity = hasFilter
            ? active
              ? ACTIVE_OPACITY
              : DIM_OPACITY
            : DEFAULT_CONNECTION_OPACITY
          return (
            <path
              key={c.id}
              d={pathPointsToD(c.path)}
              fill="none"
              stroke={lineColor(c.lineCode)}
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={opacity}
            />
          )
        })}
      </g>

      {/* Station marks */}
      <g>
        {stations.map((s) => {
          const primary = s.lineCodes[0]
          const color = primary ? lineColor(primary) : '#999'
          const active = isStationActive(s)
          const opacity = hasFilter ? (active ? ACTIVE_OPACITY : DIM_OPACITY) : DEFAULT_OPACITY
          const radius = s.lineCodes.length > 1 ? 9 : 6
          const { x, y } = stationDisplay(s)
          return (
            <circle
              key={`station-${s.id}`}
              cx={x}
              cy={y}
              r={radius}
              fill="white"
              stroke={color}
              strokeWidth={3}
              opacity={opacity}
              style={adminMode ? { cursor: 'grab' } : undefined}
              onPointerDown={adminMode ? (e) => handleStationPointerDown(e, s.id) : undefined}
            />
          )
        })}
      </g>

      {/* Labels */}
      <g>
        {stations.map((s) => {
          const active = isStationActive(s)
          const opacity = hasFilter ? (active ? ACTIVE_OPACITY : DIM_OPACITY) : DEFAULT_OPACITY
          const { x, y } = labelDisplay(s)
          return (
            <text
              key={`label-${s.id}`}
              data-label-id={s.id}
              x={x}
              y={y}
              textAnchor={s.labelAnchor}
              fontSize={14}
              fontWeight={500}
              fill="#333"
              opacity={opacity}
              style={{
                userSelect: 'none',
                cursor: adminMode ? 'grab' : undefined,
                pointerEvents: adminMode ? 'all' : 'none',
              }}
              onPointerDown={adminMode ? (e) => handleLabelPointerDown(e, s.id) : undefined}
            >
              {s.nameZh}
            </text>
          )
        })}
      </g>

      {/* Train animation marker */}
      <TrainMarker
        animationStations={animationStations}
        isAnimating={isAnimating}
        onAnimationEnd={onAnimationEnd}
      />
    </svg>
  )
}

type TrainMarkerProps = {
  animationStations?: StationView[]
  isAnimating: boolean
  onAnimationEnd?: () => void
}

function TrainMarker({ animationStations, isAnimating, onAnimationEnd }: TrainMarkerProps) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (settleRef.current) clearTimeout(settleRef.current)
    timerRef.current = null
    settleRef.current = null

    if (!isAnimating || !animationStations?.length) {
      setCurrentIndex(null)
      return
    }

    setCurrentIndex(0)
    let step = 1

    timerRef.current = setInterval(() => {
      setCurrentIndex(Math.min(step, animationStations.length - 1))
      step++
      if (step >= animationStations.length) {
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = null
        settleRef.current = setTimeout(() => {
          setCurrentIndex(null)
          onAnimationEnd?.()
        }, ANIMATION_SETTLE_MS)
      }
    }, ANIMATION_STEP_MS)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (settleRef.current) clearTimeout(settleRef.current)
      timerRef.current = null
      settleRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating, animationStations])

  if (currentIndex == null || !animationStations?.length) return null
  const s = animationStations[currentIndex]
  if (!s) return null

  return (
    <g transform={`translate(${s.schematicX}, ${s.schematicY})`} pointerEvents="none">
      <text
        x={0}
        y={6}
        textAnchor="middle"
        fontSize={26}
        style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}
      >
        {'🚇'}
      </text>
      <text
        x={0}
        y={-22}
        textAnchor="middle"
        fontSize={13}
        fontWeight={600}
        fill="#1890ff"
        style={{
          paintOrder: 'stroke',
          stroke: 'white',
          strokeWidth: 3,
          strokeLinejoin: 'round',
        }}
      >
        {s.nameZh}
      </text>
    </g>
  )
}

export { LabelAnchor }
