"use client"

import { lazy, useEffect, useMemo, useState, Suspense, useCallback, useRef } from "react"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import {useCableId} from "../store/store"
import { useQuery } from "@tanstack/react-query"
import Box from "@mui/material/Box"
import { IconButton, Tooltip, Typography } from "@mui/material"
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import DeletedCablesSidebar from "./deletedCablePhil"
import RectangleIcon from '@mui/icons-material/Rectangle';
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

    // Fourth set of routes
    import("./routeposition/dalahican_mansalay"),
    import("./routeposition/mansalay_hamtik"),
    import("./routeposition/hamtik_tigbaunan"),
    import("./routeposition/telicphil_seg4"),
    import("./routeposition/bacong_bayawan"),
    import("./routeposition/telicphil_seg6"),
    import("./routeposition/telicphil_seg7"),
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
);


export default function PhilMap() {
  // Custom Marker Icon
  const LoadingSpinner: React.FC<{ message?: string }> = ({
    message = 'Loading...'}) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 2,
        minHeight: '60px'
      }}
    >
      <Box
        sx={{
          width: '20px',
          height: '20px',
          border: '2px solid #f3f3f3',
          borderTop: '2px solid #3854A5',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          mr: 2,
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' }
          }
        }}
      />
      <Typography variant="body2" color="textSecondary">
        {message}
      </Typography>
    </Box>
  );


  // React Leaflet dynamic components
  const [MapContainer, setMapContainer] = useState<any>(null);
  const [TileLayer, setTileLayer] = useState<any>(null);
  const [Marker, setMarker] = useState<any>(null);
  const [ZoomControl, setZoomControl] = useState<any>(null);
  const {onCutId} = useCableId();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // API Config
  const apiConfig = useMemo(
    () => ({
      apiBaseUrl: process.env.REACT_APP_API_BASE_URL || "",
      port: process.env.REACT_APP_PORT || "",
      mapApiKey: process.env.REACT_APP_GEOAPIFY_API_KEY || "",
    }),
    []
  );

  const fetchCuts = async () => {
    const res = await fetch(`${apiConfig.apiBaseUrl}${apiConfig.port}/cable_cuts_phil`, { method: 'GET' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch cable cuts');
    }
    return res.json();
  };

  const { data: cutsRaw = [], isFetching } = useQuery({
    queryKey: ['cableCuts-Phil'],
    queryFn: fetchCuts,
    // Poll for changes. Adjust interval as necessary for performance.
    refetchInterval: 2000,
    staleTime: 5000,
    refetchOnWindowFocus: false,
    retry: 1
  });
  
  useEffect(() => {
    if (cutsRaw.length > 0) {
      const segmentCuts = cutsRaw
        .filter((segment: any) => segment.cut_id)
        .map((segment: any) => {
          return segment.cut_id
            .split("-")
            .slice(0, 2)
            .join("-")
        });


      onCutId(segmentCuts);
    }
  }, [cutsRaw, onCutId]);
  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);
  // Tile URL (Geoapify or fallback to OSM)
  const tileUrl = useMemo(() => {
    if (apiConfig.mapApiKey) {
      return `https://maps.geoapify.com/v1/tile/klokantech-basic/{z}/{x}/{y}.png?apiKey=${apiConfig.mapApiKey}`
    }
    return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  }, [apiConfig]);

  useEffect(() => {
    const loadMap = async () => {
      const RL = await import("react-leaflet")
      setMapContainer(() => RL.MapContainer)
      setTileLayer(() => RL.TileLayer)
      setMarker(() => RL.Marker)
      setZoomControl(() => RL.ZoomControl)
      console.log("React-Leaflet modules loaded, map not ready yet");
    }

    loadMap()
  }, []);
  const isAdminLoggedIn = useMemo(() => {
    try {
      const loggedIn = localStorage.getItem('loggedIn') === 'true';
      const role = localStorage.getItem('user_role');
      return !!loggedIn && !!role && role.toLowerCase() === 'administrator';
    } catch (err) {
      return false;
    }
  }, []);

  if (!MapContainer || !TileLayer || !ZoomControl) {
    return <p>Loading map...</p>
  }

  return (
    <>
      <Box sx={{ position: 'relative', width: '100%', height: '100vh' }}>

        <MapContainer
          center={[12.8797, 121.7740]} // Philippines center
          zoom={6}
          zoomControl={false} // disable default zoom control
          style={{ height: "100vh", minHeight: "600px", width: "100%" }}
          ref={(map) => {
            if (map) {
              mapRef.current = map;
            }
        }}        >
          {/* <CutCable cableSegment="Bacong"/> */}
          <TileLayer url={tileUrl} />
          

          {/* Custom Zoom Control Position */}
          <ZoomControl position="bottomleft" />
          
          <Suspense fallback={null}>
            <AllRoutes />
          </Suspense>

        </MapContainer>
          {!sidebarOpen && (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 1200,
              background: 'rgba(255,255,255,0.45)',
              borderRadius: '12px',
              boxShadow: '0 10px 22px rgba(0,0,0,0.28)',
              padding: '6px 10px',
              border: '1px solid rgba(255,255,255,0.55)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            {/* Menu Button */}
            <IconButton
              sx={{
                background: 'rgba(255,255,255,0.65)',
                boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
                borderRadius: '10px',
                p: 1,
                border: '1px solid rgba(255,255,255,0.6)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.78)',
                  transform: 'scale(1.05)',
                  transition: 'all 0.2s ease'
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              }}
              onClick={handleSidebarToggle}
              aria-label="Access Comprehensive Deleted Cables Management"
            >
              <MenuIcon sx={{ fontSize: 28, color: '#1d2a3d' }} />
            </IconButton>
            
            <Tooltip
              title="Login"
              placement="right"
              componentsProps={{
                tooltip: {
                  sx: {
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    fontWeight: 800,
                    letterSpacing: 0.4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    boxShadow: '0 8px 16px rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(8px)',
                    pointerEvents: 'none',
                    transition: 'all 0.3s ease',
                    color: '#fff',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    whiteSpace: 'nowrap'
                  }
                },
              }}
            >
              <IconButton
                sx={{
                  background: 'rgba(255,255,255,0.65)',
                  boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
                  borderRadius: '10px',
                  p: 1,
                  border: '1px solid rgba(255,255,255,0.6)',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.78)',
                    transform: 'scale(1.05)',
                    transition: 'all 0.2s ease'
                  },
                  '&:active': {
                    transform: 'scale(0.98)'
                  }
                }}
                onClick={() => {
                  window.location.href = '/login';
                }}
              >
                <AccountCircleIcon sx={{ fontSize: 28, color: '#1d2a3d' }} />
              </IconButton>
            </Tooltip>
            <Tooltip
              title="Global Submarine Cables Overview"
              placement="right"
              componentsProps={{
                tooltip: {
                  sx: {
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    fontWeight: 800,
                    letterSpacing: 0.4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    boxShadow: '0 8px 16px rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(8px)',
                    pointerEvents: 'none',
                    transition: 'all 0.3s ease',
                    color: '#fff',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    whiteSpace: 'nowrap'
                  }
                },
              }}
            >
              <IconButton
                sx={{
                  background: 'rgba(255,255,255,0.65)',
                  boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
                  borderRadius: '10px',
                  p: 1,
                  border: '1px solid rgba(255,255,255,0.6)',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.78)',
                    transform: 'scale(1.05)',
                    transition: 'all 0.2s ease'
                  },
                  '&:active': {
                    transform: 'scale(0.98)'
                  }
                }}
                onClick={() => {
                  window.location.href = '/home';
                }}
              >
                <img src="/images/logos/global-logo.png" alt="" style={{ width: 28, height: 28 }} />
                {/* <AccountCircleIcon sx={{ fontSize: 28, color: '#1d2a3d' }} /> */}
              </IconButton>
            </Tooltip>
            {/* Login Button */}
          </Box>
        )}
        {sidebarOpen && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: 360,
              zIndex: 1100,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 12px 30px rgba(0,0,0,0.32)',
              borderRadius: '14px',
              overflow: 'hidden',
              background: 'rgba(0,0,0,0.32)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.16)',
              p: 1.25,
              gap: 1
            }}
          >
            <Box 
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',                 
              }}
            >
              {/* Left: Active Cable Faults */}
              <Box
                sx={{
                  px: 1.75,
                  py: 0.75,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  letterSpacing: 0.4,
                  boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
                  backdropFilter: 'blur(6px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Typography>
                  Active Cable Faults
                </Typography>
              </Box>

              {/* Right: Button */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center', 
                  gap: 1
                }}
              >
                <Tooltip
                  title="Global Submarine Cables Overview"
                  placement="right"
                  componentsProps={{
                    tooltip: {
                      sx: {
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        fontWeight: 800,
                        letterSpacing: 0.4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        boxShadow: '0 8px 16px rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        backdropFilter: 'blur(8px)',
                        pointerEvents: 'none',
                        transition: 'all 0.3s ease',
                        color: '#fff',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        whiteSpace: 'nowrap'
                      }
                    },
                  }}
                >
                  <IconButton
                    sx={{
                      background: 'rgba(255,255,255,0.65)',
                      boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
                      borderRadius: '10px',
                      p: 1,
                      border: '1px solid rgba(255,255,255,0.6)',
                      '&:hover': {
                        background: 'rgba(255,255,255,0.78)',
                        transform: 'scale(1.05)',
                        transition: 'all 0.2s ease'
                      },
                      '&:active': {
                        transform: 'scale(0.98)'
                      }
                    }}
                    onClick={() => {
                      window.location.href = '/home';
                    }}
                  >
                    <img src="/images/logos/global-logo.png" alt="" style={{ width: 28, height: 28 }} />
                    {/* <AccountCircleIcon sx={{ fontSize: 28, color: '#1d2a3d' }} /> */}
                  </IconButton>
                </Tooltip>
                <Tooltip
                  title="Login"
                  placement="right"
                  componentsProps={{
                    tooltip: {
                      sx: {
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        fontWeight: 800,
                        letterSpacing: 0.4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        boxShadow: '0 8px 16px rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        backdropFilter: 'blur(8px)',
                        pointerEvents: 'none',
                        transition: 'all 0.3s ease',
                        color: '#fff',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        whiteSpace: 'nowrap'
                      }
                    },
                  }}
                >
                  <IconButton
                    sx={{
                      background: 'rgba(255,255,255,0.65)',
                      boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
                      borderRadius: '10px',
                      p: 1,
                      border: '1px solid rgba(255,255,255,0.6)',
                      '&:hover': {
                        background: 'rgba(255,255,255,0.78)',
                        transform: 'scale(1.05)',
                        transition: 'all 0.2s ease'
                      },
                      '&:active': {
                        transform: 'scale(0.98)'
                      }
                    }}
                    onClick={() => {
                      window.location.href = '/login';
                    }}
                  >
                    <AccountCircleIcon sx={{ fontSize: 28, color: '#1d2a3d' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Suspense
              fallback={<LoadingSpinner message="Loading sidebar..." />}
            >
              <DeletedCablesSidebar
                onSelectCable={(cable) => {
                  // Let DeletedCablesSidebar handle all map positioning internally
                  // Don't interfere with map panning to avoid conflicts
                  // console.log('Cable selected and positioned:', cable);
                }}
                lastUpdate={lastUpdate || undefined}
                setLastUpdate={(val: string) => {
                  // update local lastUpdate state and refetch query to keep UI in sync
                  setLastUpdate(val);
                }}
                isAdmin={isAdminLoggedIn} // Enable admin functionality only for administrators
                isUser={true} // Enable user functionality
                mapRef={ mapRef}
                onCloseSidebar={() => {
                  // Close the sidebar
                  setSidebarOpen(false);

                  // Reset map camera to original/default view if map is available
                  try {
                    const map = mapRef.current;
                    if (map) {
                      // original center and zoom used by ChangeView
                      const defaultCenter: [number, number] = [12.8797, 121.7740];
                      const defaultZoom = 6;
                      if (typeof map.setView === 'function') {
                        map.setView(defaultCenter, defaultZoom, {
                          animate: true,
                          duration: 0.5
                        });
                      } else if (typeof map.setZoom === 'function') {
                        map.setView(defaultCenter, defaultZoom, {
                          animate: true,
                          duration: 0.5
                        });
                      }
                    }
                  } catch (err) {
                    /* swallow errors to avoid breaking UI on close */
                    // console.error('Error resetting map view on sidebar close:', err);
                  }
                }} // Add close function that also recenters the map
              />
            </Suspense>
          </Box>
        )}

        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 'auto',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)', // for Safari
            color: 'white',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            zIndex: 1000,
            fontSize: '14px',
            // flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            display: 'flex',
            gap: 3,
            
          }}
        >
          {/* <Typography variant="caption" color="black" 
            fontWeight="bold" 
            sx={{ 
              textAlign: 'center',
              width: '100%',
            }}>
            Legends
          </Typography> */}
          <Typography variant="body2" color="black" 
            sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <RectangleIcon sx={{ fontSize: 15, color: 'red' }} />
            Segment Down
          </Typography>        
          <Typography variant="body2" color="black" 
            sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <RectangleIcon sx={{ fontSize: 15, color: 'Green' }} />
            FOBN1 RPL
          </Typography>


          <Typography variant="body2" color="black" 
            sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          <RectangleIcon sx={{ fontSize: 15, color: 'Yellow', }} />
            FOBN2 RPL
          </Typography>
          <Typography variant="body2" color="black" 
            sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <RectangleIcon sx={{ fontSize: 15, color: 'Blue' }} />
            NDTN RPL
          </Typography>
        </Box>
    </Box>


    </>
  )
}