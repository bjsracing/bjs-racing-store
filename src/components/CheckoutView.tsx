// File: src/components/CheckoutView.tsx
// Perbaikan Final: Disesuaikan untuk mengirim parameter lengkap ke API Komerce
// dan menampilkan hasil ongkir reguler, kargo, dan instan.

import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store.ts";
import type { Address } from "@/lib/store.ts";

// Tipe data baru untuk hasil ongkos kirim dari API Komerce
interface ShippingService {
  shipping_name: string;
  service_name: string;
  shipping_cost: number;
  etd: string;
}

interface ShippingCostsResponse {
  calculate_reguler: ShippingService[];
  calculate_cargo: ShippingService[];
  calculate_instant: ShippingService[];
}

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
  const [shippingCosts, setShippingCosts] =
    useState<ShippingCostsResponse | null>(null);
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

  const formatRupiah = (number: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number || 0);

  // --- Efek Samping (Side Effects) ---

  // 1. Ambil daftar alamat saat komponen dimuat
  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // 2. Set alamat utama sebagai pilihan default
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const primaryAddress =
        addresses.find((addr) => addr.is_primary) || addresses[0];
      setSelectedAddressId(primaryAddress.id);
    }
  }, [addresses, selectedAddressId]);

  // 3. Hitung ongkos kirim setiap kali alamat yang dipilih berubah
  useEffect(() => {
    const fetchShippingCosts = async () => {
      // Hanya berjalan jika alamat sudah dipilih dan ada barang di keranjang
      if (!selectedAddressId || totalWeight === 0) {
        setShippingCosts(null);
        setSelectedShipping(null);
        return;
      }

      setIsLoadingCosts(true);
      setError("");
      setSelectedShipping(null);
      setShippingCosts(null);

      const selectedAddress = addresses.find(
        (addr) => addr.id === selectedAddressId,
      );
      if (!selectedAddress || !selectedAddress.destination) return;

      try {
        // Siapkan payload lengkap sesuai dokumentasi Komerce
        const payload = {
          shipper_destination_id: "65100", // ID Asal Pengiriman Anda
          receiver_destination_id: selectedAddress.destination,
          weight: totalWeight,
          item_value: subtotal,
          // Sediakan pin point jika ada di data alamat (penting untuk GoSend)
          origin_pin_point: "-6.5951,110.6726", // Koordinat toko Anda (contoh: Jepara)
          destination_pin_point: `${selectedAddress.latitude},${selectedAddress.longitude}`,
        };

        const response = await fetch("/api/rajaongkir/cost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok)
          throw new Error(result.message || "Gagal menghitung ongkos kirim.");

        setShippingCosts(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
        setShippingCosts(null);
      } finally {
        setIsLoadingCosts(false);
      }
    };

    fetchShippingCosts();
  }, [selectedAddressId, totalWeight, addresses, subtotal]);

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
                Memuat alamat atau Anda belum memiliki alamat tersimpan...
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

          {isLoadingCosts && (
            <p className="text-sm text-gray-500 animate-pulse">
              Menghitung ongkos kirim...
            </p>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {shippingCosts && (
            <div className="space-y-4">
              {/* --- Tampilan untuk Kurir Instan --- */}
              {shippingCosts.calculate_instant?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Instan</h3>
                  {shippingCosts.calculate_instant.map((service) => (
                    <label
                      key={service.shipping_name + service.service_name}
                      className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500"
                    >
                      <input
                        type="radio"
                        name="shippingService"
                        onChange={() =>
                          setSelectedShipping({
                            service: service.service_name,
                            cost: service.shipping_cost,
                          })
                        }
                        className="flex-shrink-0"
                      />
                      <div className="ml-3 flex justify-between w-full text-sm">
                        <div>
                          <p className="font-semibold">
                            {service.shipping_name} {service.service_name}
                          </p>
                          <p className="text-gray-500">
                            Estimasi {service.etd}
                          </p>
                        </div>
                        <p className="font-bold">
                          {formatRupiah(service.shipping_cost)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {/* --- Tampilan untuk Kurir Reguler --- */}
              {shippingCosts.calculate_reguler?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Reguler</h3>
                  <div className="space-y-2">
                    {shippingCosts.calculate_reguler.map((service) => (
                      <label
                        key={service.shipping_name + service.service_name}
                        className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500"
                      >
                        <input
                          type="radio"
                          name="shippingService"
                          onChange={() =>
                            setSelectedShipping({
                              service: service.service_name,
                              cost: service.shipping_cost,
                            })
                          }
                          className="flex-shrink-0"
                        />
                        <div className="ml-3 flex justify-between w-full text-sm">
                          <div>
                            <p className="font-semibold">
                              {service.shipping_name} {service.service_name}
                            </p>
                            <p className="text-gray-500">
                              Estimasi {service.etd}
                            </p>
                          </div>
                          <p className="font-bold">
                            {formatRupiah(service.shipping_cost)}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {/* --- Tampilan untuk Kurir Kargo --- */}
              {shippingCosts.calculate_cargo?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Kargo</h3>
                  <div className="space-y-2">
                    {shippingCosts.calculate_cargo.map((service) => (
                      <label
                        key={service.shipping_name + service.service_name}
                        className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500"
                      >
                        <input
                          type="radio"
                          name="shippingService"
                          onChange={() =>
                            setSelectedShipping({
                              service: service.service_name,
                              cost: service.shipping_cost,
                            })
                          }
                          className="flex-shrink-0"
                        />
                        <div className="ml-3 flex justify-between w-full text-sm">
                          <div>
                            <p className="font-semibold">
                              {service.shipping_name} {service.service_name}
                            </p>
                            <p className="text-gray-500">
                              Estimasi {service.etd}
                            </p>
                          </div>
                          <p className="font-bold">
                            {formatRupiah(service.shipping_cost)}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
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
