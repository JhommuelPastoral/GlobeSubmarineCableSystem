"use client"

import { useState, useRef, memo } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface Earthquake {
  id: string;
  lat: number;
  lon: number;
  latDir: string;
  lonDir: string;
  magnitude: number;
  place: string;
  time: string;
  depth: number;
}

interface GetMarkerProps {
  data: Earthquake[];
}

export function GetMarkerUSGS({ data }: GetMarkerProps) {
  const map = useMap();
  const [hovered, setHovered] = useState<Earthquake | null>(null);
  const [isHoveringBox, setIsHoveringBox] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Custom Leaflet icon
  const earthquakeIcon = L.icon({
    iconUrl: "/static/images/overview/red-marker.png", // replace with your icon
    iconSize: [25, 25 ],
    iconAnchor: [12, 25],
  });

  return (
    <>
      {data.map((eq) => {
        const marker = L.marker([eq.lat, eq.lon], { icon: earthquakeIcon })
          .on("mouseover", () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setHovered(eq);
          })
          .on("mouseout", () => {
            timeoutRef.current = setTimeout(() => {
              if (!isHoveringBox) setHovered(null);
            }, 150);
          });

        marker.addTo(map);
        return null;
      })}

      {/* Hover Box */}
      {hovered && (() => {
        const point = map.latLngToContainerPoint([hovered.lat, hovered.lon]);

        return (
          <Box
            onMouseEnter={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              setIsHoveringBox(true);
            }}
            onMouseLeave={() => {
              setIsHoveringBox(false);
              setHovered(null);
            }}
            sx={{
              position: "absolute",
              transform: "translate(-50%, -100%)",
              width: 220,
              borderRadius: "12px",
              backgroundColor: "#fff",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              border: "1px solid rgba(0,0,0,0.08)",
              overflow: "hidden",
              zIndex: 1000,
              transition: "all 0.2s ease",
            }}
            style={{ left: point.x, top: point.y - 40 }}
          >
            {/* Header */}
            <Box
              sx={{
                px: 2,
                py: 1.2,
                background: "linear-gradient(135deg, #ff4d4f, #d9363e)",
                color: "white",
                fontWeight: 600,
                fontSize: "13px",
                letterSpacing: 0.3,
              }}
            >
              Earthquake
            </Box>

            {/* Body */}
            <Box sx={{ px: 2, py: 1.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <Typography fontSize="12px" color="text.secondary">Lat:</Typography>
                <Typography fontSize="13px" fontWeight={500}>
                  {hovered.lat.toFixed(2)}°{hovered.latDir}
                </Typography>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <Typography fontSize="12px" color="text.secondary">Lon:</Typography>
                <Typography fontSize="13px" fontWeight={500}>
                  {hovered.lon.toFixed(2)}°{hovered.lonDir}
                </Typography>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <Typography fontSize="12px" color="text.secondary">Magnitude:</Typography>
                <Typography fontSize="13px" fontWeight={500}>
                  {hovered.magnitude}
                </Typography>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <Typography fontSize="12px" color="text.secondary">Depth:</Typography>
                <Typography fontSize="13px" fontWeight={500}>
                  {hovered.depth} km
                </Typography>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Typography fontSize="12px" color="text.secondary">Place:</Typography>
                <Typography fontSize="13px" fontWeight={500}>
                  {hovered.place}
                </Typography>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <Typography fontSize="12px" color="text.secondary">Date:</Typography>
                <Typography fontSize="13px" fontWeight={500}>
                  {new Date(hovered.time).toLocaleString()}
                </Typography>
              </div>
            </Box>

            {/* Arrow */}
            <Box sx={{
              position: "absolute",
              bottom: -6,
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid white",
            }}/>
          </Box>
        );
      })()}
    </>
  );
}

export default memo(GetMarkerUSGS);