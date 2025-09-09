// File: src/components/CheckoutView.tsx
// Perbaikan Final: Disesuaikan untuk mem-parsing dan menampilkan
// struktur respons dari API RajaOngkir Starter.

import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "../lib/store.ts";
import type { Address } from "../lib/store.ts";

// --- PERBAIKAN 1: Tipe data baru untuk hasil ongkos kirim ---
// Disesuaikan dengan struktur respons dari API Starter RajaOngkir
interface ShippingService {
  name: string; // Nama kurir (e.g., "JNE")
  code: string; // Kode kurir (e.g., "jne")
  service: string; // Nama layanan (e.g., "REG")
  description: string; // Deskripsi layanan
  cost: number; // Biaya pengiriman
  etd: string; // Estimasi Waktu Tiba
}

// --- PERBAIKAN 2: Daftar kurir yang didukung oleh paket Starter ---
const courierOptions = [
  { code: "jne", name: "JNE" },
  { code: "sicepat", name: "SiCepat" },
  { code: "jnt", name: "J&T Express" },
  { code: "sap", name: "SAP Express" },
  { code: "ninja", name: "Ninja Xpress" },
  { code: "ide", name: "ID Express" },
  { code: "tiki", name: "TIKI" },
  { code: "wahana", name: "Wahana Express" },
  { code: "pos", name: "POS Indonesia" },
  { code: "sentral", name: "Sentral Cargo" },
  { code: "lion", name: "Lion Parcel" },
  { code: "rex", name: "Royal Express Asia" },
];

export default function CheckoutView() {
  // --- State dari Zustand Store ---
  const items = useAppStore((state) => state.items);
  const addresses = useAppStore((state) => state.addresses);
  const fetchAddresses = useAppStore((state) => state.fetchAddresses);
  const calculateTotalWeight = useAppStore(
    (state) => state.calculateTotalWeight,
  );

  // --- State Lokal Komponen ---
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [selectedCourier, setSelectedCourier] = useState<string>("");
  const [shippingServices, setShippingServices] = useState<ShippingService[]>(
    [],
  ); // State untuk menampung daftar layanan
  const [selectedShipping, setSelectedShipping] = useState<{
    service: string;
    cost: number;
  } | null>(null);
  const [isLoadingCosts, setIsLoadingCosts] = useState(false);
  const [error, setError] = useState("");

  // --- Kalkulasi Memoized ---
  const totalWeight = useMemo(
    () => calculateTotalWeight(),
    [items, calculateTotalWeight],
  );
  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + (item.quantity || 0) * (item.harga_jual || 0),
        0,
      ),
    [items],
  );
  const finalTotal = useMemo(
    () => subtotal + (selectedShipping?.cost || 0),
    [subtotal, selectedShipping],
  );

  const formatRupiah = (number: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number || 0);

  // --- Efek Samping ---

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const primaryAddress =
        addresses.find((addr) => addr.is_primary) || addresses[0];
      setSelectedAddressId(primaryAddress.id);
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    const fetchShippingCosts = async () => {
      if (!selectedAddressId || !selectedCourier || totalWeight === 0) {
        setShippingServices([]);
        setSelectedShipping(null);
        return;
      }

      setIsLoadingCosts(true);
      setError("");
      setSelectedShipping(null);
      setShippingServices([]);

      const selectedAddress = addresses.find(
        (addr) => addr.id === selectedAddressId,
      );
      if (!selectedAddress || !selectedAddress.destination) return;

      try {
        const response = await fetch("/api/rajaongkir/cost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: "65100", // ID Asal Pengiriman Anda
            destination: selectedAddress.destination,
            weight: totalWeight,
            courier: selectedCourier,
          }),
        });

        const result = await response.json();
        if (!response.ok)
          throw new Error(result.message || "Gagal menghitung ongkos kirim.");

        // --- PERBAIKAN 3: Menyimpan hasil ke state yang benar ---
        setShippingServices(result || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
        setShippingServices([]);
      } finally {
        setIsLoadingCosts(false);
      }
    };

    fetchShippingCosts();
  }, [selectedAddressId, selectedCourier, totalWeight, addresses]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Kolom Kiri: Alamat & Pengiriman */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-4">Alamat Pengiriman</h2>
          <div className="space-y-3">
            {addresses.length > 0 ? (
              addresses.map((address) => (
                <label
                  key={address.id}
                  className="flex items-start p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500"
                >
                  <input
                    type="radio"
                    name="shippingAddress"
                    value={address.id}
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                    className="mt-1 flex-shrink-0"
                  />
                  <div className="ml-4 text-sm">
                    <p className="font-semibold">
                      {address.recipient_name} ({address.label})
                    </p>
                    <p className="text-gray-600">{address.recipient_phone}</p>
                    <p className="text-gray-600">{address.full_address}</p>
                    <p className="text-gray-500">{address.destination_text}</p>
                  </div>
                </label>
              ))
            ) : (
              <p className="text-sm text-gray-500">Memuat alamat...</p>
            )}
            <a
              href="/akun"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              + Kelola Alamat
            </a>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-4">Metode Pengiriman</h2>
          <select
            value={selectedCourier}
            onChange={(e) => setSelectedCourier(e.target.value)}
            className="w-full p-3 border rounded-md bg-gray-50 focus:border-blue-500 focus:ring-blue-500"
            disabled={!selectedAddressId}
          >
            <option value="">-- Pilih Kurir --</option>
            {courierOptions.map((courier) => (
              <option key={courier.code} value={courier.code}>
                {courier.name}
              </option>
            ))}
          </select>

          {isLoadingCosts && (
            <p className="text-sm text-gray-500 mt-4 animate-pulse">
              Menghitung ongkos kirim...
            </p>
          )}
          {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

          {/* --- PERBAIKAN 4: Render hasil ongkir dari array tunggal --- */}
          {shippingServices.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Pilih Layanan Pengiriman:</p>
              {shippingServices.map((service) => (
                <label
                  key={service.service}
                  className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500"
                >
                  <input
                    type="radio"
                    name="shippingService"
                    onChange={() =>
                      setSelectedShipping({
                        service: service.service,
                        cost: service.cost,
                      })
                    }
                    className="flex-shrink-0"
                  />
                  <div className="ml-3 flex-grow flex justify-between w-full text-sm flex-wrap gap-2">
                    <div>
                      <p className="font-semibold">
                        {service.service} ({service.description})
                      </p>
                      <p className="text-gray-500">Estimasi {service.etd}</p>
                    </div>
                    <p className="font-bold whitespace-nowrap">
                      {formatRupiah(service.cost)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Kolom Kanan: Ringkasan Pesanan */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-xl shadow-md sticky top-8">
          <h2 className="text-xl font-bold mb-4">Ringkasan Pesanan</h2>
          <div className="space-y-2 text-sm border-b pb-4 max-h-60 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center gap-2"
              >
                <p className="text-gray-600 truncate w-4/6">
                  {item.nama}{" "}
                  <span className="text-gray-400">x{item.quantity}</span>
                </p>
                <p className="font-medium text-right whitespace-nowrap">
                  {formatRupiah((item.quantity || 0) * (item.harga_jual || 0))}
                </p>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm pt-4">
            <div className="flex justify-between">
              <p className="text-gray-600">Subtotal</p>
              <p className="font-medium">{formatRupiah(subtotal)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-600">Ongkos Kirim</p>
              <p className="font-medium">
                {selectedShipping ? formatRupiah(selectedShipping.cost) : "-"}
              </p>
            </div>
          </div>
          <div className="flex justify-between text-lg font-bold pt-4 mt-4 border-t">
            <p>Total</p>
            <p>{formatRupiah(finalTotal)}</p>
          </div>
          <button
            disabled={!selectedShipping || items.length === 0}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Lanjut ke Pembayaran
          </button>
        </div>
      </div>
    </div>
  );
}
