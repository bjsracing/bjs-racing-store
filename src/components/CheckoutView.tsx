// File: src/components/CheckoutView.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "../lib/store.ts";
import type { CartItem, Address } from "../lib/store.ts";

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
  available?: boolean;
}

// PERBAIKAN 1: Tipe data baru untuk Voucher
interface Voucher {
  id: number;
  code: string;
  description: string;
  type: "fixed_amount" | "percentage" | "free_shipping";
  discount_value: number;
  max_discount?: number;
  min_purchase: number;
  target_label?: string | null;
}

function describeTargetLabel(v: any): string | null {
  if (
    !v ||
    !v.target_type ||
    v.target_type === "all_products" ||
    !v.target_value ||
    v.target_value.length === 0
  )
    return null;
  const labels = v.target_value.join(", ");
  if (v.target_type === "category") return `Khusus kategori: ${labels}`;
  if (v.target_type === "brand") return `Khusus merek: ${labels}`;
  if (v.target_type === "specific_product") return `Khusus produk tertentu`;
  return null;
}

export default function CheckoutView() {
  const {
    items,
    addresses,
    fetchAddresses,
    calculateTotalWeight,
    clearCart,
    addToast,
  } = useAppStore();
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

  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discount_amount: number;
    target_label?: string | null;
  } | null>(null);
  const [voucherError, setVoucherError] = useState("");
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [myVouchers, setMyVouchers] = useState<Voucher[]>([]);

  const [showQr, setShowQr] = useState(false);
  const [qrData, setQrData] = useState<{
    qr_content: string;
    qr_image_base64: string;
    expires_at?: string;
    order_id: string;
  } | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const PAYMENT_GATEWAY_FEE = 4500;

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

  const finalTotal = useMemo(() => {
    const totalBeforeDiscount =
      subtotal + (selectedShipping?.cost || 0) + PAYMENT_GATEWAY_FEE;
    return Math.max(
      0,
      totalBeforeDiscount - (appliedVoucher?.discount_amount || 0),
    );
  }, [subtotal, selectedShipping, PAYMENT_GATEWAY_FEE, appliedVoucher]);

  const formatRupiah = (number: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number || 0);

  useEffect(() => {
    fetchAddresses();
    const fetchMyVouchers = async () => {
      try {
        const response = await fetch("/api/vouchers/my-vouchers");
        const data = await response.json();
        if (response.ok) {
          const validVouchers = data
            .map((item: any) => item.vouchers)
            .filter(Boolean);
          setMyVouchers(validVouchers);
        }
      } catch (err) {
        console.error("Gagal memuat voucher saya:", err);
      }
    };
    fetchMyVouchers();
  }, [fetchAddresses]);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const primaryAddress =
        addresses.find((addr: Address) => addr.is_primary) || addresses[0];
      if (primaryAddress) setSelectedAddressId(primaryAddress.id);
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    const fetchShippingCosts = async () => {
      setShippingServices([]);
      setSelectedShipping(null);
      setError("");
      if (!selectedAddressId || totalWeight === 0) return;
      const selectedAddress = addresses.find(
        (addr: Address) => addr.id === selectedAddressId,
      );
      if (!selectedAddress) return;

      setIsLoadingCosts(true);
      try {
        const destination = selectedAddress.city_id || selectedAddress.destination;
        const response = await fetch("/api/shipping/rajaongkir/rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination,
            weight: totalWeight,
            couriers: ["gojek", "pos"],
          }),
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.message || "Gagal menghitung ongkos kirim.");
        const mapped = (result || []).map((o: any) => ({
          service: o.service,
          code: o.code,
          name: o.name,
          cost: o.cost,
          etd: o.etd,
          description: o.description,
        }));
        setShippingServices(mapped as any);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
        setShippingServices([]);
      } finally {
        setIsLoadingCosts(false);
      }
    };
    fetchShippingCosts();
  }, [selectedAddressId, totalWeight, addresses]);

  const handleApplyVoucher = async (codeToApply: string) => {
    if (!codeToApply) return;
    setIsApplyingVoucher(true);
    setVoucherError("");
    setAppliedVoucher(null);
    try {
      const response = await fetch("/api/vouchers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voucher_code: codeToApply,
          cart_subtotal: subtotal,
          shipping_cost: selectedShipping?.cost || 0,
          cart_items: items.map((item: CartItem) => ({
            product_id: item.product_id,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || "Voucher tidak valid.");
      setAppliedVoucher({
        code: result.voucher_details.code,
        discount_amount: result.discount_amount,
        target_label: result.voucher_details.target_label ?? null,
      });
      addToast({
        type: "success",
        message: `Voucher ${result.voucher_details.code} berhasil diterapkan!`,
      });
    } catch (err) {
      setVoucherError((err as Error).message);
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleSelectFromModal = (voucher: Voucher) => {
    setVoucherCode(voucher.code);
    setIsModalOpen(false);
    handleApplyVoucher(voucher.code);
  };

  const pollOrderStatus = (orderId: string) => {
    setIsPolling(true);
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?order_id=${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "paid") {
            clearInterval(interval);
            setIsPolling(false);
            clearCart();
            window.location.href = `/akun/pesanan/${orderId}?status=success`;
          }
        }
      } catch {
        // abaikan, coba lagi di interval berikutnya
      }
    }, 3000);
    setTimeout(() => {
      clearInterval(interval);
      setIsPolling(false);
    }, 1000 * 60 * 10);
  };

  const handlePayment = async () => {
    if (!selectedAddressId || !selectedShipping) {
      addToast({
        type: "info",
        message: "Silakan lengkapi alamat dan metode pengiriman.",
      });
      return;
    }
    setIsProcessingPayment(true);
    const selectedService = shippingServices.find(
      (s: any) => s.service === selectedShipping.service,
    );
    const courierDetails = selectedService || null;
    const payload = {
      address_id: selectedAddressId,
      shipping_cost: selectedShipping.cost,
      payment_gateway_fee: PAYMENT_GATEWAY_FEE,
      voucher_code: appliedVoucher?.code || null,
      discount_amount: appliedVoucher?.discount_amount || 0,
      courier: {
        code: courierDetails?.code,
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
      if (!response.ok) {
        if (response.status === 409) {
          addToast({ type: "error", message: result.message });
          useAppStore.getState().fetchCart();
          window.location.href = "/cart";
        } else {
          throw new Error(result.message || "Gagal membuat transaksi.");
        }
        return;
      }
      if (result.qr_content) {
        setQrData({
          qr_content: result.qr_content,
          qr_image_base64: result.qr_image_base64,
          expires_at: result.expires_at,
          order_id: result.order_id,
        });
        setShowQr(true);
        setIsProcessingPayment(false);
        pollOrderStatus(result.order_id);
        return;
      }
      const { snap_token, order_id } = result;
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
          addToast({
            type: "error",
            message: "Pembayaran Gagal. Silakan coba lagi.",
          });
          setIsProcessingPayment(false);
        },
        onClose: function () {
          setIsProcessingPayment(false);
        },
      });
    } catch (err) {
      addToast({ type: "error", message: (err as Error).message });
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Kolom Kiri: Alamat, Pengiriman, dan Voucher */}
      <div className="lg:col-span-2 space-y-6">
        {/* --- Blok Alamat Pengiriman (Tidak Berubah) --- */}
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
              href="/akun/alamat"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              + Kelola Alamat
            </a>
          </div>
        </div>

        {/* --- Blok Metode Pengiriman (Tidak Berubah) --- */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-4">Metode Pengiriman</h2>
          <p className="text-sm text-gray-500 mb-2">
            Pilih layanan pengiriman di bawah ini (Gojek &amp; POS Indonesia via
            RajaOngkir).
          </p>
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
                    onChange={() => {
                      setSelectedCourier(service.code);
                      setSelectedShipping({
                        service: service.service,
                        cost: service.cost,
                        etd: service.etd,
                      });
                    }}
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

        {/* --- BLOK VOUCHER BARU --- */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-4">Voucher & Diskon</h2>
          <div className="flex gap-2 items-start">
            <div className="flex-grow">
              <input
                type="text"
                placeholder="Masukkan Kode Voucher"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                className="w-full p-3 border rounded-md bg-gray-50 text-sm"
              />
              {voucherError && (
                <p className="text-xs text-red-500 mt-1">{voucherError}</p>
              )}
              {appliedVoucher && (
                <p className="text-xs text-green-600 mt-1">
                  Kode {appliedVoucher.code} diterapkan.
                  {appliedVoucher.target_label
                    ? ` (${appliedVoucher.target_label})`
                    : ""}
                </p>
              )}
            </div>
            <button
              onClick={() => handleApplyVoucher(voucherCode)}
              disabled={isApplyingVoucher || !voucherCode}
              className="px-4 py-3 bg-orange-500 text-white font-semibold rounded-md text-sm disabled:bg-gray-400"
            >
              {isApplyingVoucher ? "..." : "Terapkan"}
            </button>
          </div>
          {myVouchers.length > 0 && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm font-medium text-blue-600 hover:underline mt-2"
            >
              atau Pilih Voucher Saya
            </button>
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
            <div className="flex justify-between">
              <p className="text-gray-600">Biaya Layanan Transaksi</p>
              <p className="font-medium">{formatRupiah(PAYMENT_GATEWAY_FEE)}</p>
            </div>
            {/* --- BARIS DISKON BARU --- */}
            {appliedVoucher && (
              <div className="flex justify-between text-green-600">
                <p>Diskon ({appliedVoucher.code})</p>
                <p className="font-medium">
                  - {formatRupiah(appliedVoucher.discount_amount)}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-between text-lg font-bold pt-4 mt-4 border-t">
            <p>Total</p>
            <p>{formatRupiah(finalTotal)}</p>
          </div>
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

      {/* --- MODAL VOUCHER BARU --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">Pilih Voucher Saya</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              {myVouchers
                .filter((v) => subtotal >= v.min_purchase)
                .map((voucher) => (
                  <div
                    key={voucher.id}
                    onClick={() => handleSelectFromModal(voucher)}
                    className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                  >
                    <p className="font-bold text-orange-500">{voucher.code}</p>
                    <p className="text-sm text-slate-600">
                      {voucher.description}
                    </p>
                    {describeTargetLabel(voucher) && (
                      <p className="text-xs text-blue-600 mt-1">
                        {describeTargetLabel(voucher)}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      Min. belanja {formatRupiah(voucher.min_purchase)}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
      {/* --- MODAL QRIS BRI --- */}
      {showQr && qrData && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-bold mb-2">Scan QRIS untuk Bayar</h3>
            <p className="text-sm text-gray-500 mb-4">
              Gunakan aplikasi e-wallet / m-banking (GoPay, OVO, DANA,
              m-Banking BRI, dll). Halaman akan otomatis lanjut setelah dibayar.
            </p>
            {qrData.qr_image_base64 ? (
              <img
                src={`data:image/png;base64,${qrData.qr_image_base64}`}
                alt="QRIS"
                className="mx-auto w-56 h-56"
              />
            ) : (
              <div className="mx-auto w-56 h-56 flex items-center justify-center border rounded bg-gray-50 text-xs break-all p-2">
                {qrData.qr_content}
              </div>
            )}
            <p className="text-sm text-gray-500 mt-4">
              {isPolling ? "Menunggu konfirmasi pembayaran..." : ""}
            </p>
            <button
              onClick={() => setShowQr(false)}
              className="mt-4 text-sm text-gray-500 hover:underline"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
