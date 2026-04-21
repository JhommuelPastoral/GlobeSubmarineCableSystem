import { useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';

import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import { Marker } from 'react-leaflet';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
// Dialog Props
export interface Fobn1DialogProps {
  open: boolean;
  onClose: (value?: string) => void;
}

// Segment type
type SegmentData = {
  id: string;
  label: string;
  start: string;
  end: string;
  endpoint: string;
};

// Segment list
const SEGMENTS: SegmentData[] = [
  { id: 'S1', label: 'S1 | Nasugbu - Mamburao', start: 'Nasugbu', end: 'Mamburao', endpoint: '/nasugbo_mamburao' },
  { id: 'S2', label: 'S2 | San Jose - Mamburao', start: 'San Jose', end: 'Mamburao', endpoint: '/san_jose_mamburao' },
  { id: 'S3', label: 'S3 | San Jose - Roxas', start: 'San Jose', end: 'Roxas', endpoint: '/san_jose_roxas' },
  { id: 'S4', label: 'S4 | Cadiz - Roxas', start: 'Cadiz', end: 'Roxas', endpoint: '/cadiz_roxas' },
  { id: 'S5', label: 'S5 | San Remigio - Cadiz', start: 'San Remigio', end: 'Cadiz', endpoint: '/san_remigio_cadiz' },
  { id: 'S6', label: 'S6 | San Remigio - Lilo', start: 'San Remigio', end: 'Lilo', endpoint: '/san_remigio_lilo' },
  { id: 'S7', label: 'S7 | Bacong - Talisay', start: 'Bacong', end: 'Talisay', endpoint: '/bacong_talisay' },
  { id: 'S8', label: 'S8 | Bacong - Manticao', start: 'Bacong', end: 'Manticao', endpoint: '/bacong_maticao' }
];

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost';
const port = process.env.REACT_APP_PORT || ':8081';

// ---------------------------
// Haversine Helpers
// ---------------------------
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => deg * (Math.PI / 180);

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.asin(Math.sqrt(a));

  return R * c;
}

function getTotalDistance(route: number[][]) {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += haversineDistance(route[i][0], route[i][1], route[i + 1][0], route[i + 1][1]);
  }
  return total;
}

// Returns the nearest lat/lng for a given distance along the route
// function findNearestPoint(route: number[][], distanceKm: number) {
//   if (route.length === 0) return null;

//   let accumulated = 0;

//   for (let i = 0; i < route.length - 1; i++) {
//     const segmentDist = haversineDistance(route[i][0], route[i][1], route[i + 1][0], route[i + 1][1]);
//     if (accumulated + segmentDist >= distanceKm) {
//       // The cut point is somewhere in this segment
//       // Decide which point is closer
//       const distToStart = Math.abs(distanceKm - accumulated);
//       const distToEnd = Math.abs(distanceKm - (accumulated + segmentDist));
//       return distToStart <= distToEnd
//         ? { lat: route[i][0], lng: route[i][1] }
//         : { lat: route[i + 1][0], lng: route[i + 1][1] };
//     }
//     accumulated += segmentDist;
//   }

//   // If distance > total route length, return last point
//   const last = route[route.length - 1];
//   return { lat: last[0], lng: last[1] };
// }
function findNearestPoint(route: number[][], distanceKm: number) {
  if (route.length === 0) return null;

  let accumulated = 0;

  for (let i = 0; i < route.length - 1; i++) {
    const segmentDist = haversineDistance(
      route[i][0], route[i][1],
      route[i + 1][0], route[i + 1][1]
    );

    if (accumulated + segmentDist >= distanceKm) {

      const ratio = (distanceKm - accumulated) / segmentDist;

      const lat =
        route[i][0] + ratio * (route[i + 1][0] - route[i][0]);

      const lng =
        route[i][1] + ratio * (route[i + 1][1] - route[i][1]);

      return { lat, lng };
    }

    accumulated += segmentDist;
  }

  const last = route[route.length - 1];
  return { lat: last[0], lng: last[1] };
}
// function findCableType({lat, lng, rawData}: {lat: number, lng: number, rawData: any}): string {

//   const cableType = rawData.find((item: any) => {
//     const itemLat = Number(item.latitude) + Number(item.latitude1);
//     const itemLng = Number(item.longitude) + Number(item.longitude1);
//     return Math.abs(itemLat - lat) < 1 && Math.abs(itemLng - lng) < 1;
//   });
//   return cableType ? cableType.cable_type : 'Unknown';
// }

function findCableType({
  lat,
  lng,
  rawData,
}: {
  lat: number;
  lng: number;
  rawData: any[];
}): string {
  if (!rawData || rawData.length === 0) return 'Unknown';

  let closestItem = null;
  let minDistance = Infinity;

  for (const item of rawData) {
    if(item.latitude === null || item.latitude1 === null || item.longitude === null || item.longitude1 === null) continue;
    const itemLat = Number(item.latitude) + Number(item.latitude1);
    const itemLng = Number(item.longitude) + Number(item.longitude1);

    const distance = haversineDistance(lat, lng, itemLat, itemLng);

    if (distance < minDistance) {
      minDistance = distance;
      closestItem = item;
    }
  }
  console.log('Distance to nearest point:', minDistance, 'km', closestItem);
  return closestItem?.cable_type || 'Unknown';
}

function findNearestDepth({
  lat,
  lng,
  rawData,
}: {
  lat: number;
  lng: number;
  rawData: any[];
}): number {
  if (!rawData || rawData.length === 0) return 0;

  let closestItem = null;
  let minDistance = Infinity;

  for (const item of rawData) {
    if(item.latitude === null || item.latitude1 === null || item.longitude === null || item.longitude1 === null) continue;
    const itemLat = Number(item.latitude) + Number(item.latitude1);
    const itemLng = Number(item.longitude) + Number(item.longitude1);

    const distance = haversineDistance(lat, lng, itemLat, itemLng);

    if (distance < minDistance) {
      minDistance = distance;
      closestItem = item;
    }
  }
  return closestItem?.corr_depth ?? closestItem?.core_depth ?? 100;
}
// ---------------------------
// Dialog Component
// ---------------------------
function Fobn1Dialog({ open, onClose }: Fobn1DialogProps) {
  const [startSegment, setStartSegment] = useState<string>('');
  const [endSegment, setEndSegment] = useState<string>('');
  const [startPosition, setStartPosition] = useState<string>('');
  const [endpoint, setEndpoint] = useState<string>('');
  const [rawData, setRawData] = useState<any>();
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [cutDistance, setCutDistance] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [faultDate, setFaultDate] = useState<string>('');
  const [cutPoint, setCutPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [faultTime, setFaultTime] = useState<string>('');
  const [cutType, setCutType] = useState<string>('');
  const [position, setPosition] = useState<number[][]>([]);
  const [cable, setCable] = useState<string>('');
  const [direction, setDirection] = useState<'forward' | 'reverse'>('forward');
  const map = useMap();
  const [depth, setDepth] = useState(0);
  // const handleChangeCutDistance = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const value = e.target.value; 
  //   setCutDistance(value);

  //   const num = Number(value);
  //   if (value === '' || isNaN(num)) {
  //     setError('');
  //     return;
  //   }

  //   if (num <= 0) {
  //     setError('Distance must be greater than 0');
  //   } else if (num > totalDistance) {
  //     setError(`Distance cannot exceed total distance (${totalDistance.toFixed(2)} km)`);
  //   } else {
  //     setError('');
  //   }
  //   const nearest = findNearestPoint(position, num);
  //   setCutPoint(nearest);
  //   setCable(findCableType({lat: nearest?.lat || 0, lng: nearest?.lng || 0, rawData}));

  // };
  const handleChangeCutDistance = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!rawData) return;

    const value = e.target.value;
    setCutDistance(value);
    
    const num = Number(value);
    if (value === '' || isNaN(num)) {
      setError('');
      return;
    }

    if (num <= 0) setError('Distance must be greater than 0');
    else if (num > totalDistance) setError(`Distance cannot exceed total distance (${totalDistance.toFixed(2)} km)`);
    else setError('');
    if(direction === 'reverse') {
      const reversedPosition = [...position].reverse();
      const reversedRawData = [...rawData].reverse();
      const nearest = findNearestPoint(reversedPosition, num);
      setCutPoint(nearest);
      setCable(findCableType({lat: nearest?.lat || 0, lng: nearest?.lng || 0, rawData: reversedRawData}));
      setDepth(findNearestDepth({lat: nearest?.lat || 0, lng: nearest?.lng || 0, rawData: reversedRawData}));
      
    }
    else{
      const nearest = findNearestPoint(position, num);
      setCutPoint(nearest);
      setCable(findCableType({lat: nearest?.lat || 0, lng: nearest?.lng || 0, rawData}));
      setDepth(findNearestDepth({lat: nearest?.lat || 0, lng: nearest?.lng || 0, rawData: rawData}));
    }
  };

  const handleStartChange = (value: string) => {
    setStartSegment(value);
    const segment = SEGMENTS.find((s) => s.id === value);
    setEndSegment(segment?.end || '');
    setEndpoint(segment?.endpoint || '');
    setStartPosition(segment?.start || '');
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!endpoint) return;

      try {
        const response = await fetch(`${apiBaseUrl}${port}${endpoint}`);
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.status}`);

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
            let lat = Number(item.latitude) + Number(item.latitude1);
            lat = Math.round(lat * 10000) / 10000;
            let lng = Number(item.longitude) + Number(item.longitude1);
            lng = Math.round(lng * 10000) / 10000;
            return [lat, lng];
          });
        setRawData(result);
        setPosition(formatted);
        setTotalDistance(getTotalDistance(formatted));
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [endpoint, direction]);

  const handleSubmit = () => {
    try {
      const submitData = {
        cut_id: `${startPosition}-${endSegment}-${Math.floor(Math.random() * 100000)}`,
        distance: cutDistance,
        cut_type: cutType,
        fault_date: `${faultDate}T${faultTime}`,
        simulated: `${faultDate}T${faultTime}`,
        latitude: cutPoint?.lat || 0,
        longitude: cutPoint?.lng || 0,
        depth: depth,
        cable_type: cable,
        point_a: direction === "reverse" ? endSegment : startPosition,
        point_b: direction === "reverse" ? startPosition : endSegment
      };

      fetch(`${apiBaseUrl}${port}/cable_cuts_phil`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })
        .then((response) => response.json())
        .then((result) => {
          // Set to default values
          resetForm();
          onClose();  
          map.flyTo(
            [cutPoint?.lat || 0, cutPoint?.lng || 0],
            10,
            {
              duration: 0.5, // default is ~1.0–1.5 → lower = faster
            }
          );          
          // window.location.reload(); // Reload to show updated data
        })
        .catch((error) => {
          console.error("Error submitting cable cut data:", error);
          alert("Failed to submit cable cut data.");
        });
    } catch (error) {
      console.error("Error preparing cable cut data:", error);
    }
  };
    const resetForm = () => {
      setStartSegment('');
      setEndSegment('');
      setCutDistance('');
      setCutType('');
      setFaultDate('');
      setFaultTime('');
      setCutPoint(null);
      setCable('');
      setTotalDistance(0);
      setDirection('forward');
    };
    const handleCloseDialog = () => {
      resetForm();
      onClose();
    };
  return (
    <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ mt: 2 }}>
        <Typography variant="h5">Simulate FOBN1 Cable Fault</Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Point A */}
          <FormControl fullWidth>
            <InputLabel id="start-seg-label">Point A</InputLabel>
            <Select
              labelId="start-seg-label"
              label="Point A"
              value={startSegment}
              onChange={(e) => handleStartChange(e.target.value as string)}
            >
              <MenuItem value="" disabled>Select Point A</MenuItem>
              {SEGMENTS.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Point B (disabled, auto-set) */}
          {/* <FormControl fullWidth>
            <InputLabel id="end-seg-label">Point B</InputLabel>
            <Select labelId="end-seg-label" label="Point B" value={endSegment} disabled>
              <MenuItem value={endSegment}>{endSegment || 'Select Point A first'}</MenuItem>
            </Select>
          </FormControl> */}
          <TextField
            label="Direction"
            select
            value={direction }
            disabled={!startSegment || !endSegment}
            onChange={(e) => setDirection(e.target.value as any)}
          >
            <MenuItem value="forward">
              {startPosition && endSegment ? `${startPosition} → ${endSegment}` : 'Select segments'}
            </MenuItem>
            <MenuItem value="reverse">
              {startPosition && endSegment ? `${endSegment} → ${startPosition}` : 'Select segments'}
            </MenuItem>
          </TextField>
          <TextField
            label="Enter distance (km)"
            type="number"
            value={cutDistance}
            onChange={handleChangeCutDistance} // directly pass handler
            error={!!error}
            helperText={error}
            inputProps={{ min: 0.01, max: totalDistance, step: 0.01 }}
            fullWidth
            />

          {/* Total Distance Display */}
          {totalDistance > 0 && (
            <Typography variant="subtitle1">
              Max Distance: {totalDistance.toFixed(2)} km
            </Typography>
          )}
          <TextField
            label="Fault Date"
            type="date"
            value={faultDate}
            onChange={(e) => setFaultDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Fault Time"
            type="time"
            value={faultTime}
            onChange={(e) => setFaultTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Cut Type"
            select
            value={cutType}
            onChange={(e) => setCutType(e.target.value)}
          >
            <MenuItem value="" disabled>
              Select cut type
            </MenuItem>
            <MenuItem value="Partial Fiber Break">
              Partial Fiber Break
            </MenuItem>
            <MenuItem value="Fiber Break">Fiber Break</MenuItem>
            <MenuItem value="Full Cut">Full Cut</MenuItem>
            <MenuItem value="For Verification">For Verification</MenuItem>
          </TextField>


        </Box>
      </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={!startSegment || !endSegment || !cutDistance || !!error || !faultDate || !faultTime || !cutType}
          >
            {/* {submitting ? 'Saving...' : 'Cut Cable'} */}
            Cut Cable
          </Button>
        </DialogActions>
    </Dialog>
  );
}

// ---------------------------
// Button on the Map
// ---------------------------
const Fobn1Button = () => {
  const [open, setOpen] = useState(false);
  const map = useMap();

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    map.attributionControl.remove();

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
        <svg xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="white"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round">
          <circle cx="6" cy="6" r="3"></circle>
          <circle cx="6" cy="18" r="3"></circle>
          <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
          <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
          <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
        </svg>
        <span>CUT - FOBN1</span>
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
      <Fobn1Dialog open={open} onClose={handleClose} />; 
    </>
  );

};

export default Fobn1Button;