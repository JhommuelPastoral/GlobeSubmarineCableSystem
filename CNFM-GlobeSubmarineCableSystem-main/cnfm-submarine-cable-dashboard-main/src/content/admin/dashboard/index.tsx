import { Helmet } from 'react-helmet-async';
import {
  Card,
  Box,
  Grid,
  Typography,
  Container,
  Button,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Swal from 'sweetalert2';
import CableMap from '../components/CableMap';
import React, { useEffect, useState, useCallback } from 'react';
import SegmentUpdate from './SegmentUpdate';

function AdminDashboard() {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const port = process.env.REACT_APP_PORT;
  const fileInputRef = React.useRef(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchLastUpdate = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}${port}/latest-update`);
      const data = await response.json();

      if (data?.update?.date_time && data.update.file_name) {
        const fileName = data.update.file_name;
        const displayName = fileName.replace(/\.?csv$/i, '');
        setLastUpdate(displayName);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error fetching latest update:', err);
      return false;
    }
  }, [apiBaseUrl, port]);

  const handleNewDataClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      Swal.fire('Invalid file type', 'Only .csv files are allowed', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${apiBaseUrl}${port}/upload-csv`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        await Swal.fire('Success', 'File uploaded successfully', 'success');

        setTimeout(async () => {
          await fetchLastUpdate();
        }, 1500);
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err) {
      Swal.fire('Upload failed', err.message, 'error');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    fetchLastUpdate();
  }, [fetchLastUpdate]);

  return (
    <>
      <Helmet>
        <title>Main Dashboard</title>
      </Helmet>

      {/* FULL WIDTH */}
      <Container maxWidth={false} disableGutters>

        <Grid container spacing={0}>
          <Grid item xs={12}>

            {/* REMOVE ROUNDED EDGES FOR FULL BLEED */}
            <Card sx={{ borderRadius: 0 }}>

              {/* RELATIVE WRAPPER */}
              <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>

                <CableMap />

                <Box
                  sx={{
                    position: 'absolute',
                    top: 120,
                    right: 10,
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    alignItems: 'center'
                  }}
                >
                  {/* <Typography variant="body2" sx={{ color: '#fff' }}>
                    {lastUpdate ? `Source: ${lastUpdate}` : ''}
                  </Typography> */}

                  <Button
                    variant="contained"
                    startIcon={<UploadFileIcon />}
                    onClick={handleNewDataClick}
                    sx={{
                      px:4
                    }}
                  >
                    New Data
                  </Button>

                  <SegmentUpdate />

                  <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </Box>

              </Box>

            </Card>

          </Grid>
        </Grid>

      </Container>
    </>
  );
}

export default AdminDashboard;