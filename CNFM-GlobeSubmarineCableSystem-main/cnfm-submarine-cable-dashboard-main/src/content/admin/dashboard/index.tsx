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
import ArticleIcon from '@mui/icons-material/Article';
import {useActivityLogs} from 'src/hooks/useApi';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';

function AdminDashboard() {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const port = process.env.REACT_APP_PORT;
  const fileInputRef = React.useRef(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [openLogs, setOpenLogs] = useState(false);

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
  const { data: activityLogs } = useActivityLogs();
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
                    alignItems: 'stretch',
                    width: 180,
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
                      px:2
                    }}
                  >
                    New Data
                  </Button>


                  <SegmentUpdate />
                  <Button
                    variant="contained"
                    onClick={() => setOpenLogs(true)}
                    startIcon={<ArticleIcon/>}
                    sx={{
                      px:2
                    }}
                  >
                    Access History
                  </Button>

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
      <Dialog
        open={openLogs}
        onClose={() => setOpenLogs(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Access History
          <IconButton
            onClick={() => setOpenLogs(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Activity</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {activityLogs?.map((log, index) => (
                <TableRow key={index}>
                  <TableCell>{log.user_fname} {log.user_lname}</TableCell>
                  <TableCell>{log.user_email}</TableCell>
                  <TableCell>{log.user_role}</TableCell>
                  <TableCell>{log.activity}</TableCell>
                  <TableCell>{log.access_at}</TableCell>
                  <TableCell>{log.access_time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenLogs(false)}>Close</Button>
        </DialogActions>
      </Dialog>      
    </>
  );
}

export default AdminDashboard;