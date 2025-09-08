// File: src/components/MapPicker.tsx
// Komponen baru untuk menampilkan peta interaktif dengan pin.

import React, { useState, useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix untuk ikon default Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Komponen helper untuk memusatkan ulang peta secara dinamis
function ChangeView({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

// Komponen helper untuk menangani klik di peta
function LocationMarker({
  position,
  setPosition,
}: {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
}

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function MapPicker({
  initialLat = -6.9175,
  initialLng = 107.6191,
  onLocationChange,
}: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>([
    initialLat,
    initialLng,
  ]);

  useEffect(() => {
    setPosition([initialLat, initialLng]);
  }, [initialLat, initialLng]);

  useEffect(() => {
    if (position) {
      onLocationChange(position[0], position[1]);
    }
  }, [position, onLocationChange]);

  // Gunakan useMemo untuk memastikan center tidak selalu dibuat ulang
  const center = useMemo<[number, number]>(
    () => [initialLat, initialLng],
    [initialLat, initialLng],
  );

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} />
        <ChangeView center={center} zoom={13} />
      </MapContainer>
      <p className="text-xs text-center text-gray-500 mt-1">
        Klik di peta untuk menyesuaikan titik lokasi
      </p>
    </div>
  );
}
