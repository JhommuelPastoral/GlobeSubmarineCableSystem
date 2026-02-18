"use client"

import { useEffect, useState } from "react"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

export default function LeafletMap() {

  const customIcon = L.icon({
    iconUrl: '/static/images/overview/singapore-flag-marker.png',
    iconSize: [36, 36],
    iconAnchor: [16, 36],
    popupAnchor: [0, -36],
  }); 

  const [MapContainer, setMapContainer] = useState<any>(null);
  const [TileLayer, setTileLayer] = useState<any>(null);
  const [Marker, setMarker] = useState<any>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const loadMap = async () => {
      const L = await import("react-leaflet")
      setMapContainer(() => L.MapContainer)
      setTileLayer(() => L.TileLayer)
      setMarker(() => L.Marker)
    }
    loadMap()
  }, [])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      })
    }
  }, [])

  if (!MapContainer || !TileLayer || !Marker) return <p>Loading map...</p>
  if (!location) return <p>Loading location...</p>

  return (
    <MapContainer
      center={[location.lat, location.lng]}
      zoom={13}
      style={{ height: "100vh", minHeight: "600px", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* User location */}
      <Marker position={[location.lat, location.lng]} icon={customIcon} />
    </MapContainer>
  )
}
