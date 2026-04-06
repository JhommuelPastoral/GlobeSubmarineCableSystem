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
import { Snackbar, Alert } from '@mui/material';

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
  const [latDir, setLatDir] = useState<'N' | 'S'>('N');
  const [lngDir, setLngDir] = useState<'E' | 'W'>('E');
  const [latError, setLatError] = useState('');
  const [lngError, setLngError] = useState('');

  const [magnitude, setMagnitude] = useState(0);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [text, setText] = useState("");

  const handleSubmit = () => {
    let lat = parseFloat(latitude);
    let lng = parseFloat(longitude);
    if (latDir === 'S') {lat = -lat};
    if (lngDir === 'W') {lng = 360 - lng};
    // if(lat > 180) lat = lat - 180;
    // if (!markerType || isNaN(lat) || isNaN(lng)) return;
    // // console.log('Adding marker:', lat, lng, markerType, latDir, lngDir);
    // if(markerType === "EarthQuake"){
    //   if(!magnitude || !date || !time) return;
    // }
    // if(markerType === "Cable Crossing"){
    //   if(!text) return;
    // }

    try {
      onAddMarker({ latitude: lat, longitude: lng, markerType, latDir, lngDir, magnitude, date, time, text });
      map.flyTo([lat, lng], 6, {
        duration: 1.5,
        easeLinearity: 0.25
      });
      setLatitude('');
      setLongitude('');
      setMarkerType('');
      setLatDir('N');
      setLngDir('E');
      setMagnitude(0);
      setDate('');
      setTime('');
      setText('');
    } catch (error) {
      console.error('Error adding marker:', error);
    }
    onClose();
  };

  const handleChangeLatitude = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if(value > 90){
      setLatitude('90');
      setLatError('Latitude cannot be greater than 90');
    }
    else{
      setLatitude(e.target.value);
      setLatError('');
    }
  }
  const handleChangeLongitude = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if(value > 360){
      setLongitude('360');
      setLngError('Longitude cannot be greater than 360');
    }
    else{
      setLongitude(e.target.value);
      setLngError('');
    }
  }
  const isEarthquakeInvalid =
    markerType === "EarthQuake" &&
    (!magnitude || !date || !time);

  const isTextInvalid =
    (markerType === "Cable Crossing" || markerType === "Others") &&
    text.trim().length === 0;

  const isLocationInvalid =
    !latitude || !longitude || !latDir || !lngDir || !markerType;

  const isDisabled =
    isEarthquakeInvalid ||
    isTextInvalid ||
    isLocationInvalid;
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
            onChange={handleChangeLatitude}
            error={latError !== ''}
            helperText={latError}
            onKeyDown={(e) => {
              if (e.key === '-') e.preventDefault();
              if(e.key === '+') e.preventDefault();
            }}
            InputProps={{ inputProps: { min: 0, max: 90 } }}
            fullWidth
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
            label="Longitude"
            type="number"
            value={longitude}
            onChange={handleChangeLongitude}
            error={lngError !== ''}
            helperText={lngError}
            onKeyDown={(e) => {
              if (e.key === '-') e.preventDefault();
              if(e.key === '+') e.preventDefault();
            }}
            InputProps={{ inputProps: { min: 0, max: 360 } }}
            fullWidth
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
            value={markerType}
            onChange={(e) => setMarkerType(e.target.value)}
            fullWidth
          >
            <MenuItem value="" disabled>Select Marker Type</MenuItem>
            <MenuItem value="Cable Crossing">Cable Crossing</MenuItem>
            <MenuItem value="EarthQuake">EarthQuake</MenuItem>
            <MenuItem value="Others">Others</MenuItem>

          </TextField>
          {markerType === 'EarthQuake' && (
            <>
              <TextField
                label="Event Date"
                type="date"
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Event Time"
                type="time"
                onChange={(e) => setTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Magnitude"
                type="number"
                value={magnitude}
                onChange={(e) => setMagnitude(parseFloat(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === '-') e.preventDefault();
                  if(e.key === '+') e.preventDefault();
                }}
                fullWidth
              />
            </>
          )}
          {(markerType === 'Cable Crossing' || markerType === 'Others') && (
            <TextField
              label="Reason"
              type='text'
              value={text}
              onChange={(e) => setText(e.target.value)}
              fullWidth
            ></TextField>            
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isDisabled}
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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });
  // ---------------------------
  // Mutation (all in this file)
  // ---------------------------
  const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost';
  const port = process.env.REACT_APP_PORT || ':8081';

  const addMarkerMutation = useMutation({
    mutationFn: async (marker: { latitude: number; longitude: number; markerType: string, latDir: string, lngDir: string, magnitude, date, time, text }) => {
      const res = await fetch(`${baseUrl}${port}/add-marker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(marker),
      });
      if (!res.ok) throw new Error('Failed to add marker');
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['markerData'] });
      setSnackbar({
        open: true,
        message: 'The marker has been successfully added.',
        severity: 'success',
      });
    },
  });

  const handleAddMarker = (marker: { latitude: number; longitude: number; markerType: string, latDir: string, lngDir: string, magnitude, date, time, text}) => {
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
};

export default MarkerButton;