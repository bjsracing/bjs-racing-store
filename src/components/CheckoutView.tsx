// File: src/components/CheckoutView.tsx
// Komponen React untuk menangani seluruh logika checkout.

import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store.ts"; // Pastikan ekstensi file .ts disertakan jika diperlukan
import type { Address } from "@/lib/store.ts"; // Impor tipe data dari store Zustand

// Tipe data untuk hasil ongkos kirim dari RajaOngkir
interface ShippingCost {
  service: string;
  description: string;
  cost: {
    value: number;
    etd: string; // Estimasi Waktu Tiba
    note: string;
  }[];
}

// Opsi kurir yang tersedia (sesuai permintaan Anda: JNE, J&T, SiCepat, GoSend)
const courierOptions = [
  { code: "jne", name: "JNE" },
  { code: "jnt", name: "J&T" },
  { code: "sicepat", name: "SiCepat" },
  { code: "gosend", name: "GoSend Instant" },
];

export default function CheckoutView() {
  // --- Mengambil State dan Aksi dari Zustand Store ---
  const items = useAppStore((state) => state.items);
  const addresses = useAppStore((state) => state.addresses);
  const fetchAddresses = useAppStore((state) => state.fetchAddresses);
  const calculateTotalWeight = useAppStore(
    (state) => state.calculateTotalWeight,
  );

  // --- State Lokal untuk Komponen Checkout ---
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [selectedCourier, setSelectedCourier] = useState<string>("");
  const [shippingCosts, setShippingCosts] = useState<ShippingCost[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<{
    service: string;
    cost: number;
  } | null>(null);
  const [isLoadingCosts, setIsLoadingCosts] = useState(false);
  const [error, setError] = useState("");

  // --- Kalkulasi Memoized (untuk performa) ---
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

  // Fungsi format mata uang
  const formatRupiah = (number: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number || 0);

  // --- Efek Samping (Side Effects) ---

  // 1. Ambil daftar alamat saat komponen pertama kali dimuat
  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // 2. Set alamat utama sebagai pilihan default saat data alamat dimuat
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const primaryAddress =
        addresses.find((addr) => addr.is_primary) || addresses[0];
      setSelectedAddressId(primaryAddress.id);
    }
  }, [addresses, selectedAddressId]);

  // 3. Hitung ongkos kirim setiap kali alamat atau kurir yang dipilih berubah
  useEffect(() => {
    const fetchShippingCosts = async () => {
      if (!selectedAddressId || !selectedCourier || totalWeight === 0) {
        setShippingCosts([]);
        setSelectedShipping(null);
        return;
      }

      setIsLoadingCosts(true);
      setError("");
      setSelectedShipping(null);

      const selectedAddress = addresses.find(
        (addr) => addr.id === selectedAddressId,
      );
      if (!selectedAddress || !selectedAddress.destination) return;

      try {
        const response = await fetch("/api/rajaongkir/cost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: "65100", // ID Asal Pengiriman Anda (sesuai konfirmasi sebelumnya)
            destination: selectedAddress.destination, // ID Destinasi dari alamat
            weight: totalWeight,
            courier: selectedCourier,
          }),
        });

        const result = await response.json();
        if (!response.ok)
          throw new Error(result.message || "Gagal menghitung ongkos kirim.");

        // Asumsi data yang relevan ada di result[0].costs
        setShippingCosts(result[0]?.costs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
        setShippingCosts([]);
      } finally {
        setIsLoadingCosts(false);
      }
    };

    fetchShippingCosts();
  }, [selectedAddressId, selectedCourier, totalWeight, addresses]);

  // --- Render Komponen ---
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Kolom Kiri: Alamat & Pengiriman */}
      <div className="lg:col-span-2 space-y-6">
        {/* Pilihan Alamat Pengiriman */}
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
              <p className="text-sm text-gray-500">
                Anda belum memiliki alamat. Silakan tambahkan alamat di halaman
                akun Anda.
              </p>
            )}
            <a
              href="/akun"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              + Kelola Alamat
            </a>
          </div>
        </div>

        {/* Pilihan Metode Pengiriman */}
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

          {shippingCosts.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Pilih Layanan Pengiriman:</p>
              {shippingCosts.map((service) => (
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
                        cost: service.cost[0].value,
                      })
                    }
                    className="flex-shrink-0"
                  />
                  <div className="ml-3 flex-grows flex justify-between w-full text-sm flex-wrap gap-2">
                    <div>
                      <p className="font-semibold">{service.service}</p>
                      <p className="text-gray-500">
                        {service.description} (Estimasi {service.cost[0].etd}{" "}
                        hari)
                      </p>
                    </div>
                    <p className="font-bold whitespace-nowrap">
                      {formatRupiah(service.cost[0].value)}
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
