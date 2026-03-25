import React, { useMemo } from 'react';
import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import {changeSimulator} from 'src/store/store'
import { useQuery } from '@tanstack/react-query';
import {useCableId} from "src/store/store"

const PhilButton = () => {
  const {onCutId} = useCableId();
  const apiConfig = useMemo(
    () => ({
      apiBaseUrl: process.env.REACT_APP_API_BASE_URL || "",
      port: process.env.REACT_APP_PORT || "",
      mapApiKey: process.env.REACT_APP_GEOAPIFY_API_KEY || "",
    }),
    []);
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


  const map = useMap();
  const {nav, onChangeNav} = changeSimulator(); 
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
            <span>${nav === 'Global' ? 'Domestic Simulator' : 'International Simulator'}</span>
          </span>
        `;

        // Style the button like Material UI contained button
        button.style.backgroundColor = '#1976d2'; // Primary color
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
          button.style.backgroundColor = '#115293';
        };

        button.onmouseout = function () {
          button.style.backgroundColor = '#1976d2';
        };

        // Add click behavior
        button.onclick = function () {
          if(nav === 'Global') onChangeNav('Phil');
          else onChangeNav('Global');
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

export default PhilButton;
