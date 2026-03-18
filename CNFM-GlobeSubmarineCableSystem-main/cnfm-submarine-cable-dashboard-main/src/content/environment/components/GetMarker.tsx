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
  Divider
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

  // const customIcon = L.icon({
  //   iconUrl: "/static/images/overview/japan-flag-marker.png",
  //   iconSize: [32, 32],
  //   iconAnchor: [16, 32],
  // });

  const customIcon = (marker_type: string) => {
    return L.icon({
      iconUrl: marker_type === "EarthQuake" ? "/static/images/overview/red-marker.png" :"/static/images/overview/blue-marker.png",
      iconSize: [25, 25 ],
      iconAnchor: [16, 32],
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
    },
  });

  const {mutate: updateMarkerMutation, isPending: isUpdating} = useMutation({
    mutationFn: updateMarker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markerData'] });
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
      confirmButtonText: 'Yes, reset',
      cancelButtonText: 'Cancel'
    });
    if(!confirm.isConfirmed) return;

    try {
      deleteMarkerMutation(id);
      map.setView([18, 134], 4);
      await Swal.fire('Deleted Marker', 'The marker has been Successfully deleted.', 'success');

    } catch (error) {
      console.error('Error deleting marker:', error);
    }
  }

  type MarkerType = {
    id: number;
    latitude: number;
    longitude: number;
    marker_type: string;
  };
  // Edit Mutation for markers
  const handleEditMarker = (marker: MarkerType) => {
    setSelectedMarker(marker);
    setEditLat(marker.latitude.toString());
    setEditLng(marker.longitude.toString());
    setEditType(marker.marker_type);
    setOpenEdit(true);
  };

  const handleSubmitEdit = async () => {
  try {
    if (!selectedMarker) return;

    const updatedMarker : MarkerType = {
      id: selectedMarker.id,
      latitude: parseFloat(editLat),
      longitude: parseFloat(editLng),
      marker_type: editType,
    };

    // Check if there is no change in any field
    if (
      updatedMarker.latitude === selectedMarker.latitude &&
      updatedMarker.longitude === selectedMarker.longitude &&
      updatedMarker.marker_type === selectedMarker.marker_type
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
    await Swal.fire('Updated Marker', 'The marker has been Successfully updated.', 'success');


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
                {hovered.latitude}
              </Typography>

              <Typography fontSize="12px" color="text.secondary" mt={1}>
                Longitude:
              </Typography>
              <Typography fontSize="13px" fontWeight={500}>
                {hovered.longitude}
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
            onChange={(e) => setEditLat(e.target.value)}
            fullWidth
          />

          <TextField
            label="Enter Longitude"
            type="number"
            value={editLng}
            onChange={(e) => setEditLng(e.target.value)}
            fullWidth
          />

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
    </>
  );
}