import React from 'react';
import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import {changeSimulator} from 'src/store/store'
import Swal from 'sweetalert2';

const ResetButton = () => {
  const map = useMap();
  const {nav, onChangeNav} = changeSimulator(); 
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const port = process.env.REACT_APP_PORT;


  const handleReset = async () => {
    const confirm = await Swal.fire({
      title: 'Reset simulation?',
      text: 'This will remove all simulated cable cuts.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, reset',
      cancelButtonText: 'Cancel'
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await fetch(`${apiBaseUrl}${port}/delete-cable-cuts`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok) {
        await Swal.fire('Reset complete', 'Simulation has been cleared.', 'success');
        window.location.reload();
      } else {
        throw new Error(result.message || 'Failed to clear data');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong';
      Swal.fire('Error!', message, 'error');
    }
  };  
  useEffect(() => {
    // Remove default attribution control
    map.attributionControl.remove();

    // Create custom control
    const customControl = L.control({
      position: 'bottomright'
    });

    // Add the custom control to the map
    customControl.onAdd = function () {
      const container = L.DomUtil.create('div');

      // Use React DOM to create the button
      const renderButton = () => {
        // Create the container for the button
        const buttonContainer = document.createElement('div');
        buttonContainer.style.borderRadius = '4px';
        buttonContainer.style.padding = '3px';

        // Create the actual button
        const button = document.createElement('button');
        button.innerHTML = `
          <span style="display: flex; align-items: center; justify-content: center; gap: 5px;">
            <span>Reset Simulation</span>
          </span>
        `;

        // Style the button like Material UI contained button
        button.style.backgroundColor = 'Gray'; // Primary color
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '10px';
        button.style.width = '200px';
        button.style.height = '44px';
        button.style.fontSize = '13px';
        button.style.fontWeight = '500';
        button.style.fontFamily = '"Roboto", "Helvetica", "Arial", sans-serif';
        button.style.textTransform = 'uppercase';
        button.style.cursor = 'pointer';
        button.style.boxShadow =
          '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)';
        button.style.fontWeight = 'bold';
        // Add hover effect
        button.onmouseover = function () {
          button.style.backgroundColor = 'red'; // Darker primary color
          button.style.fontWeight = '700';
        };

        button.onmouseout = function () {
          button.style.backgroundColor = 'Gray'; // Back to primary color
          button.style.fontWeight = '500';

        };

        // Add click behavior
        button.onclick = function () {
          handleReset();
        };

        buttonContainer.appendChild(button);
        return buttonContainer;
      };

      container.appendChild(renderButton());
      return container;
    };

    customControl.addTo(map);

    return () => {
      map.removeControl(customControl);
    };
  }, [map]);

  // This component doesn't render anything directly
  return null;
};

export default ResetButton;
