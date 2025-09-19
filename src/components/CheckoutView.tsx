// File: src/components/CheckoutView.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "../lib/store.ts";
import type { CartItem } from "../lib/store.ts"; // PERBAIKAN: Hapus 'Address' yang tidak digunakan

// Deklarasikan 'snap' di scope window agar TypeScript tidak error
declare global {
  interface Window {
    snap: any;
  }
}

interface ShippingService {
  name: string;
  code: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
}

const courierOptions = [
  { code: "pos", name: "POS Indonesia" },
  { code: "jnt", name: "J&T Express" },
  { code: "jne", name: "JNE" },
  { code: "sicepat", name: "SiCepat" },
  { code: "tiki", name: "TIKI" },
  { code: "wahana", name: "Wahana Express" },
  { code: "lion", name: "Lion Parcel" },
];

export default function CheckoutView() {
  const { items, addresses, fetchAddresses, calculateTotalWeight, clearCart } =
    useAppStore();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [selectedCourier, setSelectedCourier] = useState<string>("");
  const [shippingServices, setShippingServices] = useState<ShippingService[]>(
    [],
  );
  const [selectedShipping, setSelectedShipping] = useState<{
    service: string;
    cost: number;
    etd: string;
  } | null>(null);
  const [isLoadingCosts, setIsLoadingCosts] = useState(false);
  const [error, setError] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // --- PERBAIKAN 1: Definisikan Biaya Layanan ---
  const SERVICE_FEE = 2000;

  // --- Kalkulasi Memoized (Diperbarui) ---
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

  // --- PERBAIKAN 2: Perbarui kalkulasi Total Akhir untuk menyertakan Biaya Layanan ---
  const finalTotal = useMemo(
    () => subtotal + (selectedShipping?.cost || 0) + SERVICE_FEE,
    [subtotal, selectedShipping],
  );
  const formatRupiah = (number: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number || 0);

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
            origin: "65100",
            destination: selectedAddress.destination,
            weight: totalWeight,
            courier: selectedCourier,
          }),
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.message || "Gagal menghitung ongkos kirim.");
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

  const handlePayment = async () => {
    if (!selectedAddressId || !selectedShipping || !selectedCourier) {
      alert("Silakan lengkapi alamat dan metode pengiriman.");
      return;
    }

    setIsProcessingPayment(true);

    const courierDetails = courierOptions.find(
      (c) => c.code === selectedCourier,
    );
    const payload = {
      address_id: selectedAddressId,
      shipping_cost: selectedShipping.cost,
      service_fee: SERVICE_FEE, // <-- PERBAIKAN 3: Kirim biaya layanan ke backend
      courier: {
        code: selectedCourier,
        name: courierDetails?.name,
        service: selectedShipping.service,
        etd: selectedShipping.etd,
      },
      cart_items: items.map((item: CartItem) => ({
        product_id: item.product_id,
        price: item.harga_jual,
        quantity: item.quantity,
        name: item.nama,
        sku: item.sku,
        image_url: item.image_url,
      })),
    };

    try {
      const response = await fetch("/api/payment/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Gagal membuat transaksi.");

      const { snap_token, order_id } = result;

      // PERBAIKAN: Tambahkan tipe 'any' dan underscore '_' untuk parameter yang tidak digunakan
      window.snap.pay(snap_token, {
        onSuccess: function (_result: any) {
          clearCart();
          window.location.href = `/akun/pesanan/${order_id}?status=success`;
        },
        onPending: function (_result: any) {
          clearCart();
          window.location.href = `/akun/pesanan/${order_id}?status=pending`;
        },
        onError: function (_result: any) {
          alert("Pembayaran Gagal. Silakan coba lagi.");
          setIsProcessingPayment(false);
        },
        onClose: function () {
          setIsProcessingPayment(false);
        },
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setIsProcessingPayment(false);
    }
  };

  // --- Tampilan JSX (Hanya tombol pembayaran yang diubah) ---
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                        etd: service.etd, // 5. PERBAIKAN: Sertakan ETD saat memilih layanan
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
            {/* --- PERBAIKAN 4: Tampilkan baris Biaya Layanan --- */}
            <div className="flex justify-between">
              <p className="text-gray-600">Biaya Layanan</p>
              <p className="font-medium">{formatRupiah(SERVICE_FEE)}</p>
            </div>
          </div>
          <div className="flex justify-between text-lg font-bold pt-4 mt-4 border-t">
            <p>Total</p>
            <p>{formatRupiah(finalTotal)}</p>
          </div>
          {/* 6. PERBAIKAN: Hubungkan tombol ke fungsi handlePayment dan state loading */}
          <button
            onClick={handlePayment}
            disabled={
              !selectedShipping || items.length === 0 || isProcessingPayment
            }
            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessingPayment ? "Memproses..." : "Lanjut ke Pembayaran"}
          </button>
        </div>
      </div>
    </div>
  );
}
