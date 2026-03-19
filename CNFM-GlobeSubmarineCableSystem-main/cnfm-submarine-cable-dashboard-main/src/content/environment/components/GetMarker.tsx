import { useGetMarker } from "src/hooks/useApi";
import { useEffect, useState, useRef, useMemo } from "react";
import L from "leaflet";
import { Box, Button, Typography } from "@mui/material";
import { useMap } from "react-leaflet";
import RoomIcon from '@mui/icons-material/Room';
import Swal from 'sweetalert2';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMarker, updateMarker } from "src/hooks/useApi";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem, 
  Divider,
  Snackbar,
  Alert
} from "@mui/material";
export default function GetMarker() {
  const [Marker, setMarker] = useState<any>(null);
  const [hovered, setHovered] = useState<any>(null);
  const [isHoveringBox, setIsHoveringBox] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MarkerType | null>(null);
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [editType, setEditType] = useState('');
  const map = useMap();
  const timeoutRef = useRef<any>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });
  const [latDir, setLatDir] = useState<'N' | 'S'>('N');
  const [lngDir, setLngDir] = useState<'E' | 'W'>('E');
  const [latError, setLatError] = useState('');
  const [lngError, setLngError] = useState('');
  // const customIcon = L.icon({
  //   iconUrl: "/static/images/overview/japan-flag-marker.png",
  //   iconSize: [32, 32],
  //   iconAnchor: [16, 32],
  // });

  const customIcon = (marker_type: string) => {
    return L.icon({
      iconUrl: marker_type === "EarthQuake" ? "/static/images/overview/red-marker.png" :"/static/images/overview/blue-marker.png",
      iconSize: [25, 25 ],
      iconAnchor: [12, 25],
    });
  }


  useEffect(() => {
    const loadMap = async () => {
      const RL = await import("react-leaflet");
      setMarker(() => RL.Marker);
    };

    loadMap();
  }, []);

  const { data } = useGetMarker();
  const queryClient = useQueryClient();
  const {mutate: deleteMarkerMutation, isPending: isDeleting} = useMutation({
    mutationFn: deleteMarker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markerData'] });
      setSnackbar({
        open: true,
        message: 'The marker has been successfully deleted.',
        severity: 'success',
      });
    },
  });

  const {mutate: updateMarkerMutation, isPending: isUpdating} = useMutation({
    mutationFn: updateMarker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markerData'] });
      setSnackbar({
        open: true,
        message: 'The marker has been successfully updated.',
        severity: 'success',
      });
    },
  });

  const isAdminLoggedIn = useMemo(() => {
    try {
      const loggedIn = localStorage.getItem('loggedIn') === 'true';
      const role = localStorage.getItem('user_role');
      return !!loggedIn && !!role && role.toLowerCase() === 'administrator';
    } catch (err) {
      return false;
    }
  }, []);

  if (!data || !Marker) return <></>;

  // Delete Mutation for markers
  const handleDeleteMarker = async (id: number) => {

    const confirm = await Swal.fire({
      title: 'Delete Marker?',
      text: 'This will remove the marker.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    if(!confirm.isConfirmed) return;

    try {
      deleteMarkerMutation(id);
      map.setView([18, 134], 4);
    } catch (error) {
      console.error('Error deleting marker:', error);
    }
  }

  type MarkerType = {
    id: number;
    latitude: number;
    longitude: number;
    marker_type: string;
    latitude_direction: "N" | "S";
    longitude_direction: "E" | "W";
  };
  // Edit Mutation for markers
  const handleEditMarker = (marker: MarkerType) => {
    setSelectedMarker(marker);
    setEditLat(marker.latitude.toFixed(4));
    setEditLng(marker.longitude_direction === "W" ? (360 - marker.longitude).toFixed(4) : marker.longitude.toFixed(4));
    setEditType(marker.marker_type);
    setLatDir(marker.latitude_direction);
    setLngDir(marker.longitude_direction);
    setOpenEdit(true);
  };
    const handleChangeLatitude = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if(value > 90){
      setEditLat('90');
      setLatError('Latitude cannot be greater than 90');
    }
    else{
      setEditLat(e.target.value);
      setLatError('');
    }
  }
  const handleChangeLongitude = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if(value > 360){
      setEditLng('360');
      setLngError('Longitude cannot be greater than 360');
    }
    else{
      setEditLng(e.target.value);
      setLngError('');
    }
  }

  const handleSubmitEdit = async () => {
  try {
    if (!selectedMarker) return;
    const isLngDirectionWest = lngDir === "W";
    const isLatDirectionSouth = latDir === "S";
    const updatedMarker : MarkerType = {
      id: selectedMarker.id,
      latitude: isLatDirectionSouth ? parseFloat(editLat) * -1 : parseFloat(editLat),
      longitude: isLngDirectionWest ? (parseFloat(editLng) * -1 )+ 360 : parseFloat(editLng),
      marker_type: editType,
      latitude_direction: latDir,
      longitude_direction: lngDir
    };

    // Check if there is no change in any field
    if (
      updatedMarker.latitude === selectedMarker.latitude &&
      updatedMarker.longitude === selectedMarker.longitude &&
      updatedMarker.marker_type === selectedMarker.marker_type && 
      updatedMarker.latitude_direction === selectedMarker.latitude_direction &&
      updatedMarker.longitude_direction === selectedMarker.longitude_direction
    ) {
      setOpenEdit(false);
      await Swal.fire('No Changes', 'No changes were made to the marker.', 'info');
      return;
    }
    updateMarkerMutation(updatedMarker);
    setOpenEdit(false);
    map.flyTo([updatedMarker.latitude, updatedMarker.longitude], 6, {
      duration: 1.5,
      easeLinearity: 0.25
    });
    setSelectedMarker(null);
    setEditLat('');
    setEditLng('');
    setEditType('');
    setLatDir('N');
    setLngDir('E');
    // await Swal.fire('Updated Marker', 'The marker has been Successfully updated.', 'success');


    setOpenEdit(false);     
    } catch (error) {
      console.error('Error updating marker:', error);      
    }
  }


  return (
    <>
      {/* MARKERS */}
      {data.map((item: any) => (
        <Marker
          key={item.id}
          position={[item.latitude, item.longitude]}
          icon={customIcon(item.marker_type)}
          eventHandlers={{
            mouseover: () => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              setHovered(item);
            },
            mouseout: () => {
              timeoutRef.current = setTimeout(() => {
                if (!isHoveringBox) {
                  setHovered(null);
                }
              }, 150); // smooth transition
            },
          }}
        />
      ))}

      {/* HOVER BOX */}
      {hovered && (() => {
        const point = map.latLngToContainerPoint([
          hovered.latitude,
          hovered.longitude,
        ]);

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
              width: 200,
              borderRadius: "12px",
              backgroundColor: "#fff",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              border: "1px solid rgba(0,0,0,0.08)",
              overflow: "hidden",
              zIndex: 1000,
              transition: "all 0.2s ease",
            }}
            style={{
              left: point.x,
              top: point.y - 40,
            }}
          >
            {/* HEADER */}
            <Box
              sx={{
                px: 2,
                py: 1.2,
                background:
                  hovered.marker_type === "EarthQuake"
                    ? "linear-gradient(135deg, #ff4d4f, #d9363e)"
                    : "linear-gradient(135deg, #1677ff, #0958d9)",
                color: "white",
                fontWeight: 600,
                fontSize: "13px",
                letterSpacing: 0.3,
              }}
            >
              {hovered.marker_type}
            </Box>

            {/* BODY */}
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
              }}
            >
              <Typography fontSize="12px" color="text.secondary">
                Latitude:
              </Typography>
              <Typography fontSize="13px" fontWeight={500}>
                {hovered.latitude.toFixed(4)} {hovered.latitude_direction}
              </Typography>

              <Typography fontSize="12px" color="text.secondary" mt={1}>
                Longitude:
              </Typography>
              <Typography fontSize="13px" fontWeight={500}>
                {hovered.longitude_direction === "W" ? (360 - hovered.longitude).toFixed(4) : hovered.longitude} {hovered.longitude_direction}
              </Typography>
            </Box>

            {/* DIVIDER */}
            <Box sx={{ height: "1px", background: "#f0f0f0" }} />

            {/* FOOTER Only Visible for Admin */}
            {isAdminLoggedIn && (
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  p: 1,
                }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{
                    borderRadius: "6px",
                    textTransform: "none",
                    fontSize: "12px",
                  }}
                  onClick={() => handleEditMarker(hovered)}
                >
                  Edit
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  color="error"
                  fullWidth
                  sx={{
                    borderRadius: "6px",
                    textTransform: "none",
                    fontSize: "12px",
                  }}
                  onClick={() => handleDeleteMarker(hovered.id)}
                >
                  Delete
                </Button>
              </Box>
              
            )}

            {/* ARROW */}
            <Box
              sx={{
                position: "absolute",
                bottom: -6,
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "6px solid white",
              }}
              />
          </Box>
        );
      })()}

      {/* Dialog for Edit */}

      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Marker</DialogTitle>
        <Divider></Divider>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Enter Latitude"
            type="number"
            value={editLat}
            onChange={handleChangeLatitude}
            error={latError !== ''}
            helperText={latError}
            fullWidth
            onKeyDown={(e) => {
              if (e.key === '-') e.preventDefault();
              if(e.key === '+') e.preventDefault();
            }}
            InputProps={{ inputProps: { min: 0, max: 90 } }}
          />
          <TextField
            label="Latitude Direction"
            select
            value={latDir}
            onChange={(e) => setLatDir(e.target.value as 'N' | 'S')}
            fullWidth
          >
            <MenuItem value="N">N</MenuItem>
            <MenuItem value="S">S</MenuItem>
          </TextField>
          <TextField
            label="Enter Longitude"
            type="number"
            value={editLng}
            onChange={handleChangeLongitude}
            error={lngError !== ''}
            helperText={lngError}
            fullWidth
            onKeyDown={(e) => {
              if (e.key === '-') e.preventDefault();
              if(e.key === '+') e.preventDefault();
            }}
            InputProps={{ inputProps: { min: 0, max: 360 } }}
          />
          <TextField
            label="Longitude Direction"
            select
            value={lngDir}
            onChange={(e) => setLngDir(e.target.value as 'E' | 'W')}
            fullWidth
          >
            <MenuItem value="E">E</MenuItem>
            <MenuItem value="W">W</MenuItem>
          </TextField>
          <TextField
            label="Marker Type"
            select
            value={editType}
            onChange={(e) => setEditType(e.target.value)}
            fullWidth
          >
            <MenuItem value="EarthQuake">EarthQuake</MenuItem>
            <MenuItem value="Cable Crossing">Cable Crossing</MenuItem>
          </TextField>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>

          <Button
            variant="contained"
            onClick={() => handleSubmitEdit()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}