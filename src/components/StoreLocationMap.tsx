// File: src/components/StoreLocationMap.tsx
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const STORE_LAT = Number(import.meta.env.BITESHIP_ORIGIN_LAT || -6.5244682);
const STORE_LNG = Number(import.meta.env.BITESHIP_ORIGIN_LNG || 110.7674915);
const STORE_NAME = import.meta.env.BITESHIP_ORIGIN_NAME || "BJS Racing Store";
const STORE_ADDRESS = import.meta.env.BITESHIP_ORIGIN_ADDRESS || "Jl. Wijaya Kusuma No.79, Bangsri, Jepara";

const storeIconHtml = `<div style="background-color:#ea580c;width:22px;height:22px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`;

interface StoreLocationMapProps {
  height?: number | string;
}

const StoreLocationMap = ({ height = 420 }: StoreLocationMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([STORE_LAT, STORE_LNG], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([STORE_LAT, STORE_LNG], {
      icon: L.divIcon({
        html: storeIconHtml,
        className: "",
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    }).addTo(map);

    marker.bindPopup(`<b>${STORE_NAME}</b><br/>${STORE_ADDRESS}`);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${STORE_LAT},${STORE_LNG}`;
  const appleMapsUrl = `http://maps.apple.com/?daddr=${STORE_LAT},${STORE_LNG}&dirflg=d`;

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        style={{ height: typeof height === "number" ? `${height}px` : height, width: "100%", borderRadius: 12 }}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <p>
          <span className="font-semibold text-slate-800">{STORE_NAME}</span>
          <br />
          {STORE_ADDRESS}
        </p>
        <div className="flex gap-2 ml-auto">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
          >
            Buka Google Maps
          </a>
          <a
            href={appleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 bg-gray-800 text-white rounded-lg text-xs font-semibold hover:bg-gray-900"
          >
            Buka Apple Maps
          </a>
        </div>
      </div>
    </div>
  );
};

export default StoreLocationMap;
