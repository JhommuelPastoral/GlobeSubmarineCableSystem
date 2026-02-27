"use client"

import { lazy, useEffect, useMemo, useState, Suspense } from "react"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

const AllRoutes = lazy(() =>
  Promise.all([
    import("./routeposition/nasugbo_mamburao_1"),
    import("./routeposition/sanjose_mamburao"),
    import("./routeposition/sanjose_roxas"),
    import("./routeposition/cadiz_roxas"),
    import("./routeposition/san_remigio_cadiz"),
    import("./routeposition/san_remigio_lilo"),
    import("./routeposition/bacong_maticao"),
    import("./routeposition/bacong_talisay"),
    // Second set of routes
    import("./routeposition/legaspi_calbayog"),
    import("./routeposition/duero_maasin"),
    import("./routeposition/potuhan_talisay"),
    import("./routeposition/maasin_cabadbaran"),
    import("./routeposition/banate_bacolod"),
    import("./routeposition/capoocan_calbayog"),

    // Third set of routes
    import("./routeposition/boracay_caticlan"),
    // import("./routeposition/taytay_san_jose"),
    import("./routeposition/taytay_bu"),
    import("./routeposition/bu_san_jose"),
    import("./routeposition/bu_coron"),


    // you can add more routes here if needed
  ]).then((modules) => ({
    default: () => (
      <>
        {modules.map((Module, index) => {
          const Component = Module.default
          return <Component key={`route-${index}`} />
        })}
      </>
    )
  }))
)


export default function PhilMap() {
  // Custom Marker Icon
  const customIcon = L.icon({
    iconUrl: "/static/images/overview/singapore-flag-marker.png",
    iconSize: [36, 36],
    iconAnchor: [16, 36],
    popupAnchor: [0, -36],
  })

  // React Leaflet dynamic components
  const [MapContainer, setMapContainer] = useState<any>(null)
  const [TileLayer, setTileLayer] = useState<any>(null)
  const [Marker, setMarker] = useState<any>(null)
  const [ZoomControl, setZoomControl] = useState<any>(null)


  // API Config
  const apiConfig = useMemo(
    () => ({
      apiBaseUrl: process.env.REACT_APP_API_BASE_URL || "",
      port: process.env.REACT_APP_PORT || "",
      mapApiKey: process.env.REACT_APP_GEOAPIFY_API_KEY || "",
    }),
    []
  )

  // Tile URL (Geoapify or fallback to OSM)
  const tileUrl = useMemo(() => {
    if (apiConfig.mapApiKey) {
      return `https://maps.geoapify.com/v1/tile/klokantech-basic/{z}/{x}/{y}.png?apiKey=${apiConfig.mapApiKey}`
    }
    return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  }, [apiConfig])

  // Load React Leaflet dynamically (fix for Next.js SSR)
  useEffect(() => {
    const loadMap = async () => {
      const RL = await import("react-leaflet")
      setMapContainer(() => RL.MapContainer)
      setTileLayer(() => RL.TileLayer)
      setMarker(() => RL.Marker)
      setZoomControl(() => RL.ZoomControl)
    }

    loadMap()
  }, [])


  if (!MapContainer || !TileLayer || !ZoomControl) {
    return <p>Loading map...</p>
  }

  return (
    <MapContainer
      center={[12.8797, 121.7740]} // Philippines center
      zoom={6}
      zoomControl={false} // disable default zoom control
      style={{ height: "100vh", minHeight: "600px", width: "100%" }}
    >
      <TileLayer url={tileUrl} />
      
      {/* Custom Zoom Control Position */}
      <ZoomControl position="bottomleft" />
      
      <Suspense fallback={null}>
        <AllRoutes />
      </Suspense>

    </MapContainer>
  )
}