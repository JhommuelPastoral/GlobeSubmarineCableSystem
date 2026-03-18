import { useMap, Marker } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

// ---------------------------
// Props
// ---------------------------
export interface MarkerButtonProps {
  open: boolean;
  onClose: () => void;
}

// ---------------------------
// Marker Dialog
// ---------------------------
function MarkerDialog({ open, onClose, onAddMarker }: MarkerButtonProps & { onAddMarker: any }) {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [markerType, setMarkerType] = useState('');
  const map = useMap();
  const handleSubmit = () => {
    let lat = parseFloat(latitude);
    let lng = parseFloat(longitude);
    // if (lng > 180) lng = lng - 360;
    if (lng < 0) lng = lng + 360;
    console.log('Adding marker:', lat, lng, markerType);
    if (!markerType || isNaN(lat) || isNaN(lng)) return;
    try {
      onAddMarker({ latitude: lat, longitude: lng, markerType });
      map.flyTo([lat, lng], 6, {
        duration: 1.5,
        easeLinearity: 0.25
      });
      setLatitude('');
      setLongitude('');
      setMarkerType('');
    } catch (error) {
      console.error('Error adding marker:', error);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h5">Simulate Marker</Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Latitude"
            type="number"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            fullWidth
          />
          <TextField
            label="Longitude"
            type="number"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            fullWidth
          />
          <TextField
            label="Marker Type"
            select
            value={markerType}
            onChange={(e) => setMarkerType(e.target.value)}
            fullWidth
          >
            <MenuItem value="" disabled>Select Marker Type</MenuItem>
            <MenuItem value="Cable Crossing">Cable Crossing</MenuItem>
            <MenuItem value="EarthQuake">EarthQuake</MenuItem>
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!markerType}
        >
          Add Marker
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------------------------
// Marker Button + Map Logic
// ---------------------------
const MarkerButton = () => {
  const [open, setOpen] = useState(false);
  const map = useMap();
  const queryClient = useQueryClient();

  // ---------------------------
  // Mutation (all in this file)
  // ---------------------------
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost';
  const port = process.env.REACT_APP_PORT || ':8081';

  const addMarkerMutation = useMutation({
    mutationFn: async (marker: { latitude: number; longitude: number; markerType: string }) => {
      const res = await fetch(`${baseUrl}${port}/add-marker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(marker),
      });
      if (!res.ok) throw new Error('Failed to add marker');
      return res.json();
    },
    onSuccess: (data, variables) => {
      // invalidate queries if needed
      // map.flyTo(
      //   [parseFloat(data.latitude), parseFloat(data.longitude)], 
      //   10,
      //   {
      //     duration: 0.5, // default is ~1.0–1.5 → lower = faster
      //   }
      // ); 
      console.log('Marker added:');
      queryClient.invalidateQueries({ queryKey: ['markerData'] });
    },
  });

  const handleAddMarker = (marker: { latitude: number; longitude: number; markerType: string }) => {
    addMarkerMutation.mutate(marker);
  };

  // ---------------------------
  // Custom Button on Map
  // ---------------------------
  useEffect(() => {
    map.attributionControl.remove();
    const handleClickOpen = () => setOpen(true);

    const customControl = L.control({ position: 'bottomright' });

    customControl.onAdd = () => {
      const container = L.DomUtil.create('div');
      const button = document.createElement('button');
      button.innerHTML = `
      <div style="
        display:flex;
        align-items:center;
        justify-content:center;
        gap:8px;
      ">
        <span>Add Marker</span>
      </div>
      `;
      button.style.backgroundColor = 'green';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '10px';
      button.style.width = '200px';
      button.style.height = '44px';
      button.style.cursor = 'pointer';
      button.style.color = 'white';
      button.style.fontWeight = 'bold';
      button.onclick = handleClickOpen;

      container.appendChild(button);
      return container;
    };

    customControl.addTo(map);
    return () => map.removeControl(customControl);
  }, [map]);




  return (
    <>
      <MarkerDialog
        open={open}
        onClose={() => setOpen(false)}
        onAddMarker={handleAddMarker}
      />


    </>
  );
};

export default MarkerButton;