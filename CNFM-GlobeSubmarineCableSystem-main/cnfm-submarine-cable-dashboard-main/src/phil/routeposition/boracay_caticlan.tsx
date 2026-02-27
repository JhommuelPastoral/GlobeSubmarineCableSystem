"use client"

import { useEffect, useMemo, useState } from "react"
import "leaflet/dist/leaflet.css"



export default function BoracayCaticlan() {

  const [Polyline, setPolyline] = useState<any>(null);
  const [Data, setData] = useState(null);
  const [location, setLocation] = useState(null);
  const [totalLengthKm, setTotalLengthKm] = useState(0);
  const [segmentFirstEvent, setSegmentFirstEvent] = useState<string | null>(null);
  const [segmentLastEvent, setSegmentLastEvent] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  // API Config
  const apiConfig = useMemo(
    () => ({
      apiBaseUrl: process.env.REACT_APP_API_BASE_URL || "",
      port: process.env.REACT_APP_PORT || "",
      mapApiKey: process.env.REACT_APP_GEOAPIFY_API_KEY || "",
    }),
    []
  )
  const getPathOptions = () => {
    const baseColor = 'blue';

    return {
      color: baseColor,
      weight: isHovered ? 6 : 4, 
      opacity: isHovered ? 1 : 0.8,
      className: isHovered ? 'segment-highlight' : undefined
    };
  };
  // Load React Leaflet dynamically (fix for Next.js SSR)
  useEffect(() => {
    const loadMap = async () => {
      const RL = await import("react-leaflet")
      setPolyline(() => RL.Polyline)
    }

    loadMap()
  }, [apiConfig]);


  // fetch polylines data
  useEffect(()=>{
    const fetchPolylines = async () => {
      try {
        const response = await fetch(`${apiConfig.apiBaseUrl}${apiConfig.port}/boracay_caticlan`);
        const result = await response.json();
        const formatted = result
          .filter((item: any) =>
            item.latitude !== null &&
            item.lattitude1 !== null &&
            item.longitude1 !== 0 &&
            item.longitude !== null &&
            item.longitude1 !== null &&
            item.longitude1 !== 0

          )
          .map((item: any) => {
            let lat = Number(item.latitude) + Number(item.latitude1) 
            lat = Math.round(lat * 10000) / 10000;
            let lng =Number(item.longitude) + Number(item.longitude1) 
            lng = Math.round(lng * 10000) / 10000;

            return [lat, lng]
        });

        const formattedTotalLengthKm = result
          .filter((item: any) => item.total_length_km !== null && item.total_length_km !== 0)
          .reduce((sum: any, item: any) => sum + item.total_length_km, 0);

        // Filtered the repeater;
        const filteredRepeater = result.filter((item: any) => item.repeater !== null && item.repeater !== "").map((item: any) => item.repeater);

        setLocation(formatted);
        setTotalLengthKm(formattedTotalLengthKm);
        setData(result);
        setSegmentFirstEvent(filteredRepeater.length > 0 ? filteredRepeater[0] : null);
        setSegmentLastEvent(filteredRepeater.length > 0 ? filteredRepeater[filteredRepeater.length - 1] : null);
      } catch (error) {
        console.log(error);
      }
    }
    fetchPolylines();

  },[apiConfig]);


  if(!location) return null;
  const segmentEventLabel =
    segmentFirstEvent && segmentLastEvent
      ? `${segmentFirstEvent} <span aria-hidden="true" style="padding: 0 6px;">&rarr;</span> ${segmentLastEvent}`
      : '--';
  return (
    <Polyline
      positions={location}
      pathOptions={getPathOptions()}
      opacity={1}
      eventHandlers={{
          mouseover: (e) => {
            const layer = e.target;
            const latlng = e.latlng;
            layer
              .bindTooltip(`<div style="text-align: center; font-size: 12.5px; line-height: 1.35;"><div style="font-weight: 600; font-size: 13px; margin-bottom: 2px;">Boracay - Caticlan </div><div style="color: #4b5563; margin-bottom: 4px;">${totalLengthKm.toFixed(4)} Km</div><div style="color: #111827;">${segmentEventLabel} </div></div>`, {
                permanent: false,
                direction: 'top',
                offset: [0, -10],
                className: 'custom-tooltip',
                opacity: 0.9,
                sticky: true // This makes the tooltip follow the cursor
              })
              .openTooltip(latlng);
            setIsHovered(true);

          },
          mouseout: (e) => {
            const layer = e.target;
            layer.closeTooltip();
            setIsHovered(false);
          },
      }}
            
    />
  )
}