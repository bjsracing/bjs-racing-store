// File: /src/components/TrackingView.jsx
import React, { useState, useEffect } from "react";
import { FiLoader, FiXCircle } from "react-icons/fi";

const formatTanggal = (dateString, timeString) =>
  new Date(`${dateString} ${timeString}`).toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  });

const TrackingView = ({ awb, courier }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!awb || !courier) {
      setError("Nomor resi dan kurir tidak valid.");
      setLoading(false);
      return;
    }

    const trackShipment = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/shipping/track?awb=${awb}&courier=${courier}`,
        );
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Gagal melacak resi.");
        }
        setTrackingData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    trackShipment();
  }, [awb, courier]);

  if (loading)
    return (
      <div className="text-center p-10">
        <FiLoader className="animate-spin inline-block mr-2" /> Memuat data
        pelacakan...
      </div>
    );
  if (error)
    return (
      <div className="text-center p-10 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-center gap-2">
        <FiXCircle /> {error}
      </div>
    );
  if (!trackingData)
    return (
      <div className="text-center p-10">Data pelacakan tidak ditemukan.</div>
    );

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-8 pb-6 border-b">
        <div>
          <p className="text-gray-500">No. Resi</p>
          <p className="font-bold">{trackingData.summary.waybill_number}</p>
        </div>
        <div>
          <p className="text-gray-500">Kurir</p>
          <p className="font-bold">{trackingData.summary.courier_name}</p>
        </div>
        <div>
          <p className="text-gray-500">Layanan</p>
          <p className="font-bold">{trackingData.summary.service_code}</p>
        </div>
        <div>
          <p className="text-gray-500">Status</p>
          <p className="font-bold capitalize text-green-600">
            {trackingData.summary.status}
          </p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-6">Riwayat Perjalanan</h2>
      <ul className="space-y-6 border-l-2 border-gray-200 ml-2">
        {trackingData.manifest.map((item, index) => (
          <li key={index} className="relative pl-8">
            <div className="absolute -left-[9px] top-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
            <p className="font-semibold text-gray-800">
              {item.manifest_description}
            </p>
            <p className="text-sm text-gray-500">
              {formatTanggal(item.manifest_date, item.manifest_time)}
            </p>
            <p className="text-sm text-gray-400">{item.city_name}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TrackingView;
