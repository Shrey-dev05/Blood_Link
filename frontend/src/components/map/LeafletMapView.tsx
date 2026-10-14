'use client';

import React, { useEffect, useRef } from 'react';
import L, { Map, TileLayer, Marker, Circle, Polygon, Popup } from 'leaflet';

interface LeafletMapViewProps {
  facilities: any[];
  donorClusters?: any[];
  showDonorDensity: boolean;
  selectedFacility: any;
  onSelectFacility: (fac: any) => void;
}

// Custom Leaflet DivIcon with styling
const createCustomIcon = (type: string, isSelected: boolean) => {
  let bgColor = '#dc2626'; // blood-600
  let label = 'B';

  if (type === 'hospital') {
    bgColor = '#2563eb'; // blue-600
    label = 'H';
  } else if (type === 'donation_camp') {
    bgColor = '#059669'; // emerald-600
    label = 'C';
  }

  const size = isSelected ? 34 : 26;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${bgColor};
        border: 2px solid #ffffff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 800;
        font-size: ${isSelected ? 13 : 11}px;
        cursor: pointer;
        transform: translate(-50%, -50%);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      ">
        ${label}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

export default function LeafletMapView({
  facilities,
  donorClusters = [],
  showDonorDensity,
  selectedFacility,
  onSelectFacility
}: LeafletMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circlesLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map using direct module syntax
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent duplicate init

    // Direct instantiation per user requirement:
    // const map = new Map('map').setView([51.505, -0.09], 13);
    const map = new Map(mapContainerRef.current).setView([21.2514, 81.6296], 8);

    // Tiles layer per user requirement:
    // const tiles = new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //     maxZoom: 19,
    //     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    // }).addTo(map);
    const tiles = new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const circlesGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = markersGroup;
    circlesLayerRef.current = circlesGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      circlesLayerRef.current = null;
    };
  }, []);

  // Update facility markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    facilities.forEach((fac) => {
      if (!fac.latitude || !fac.longitude) return;
      const isSelected = selectedFacility?.id === fac.id;
      const icon = createCustomIcon(fac.type, isSelected);

      const marker = new Marker([fac.latitude, fac.longitude], { icon });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; padding: 4px; min-width: 180px;">
          <strong style="color: #0f172a; font-size: 13px; display: block; margin-bottom: 4px;">
            ${fac.name}
          </strong>
          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #b91c1c; background: #fff1f2; padding: 2px 8px; border-radius: 9999px; display: inline-block;">
            ${fac.type?.replace('_', ' ')}
          </span>
          <p style="color: #475569; font-size: 11px; margin: 6px 0 3px 0;">${fac.address || ''}</p>
          <p style="color: #334155; font-size: 11px; margin: 0;">Phone: <strong>${fac.contact_phone || 'N/A'}</strong></p>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        onSelectFacility(fac);
      });

      layer.addLayer(marker);
    });
  }, [facilities, selectedFacility, onSelectFacility]);

  // Update privacy-preserving donor clusters circles
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = circlesLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    if (!showDonorDensity) return;

    donorClusters.forEach((cluster) => {
      if (!cluster.approx_latitude || !cluster.approx_longitude) return;

      const circle = new Circle([cluster.approx_latitude, cluster.approx_longitude], {
        radius: 4000, // 4km privacy radius
        color: '#e11d48',
        fillColor: '#f43f5e',
        fillOpacity: 0.22,
        weight: 1.5,
        dashArray: '4, 4'
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 11px; padding: 3px;">
          <strong style="color: #be123c; display: block; font-size: 12px;">Verified Donor Cluster (${cluster.blood_group})</strong>
          <p style="color: #475569; margin: 4px 0 2px 0;">Location: ${cluster.area}</p>
          <span style="color: #94a3b8; font-size: 10px;">${cluster.privacy_note || 'Privacy Radius'}</span>
        </div>
      `;

      circle.bindPopup(popupHtml);
      layer.addLayer(circle);
    });
  }, [donorClusters, showDonorDensity]);

  // Pan / Fly to selected facility
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedFacility) return;
    if (selectedFacility.latitude && selectedFacility.longitude) {
      map.flyTo([selectedFacility.latitude, selectedFacility.longitude], 12, {
        duration: 1.2
      });
    }
  }, [selectedFacility]);

  return (
    <div className="w-full h-full min-h-[480px] rounded-3xl overflow-hidden relative border border-slate-200 shadow-md">
      <div
        id="map"
        ref={mapContainerRef}
        className="w-full h-full min-h-[480px] bg-slate-100"
        style={{ zIndex: 1 }}
      />
    </div>
  );
}
