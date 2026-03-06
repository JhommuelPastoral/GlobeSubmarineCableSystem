import {
  Box,
  Button,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import React, { useState } from 'react';
import CableIcon from '@mui/icons-material/Cable';
import { CloudUpload } from '@mui/icons-material';
import Swal from 'sweetalert2';


const SegmentUpdate = () => {
  const [open, setOpen] = useState(false);
  const [selectedCable, setSelectedCable] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const port = process.env.REACT_APP_PORT;

  // Cable data matching your database naming
  const cables = [
    { id: 'sea-us', name: 'SEA-US Submarine Cable' },
    { id: 'sjc', name: 'Southeast Asia-Japan Cable (SJC)' },
    { id: 'tgnia', name: 'Tata TGN-Intra Asia (TGN-IA)' },
    { id: 'fobn1', name: 'FOBN1 Submarine Cable' },
    { id: 'fobn2', name: 'FOBN2 Submarine Cable' },
    { id: 'ndtn', name: 'NDTN  Submarine Cable' }
  ];

  // Segments data matching your database table names
  const getSegmentsForCable = (cableId) => {
    const segmentMap = {
      'sea-us': [
        { id: 's1', name: 'Kauditan, Indonesia - BU (Segment 1)' },
        { id: 's2', name: 'Davao, Philippines - BU (Segment 2)' },
        { id: 's3', name: 'Piti, Guam - BU Davao (Segment 3)' },
        { id: 's4', name: 'Piti, Guam - BU Hawaii (Segment 4)' },
        { id: 's5', name: 'Makaha, Hawaii - BU (Segment 5)' },
        { id: 's6', name: 'BMH - BU2 (Segment 6)' }
      ],
      sjc: [
        { id: 's1', name: 'Segment 1' },
        { id: 's3', name: 'Segment 3' },
        { id: 's4', name: 'Segment 4' },
        { id: 's5', name: 'Segment 5' },
        { id: 's6', name: 'Segment 6' },
        { id: 's7', name: 'Segment 7' },
        { id: 's8', name: 'Segment 8' },
        { id: 's9', name: 'Segment 9' },
        { id: 's10', name: 'Segment 10' },
        { id: 's11', name: 'Segment 11' },
        { id: 's12', name: 'Segment 12' },
        { id: 's13', name: 'Segment 13' }
      ],
      tgnia: [
        { id: 's1', name: 'Segment 1' },
        { id: 's2', name: 'Segment 2' },
        { id: 's3', name: 'Segment 3' },
        { id: 's4', name: 'Segment 4' },
        { id: 's5', name: 'Segment 5' },
        { id: 's6', name: 'Segment 6' },
        { id: 's7', name: 'Segment 7' },
        { id: 's8', name: 'Segment 8' },
        { id: 's9', name: 'Segment 9' },
        { id: 's10', name: 'Segment 10' },
        { id: 's11', name: 'Segment 11' },
        { id: 's12', name: 'Segment 12' }
      ],
      fobn1: [
        { id: 's1', name: 'Nasugbo-Mamburao' },
        { id: 's2', name: 'San Jose-Mamburao' },
        { id: 's3', name: 'San Jose-Roxas' },
        { id: 's4', name: 'Cadiz-Roxas' },
        { id: 's5', name: 'San Remigio-Cadiz' },
        { id: 's6', name: 'San Remigio-Lilo' },
        { id: 's7', name: 'Bacong-Talisay' },
        { id: 's8', name: 'Bacong-Maticao' },
      ],
      fobn2:[
        {id: 's1', name: 'Legaspi-Calbayog'},
        {id: 's2', name: 'Duero-Maasin'},
        {id: 's3', name: 'Potuhan-Talisay'},
        {id: 's4', name: 'Maasin-Cabadbaran'},
        {id: 's5', name: 'Banate-Bacolod'},
        {id: 's6', name: 'Capoocan-Calbayog'},

      ],
      ndtn: [
        {id: 's1' , name: 'Boracay-Caticlan'},
        {id: 's2' , name: 'Taytay-Bu'},
        {id: 's3' , name: 'Bu-San Jose'},
        {id: 's4' , name: 'Bu-Coron'},
        {id: 's5' , name: 'Dalahican-Mansalay'},
        {id: 's6' , name: 'Mansalay-Hamtik'},
        {id: 's7' , name: 'Hamtik-Tigbaunan'},
        {id: 's8' , name: 'Telicphil-Seg4'},
        {id: 's9' , name: 'Bacong-Bayawan'},
        {id: 's10', name: 'Telicphil-Seg6'},
        {id: 's11', name: 'Telicphil-Seg7'},
      ]
      
    };
    return segmentMap[cableId] || [];
  };

  const handleCableChange = (event) => {
    setSelectedCable(event.target.value);
    setSelectedSegment(''); // Reset segment when cable changes
    setSelectedFile(null); // Reset file when cable changes
  };

  const handleSegmentChange = (event) => {
    setSelectedSegment(event.target.value);
    setSelectedFile(null); // Reset file when segment changes
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Ensure it's a CSV file
    if (!file.name.endsWith('.csv')) {
      Swal.fire('Invalid file type', 'Only .csv files are allowed', 'error');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    // Validation
    setOpen(false);
    if (!selectedCable) {
      Swal.fire('Missing Selection', 'Please select a cable', 'warning');
      return;
    }

    if (!selectedSegment) {
      Swal.fire('Missing Selection', 'Please select a segment', 'warning');
      return;
    }

    if (!selectedFile) {
      Swal.fire(
        'Missing File',
        'Please select a CSV file to upload',
        'warning'
      );
      return;
    }

    setIsUploading(true);
    if(philMap.includes(selectedCable)) {
        try {
          const segment = getSegmentsForCable(selectedCable).find(segment => segment.id === selectedSegment)?.name;
          const lowerSegment = segment.toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');
          // Create FormData and upload to dynamic API endpoint
          const formData = new FormData();
          formData.append('file', selectedFile);
    
          const uploadUrl = `${apiBaseUrl}${port}/upload-rpl/${selectedCable}/${lowerSegment}`;
          console.log('Uploading to:', uploadUrl); // Debug log
    
          const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData
          });
    
          console.log('Response status:', response.status); // Debug log
          console.log('Response headers:', response.headers); // Debug log
    
          // Check if response is JSON
          const contentType = response.headers.get('content-type');
          let data;
    
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          } else {
            // If not JSON, get text response for debugging
            const textResponse = await response.text();
            console.log('Non-JSON response:', textResponse);
            throw new Error(`Server returned non-JSON response: ${textResponse}`);
          }
    
          console.log('Response data:', data); // Debug log
          if (response.ok) {
            await Swal.fire({
              title: 'Success!',
              text: `File uploaded successfully to ${data.tableName}. ${data.recordsInserted} records inserted.`,
              icon: 'success',
              confirmButtonText: 'OK'
            });
    
            // Reset form after successful upload
            setSelectedFile(null);
            handleClose();
    
            // Force a brief delay to allow database to fully commit the changes
            // before RPL components start fetching updated data
            setTimeout(() => {
              // Trigger a custom event to notify RPL components to refresh
              window.dispatchEvent(new CustomEvent('rplDataUpdated', {
                detail: {
                  cable: selectedCable,
                  segment: selectedSegment,
                  tableName: data.tableName
                }
              }));
            }, 1000);
          } else {
            throw new Error(
              data.message || `HTTP ${response.status}: Upload failed`
            );
          }
        } catch (err) {
          console.error('Upload error details:', err); // Enhanced debug log
    
          await Swal.fire({
            title: 'Upload Failed',
            text: 'Server error during upload.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        } finally {
          setIsUploading(false); // This ensures the loading state is reset regardless
        }

    }
    else{
        try {
          // Create FormData and upload to dynamic API endpoint
          const formData = new FormData();
          formData.append('file', selectedFile);
    
          const uploadUrl = `${apiBaseUrl}${port}/upload-rpl/${selectedCable}/${selectedSegment}`;
          console.log('Uploading to:', uploadUrl); // Debug log
    
          const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData
          });
    
          console.log('Response status:', response.status); // Debug log
          console.log('Response headers:', response.headers); // Debug log
    
          // Check if response is JSON
          const contentType = response.headers.get('content-type');
          let data;
    
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          } else {
            // If not JSON, get text response for debugging
            const textResponse = await response.text();
            console.log('Non-JSON response:', textResponse);
            throw new Error(`Server returned non-JSON response: ${textResponse}`);
          }
    
          console.log('Response data:', data); // Debug log
          if (response.ok) {
            await Swal.fire({
              title: 'Success!',
              text: `File uploaded successfully to ${data.tableName}. ${data.recordsInserted} records inserted.`,
              icon: 'success',
              confirmButtonText: 'OK'
            });
    
            // Reset form after successful upload
            setSelectedFile(null);
            handleClose();
    
            // Force a brief delay to allow database to fully commit the changes
            // before RPL components start fetching updated data
            setTimeout(() => {
              // Trigger a custom event to notify RPL components to refresh
              window.dispatchEvent(new CustomEvent('rplDataUpdated', {
                detail: {
                  cable: selectedCable,
                  segment: selectedSegment,
                  tableName: data.tableName
                }
              }));
            }, 1000);
          } else {
            throw new Error(
              data.message || `HTTP ${response.status}: Upload failed`
            );
          }
        } catch (err) {
          console.error('Upload error details:', err); // Enhanced debug log
    
          await Swal.fire({
            title: 'Upload Failed',
            text: 'Server error during upload.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        } finally {
          setIsUploading(false); // This ensures the loading state is reset regardless
        }

      
    }
  };

  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    if (!isUploading) {
      setOpen(false);
      setSelectedCable('');
      setSelectedSegment('');
      setSelectedFile(null);
    }
  };

  const philMap = ['fobn1', 'fobn2', 'ndtn'];

  // Get the target table name for display
  const getTargetTableName = () => {
    if (!selectedCable || !selectedSegment) return '';

    const cableMapping = {
      'sea-us': 'sea_us',
      sjc: 'sjc',
      tgnia: 'tgnia',
    };  
    if(philMap.includes(selectedCable)) {
      const segment = getSegmentsForCable(selectedCable).find(segment => segment.id === selectedSegment)?.name;
      const lowerSegment = segment.toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');
      return `${lowerSegment}`
    }

    return `${cableMapping[selectedCable]}_rpl_${selectedSegment}`;
  };

  return (
    <>
      <Button variant="outlined" startIcon={<CableIcon />} onClick={handleOpen}>
        RPL Update
      </Button>

      {/* Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h5">
            Route Position List Segment Update
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <CardContent>
            <Box sx={{ width: '100%' }}>
              {/* Cable Selection */}
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                gutterBottom
                sx={{ mb: 1 }}
              >
                Select Cable
              </Typography>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="cable-select-label">Choose a cable</InputLabel>
                <Select
                  labelId="cable-select-label"
                  value={selectedCable}
                  label="Choose a cable"
                  onChange={handleCableChange}
                  disabled={isUploading}
                >
                  {cables.map((cable) => (
                    <MenuItem key={cable.id} value={cable.id}>
                      {cable.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Segment Selection */}
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                gutterBottom
                sx={{ mb: 1 }}
              >
                Select Segment
              </Typography>
              <FormControl
                fullWidth
                sx={{ mb: 3 }}
                disabled={!selectedCable || isUploading}
              >
                <InputLabel id="segment-select-label">
                  Choose a segment
                </InputLabel>
                <Select
                  labelId="segment-select-label"
                  value={selectedSegment}
                  label="Choose a segment"
                  onChange={handleSegmentChange}
                >
                  {getSegmentsForCable(selectedCable).map((segment) => (
                    <MenuItem key={segment.id} value={segment.id}>
                      {segment.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Target Table Display */}
              {selectedCable && selectedSegment && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Target Database Table:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    {getTargetTableName()}
                  </Typography>
                </Box>
              )}

              {/* File Upload */}
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                gutterBottom
                sx={{ mb: 1 }}
              >
                Choose File
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<CloudUpload />}
                  sx={{ mb: 1 }}
                  disabled={!selectedCable || !selectedSegment || isUploading}
                >
                  Upload RPL File
                  <input
                    hidden
                    type="file"
                    onChange={handleFileChange}
                    accept=".csv"
                  />
                </Button>
                {selectedFile && (
                  <Typography variant="body2" color="text.secondary">
                    Selected: {selectedFile.name}
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
            color="secondary"
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            color="primary"
            variant="contained"
            disabled={
              !selectedCable || !selectedSegment || !selectedFile || isUploading
            }
          >
            {isUploading ? 'Uploading...' : 'Upload & Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SegmentUpdate;
