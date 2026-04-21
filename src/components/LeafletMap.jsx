import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import {
  MapContainer, TileLayer, CircleMarker, Polyline,
  Marker, Tooltip, useMap, useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'

const lineColorMap = {
  BR: '#9c6b38',
  R:  '#e3192a',
  RA: '#f5a0b5',
  G:  '#008659',
  GA: '#99E64D',
  O:  '#f5a622',
  BL: '#0070bd',
  Y:  '#d4a017',
}

const dimOpacity = 0.15

function makeTrainIcon() {
  return L.divIcon({
    html: '<div style="font-size:26px;line-height:1;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5))">🚇</div>',
    className: '',
    iconAnchor: [13, 13],
  })
}

// Pans map to trainPosition during animation; flies to lotteryTarget after
function MapController({ trainPosition, lotteryTarget, isAnimating }) {
  const map = useMap()
  const prevAnimating = useRef(false)

  useEffect(() => {
    if (isAnimating && trainPosition) {
      map.panTo([trainPosition.lat, trainPosition.lng], { animate: true, duration: 0.15 })
    }
    if (prevAnimating.current && !isAnimating && lotteryTarget) {
      map.flyTo([lotteryTarget.lat, lotteryTarget.lng], 15, { duration: 1.2 })
    }
    prevAnimating.current = isAnimating
  }, [trainPosition, lotteryTarget, isAnimating, map])

  return null
}

function LeafletMap({
  metroData,
  selectedLines = [],
  isAnimating = false,
  animationStations = [],
  lotteryTarget = null,
  onAnimationEnd,
  adminMode = false,
  onStationDragEnd,
  onMapClick,
  onStationClick,
}) {
  const [trainPosition, setTrainPosition] = useState(null)

  // Train animation loop
  useEffect(() => {
    if (!isAnimating || !animationStations.length) return
    setTrainPosition(animationStations[0])
    let step = 1
    const timer = setInterval(() => {
      setTrainPosition(animationStations[step] ?? animationStations[animationStations.length - 1])
      step++
      if (step >= animationStations.length) {
        clearInterval(timer)
        setTimeout(() => {
          setTrainPosition(null)
          onAnimationEnd?.()
        }, 600)
      }
    }, 180)
    return () => clearInterval(timer)
  }, [isAnimating]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasSelection = selectedLines.length > 0
  const stationById = {}
  const stationByName = {}
  ;(metroData?.stations ?? []).forEach(s => {
    stationById[s.id] = s
    stationByName[s.name?.zh] = s
  })

  // Build polylines from connections
  const polylines = (metroData?.connections ?? []).map((conn, i) => {
    const from = stationByName[conn.from]
    const to = stationByName[conn.to]
    if (!from?.lat || !to?.lat) return null
    const lineCode = conn.line
    const isActive = hasSelection && selectedLines.includes(lineCode)
    const opacity = hasSelection ? (isActive ? 1 : dimOpacity) : 0.7
    const color = lineColorMap[lineCode] ?? '#999'
    return (
      <Polyline
        key={`conn-${i}`}
        positions={[[from.lat, from.lng], [to.lat, to.lng]]}
        pathOptions={{ color, weight: 6, opacity }}
      />
    )
  }).filter(Boolean)

  // Build station markers
  const stationMarkers = (metroData?.stations ?? []).map(station => {
    if (!station.lat) return null
    const primaryLine = station.lines?.[0]
    const color = lineColorMap[primaryLine] ?? '#999'
    const isActive = hasSelection && station.lines?.some(l => selectedLines.includes(l))
    const opacity = hasSelection ? (isActive ? 1 : dimOpacity) : 0.85

    if (adminMode) {
      return (
        <Marker
          key={`station-${station.id}`}
          position={[station.lat, station.lng]}
          draggable={true}
          eventHandlers={{
            dragend: (e) => onStationDragEnd?.(station.id, e.target.getLatLng()),
            click: () => onStationClick?.(station),
          }}
        >
          <Tooltip direction="top" offset={[0, -8]}>{station.name?.zh}</Tooltip>
        </Marker>
      )
    }

    return (
      <CircleMarker
        key={`station-${station.id}`}
        center={[station.lat, station.lng]}
        radius={station.lines?.length > 1 ? 9 : 6}
        pathOptions={{
          color,
          fillColor: 'white',
          fillOpacity: opacity,
          opacity,
          weight: 3,
        }}
      >
        <Tooltip direction="top" offset={[0, -6]}>{station.name?.zh}</Tooltip>
      </CircleMarker>
    )
  }).filter(Boolean)

  const trainIcon = makeTrainIcon()

  return (
    <MapContainer
      center={[25.05, 121.52]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {polylines}
      {stationMarkers}
      {trainPosition && (
        <Marker position={[trainPosition.lat, trainPosition.lng]} icon={trainIcon} zIndexOffset={1000}>
          <Tooltip permanent direction="top" offset={[0, -20]}>
            {trainPosition.name?.zh}
          </Tooltip>
        </Marker>
      )}
      <MapController
        trainPosition={trainPosition}
        lotteryTarget={lotteryTarget}
        isAnimating={isAnimating}
      />
      {adminMode && <MapClickHandler onMapClick={onMapClick} />}
    </MapContainer>
  )
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng)
    },
  })
  return null
}

LeafletMap.propTypes = {
  metroData: PropTypes.object,
  selectedLines: PropTypes.arrayOf(PropTypes.string),
  isAnimating: PropTypes.bool,
  animationStations: PropTypes.array,
  lotteryTarget: PropTypes.object,
  onAnimationEnd: PropTypes.func,
  adminMode: PropTypes.bool,
  onStationDragEnd: PropTypes.func,
  onMapClick: PropTypes.func,
  onStationClick: PropTypes.func,
}

export default LeafletMap
