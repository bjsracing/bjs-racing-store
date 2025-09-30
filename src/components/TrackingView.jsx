// File: /src/components/TrackingView.jsx
import React, { useState, useEffect } from "react";
import { FiLoader, FiXCircle, FiSearch } from "react-icons/fi";

const formatTanggal = (dateString, timeString) =>
  new Date(`${dateString} ${timeString}`).toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  });

const courierOptions = [
  { code: "jne", name: "JNE" },
  //{ code: "sicepat", name: "SiCepat" },
  { code: "jnt", name: "J&T Express" },
  //{ code: "sap", name: "SAP Express" },
  //{ code: "ninja", name: "Ninja Xpress" },
  //{ code: "ide", name: "ID Express" },
  { code: "tiki", name: "TIKI" },
  { code: "wahana", name: "Wahana Express" },
  { code: "pos", name: "POS Indonesia" },
  //{ code: "sentral", name: "Sentral Cargo" },
  { code: "lion", name: "Lion Parcel" },
  //{ code: "rex", name: "Royal Express Asia" },
];

const TrackingView = ({
  awb: initialAwb = null,
  courier: initialCourier = null,
}) => {
  const [awb, setAwb] = useState(initialAwb || "");
  const [courier, setCourier] = useState(initialCourier || "");
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const trackShipment = async (awbToTrack, courierToTrack) => {
    setLoading(true);
    setError(null);
    setTrackingData(null);
    try {
      const response = await fetch(
        `/api/shipping/track?awb=${awbToTrack}&courier=${courierToTrack}`,
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Gagal melacak resi.");
      }
      setTrackingData(result);
    } catch (err) {
      // --- PERBAIKAN DI SINI ---
      // Gunakan 'instanceof' untuk memeriksa tipe error secara aman
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan yang tidak dikenal.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialAwb && initialCourier) {
      trackShipment(initialAwb, initialCourier);
    }
  }, [initialAwb, initialCourier]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!awb || !courier) {
      setError("Nomor resi dan kurir harus diisi.");
      return;
    }
    trackShipment(awb, courier);
  };

  // --- PERBAIKAN UTAMA: Gabungkan semua logika tampilan ke dalam satu 'return' ---
  return (
    <div className="space-y-6">
      <form
        onSubmit={handleFormSubmit}
        className="bg-white p-6 rounded-xl shadow-md flex flex-col sm:flex-row gap-4"
      >
        <input
          type="text"
          value={awb}
          onChange={(e) => setAwb(e.target.value)}
          placeholder="Masukkan Nomor Resi"
          className="w-full p-3 border rounded-md bg-gray-50 flex-grow"
          required
        />
        <select
          value={courier}
          onChange={(e) => setCourier(e.target.value)}
          className="w-full sm:w-auto p-3 border rounded-md bg-gray-50"
          required
        >
          <option value="">Pilih Kurir</option>
          {courierOptions.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:bg-gray-400 flex items-center justify-center gap-2"
        >
          {loading ? <FiLoader className="animate-spin" /> : <FiSearch />}
          <span>{loading ? "Melacak..." : "Lacak"}</span>
        </button>
      </form>

      {/* Bagian untuk menampilkan hasil, error, atau loading */}
      <div className="mt-6">
        {loading && (
          <div className="text-center p-10">
            <FiLoader className="animate-spin inline-block mr-2" /> Memuat data
            pelacakan...
          </div>
        )}
        {error && (
          <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-center gap-2">
            <FiXCircle /> {error}
          </div>
        )}
        {trackingData && (
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-8 pb-6 border-b">
              <div>
                <p className="text-gray-500">No. Resi</p>
                <p className="font-bold">
                  {trackingData.summary.waybill_number}
                </p>
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
        )}
        {!loading && !error && !trackingData && !initialAwb && (
          <p className="text-center text-gray-500 py-10">
            Silakan masukkan nomor resi untuk memulai pelacakan.
          </p>
        )}
      </div>
    </div>
  );
};

export default TrackingView;
