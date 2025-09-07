// File: src/stores/addressStore.ts

import { atom } from "nanostores";

// Definisikan tipe data untuk satu alamat
export interface Address {
  id: string;
  label: string;
  recipient_name: string;
  recipient_phone: string;
  full_address: string;
  destination: string;
  destination_text: string;
  postal_code: string;
  is_primary: boolean;
}

// Tipe data form yang digunakan di AddressForm.tsx
export interface FormDataState {
  label: string;
  recipient_name: string;
  recipient_phone: string;
  destination: string;
  destination_text: string;
  full_address: string;
  postal_code: string;
}

// Store terpusat
export const addressListStore = atom<Address[]>([]);

/**
 * Mengambil data alamat terbaru dari server dan memperbarui store.
 */
export async function fetchAddresses() {
  try {
    const response = await fetch(`/api/addresses?timestamp=${Date.now()}`);
    if (!response.ok)
      throw new Error("Gagal mengambil data alamat dari server.");
    const data: Address[] = await response.json();
    addressListStore.set(data);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    addressListStore.set([]);
  }
}

/**
 * Menambahkan alamat baru ke server, lalu memicu refresh data di store.
 */
export async function addAddress(
  addressData: Omit<Address, "id" | "is_primary">,
) {
  const response = await fetch("/api/addresses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(addressData),
  });

  if (!response.ok) {
    const errorResult = await response.json();
    throw new Error(errorResult.message || "Gagal menyimpan alamat baru.");
  }
  await fetchAddresses();
}

/**
 * Memperbarui alamat yang ada di server, lalu memicu refresh data di store.
 */
export async function updateAddress(
  addressId: string,
  addressData: Partial<FormDataState>,
) {
  const response = await fetch("/api/addresses", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: addressId, ...addressData }),
  });

  if (!response.ok) {
    const errorResult = await response.json();
    throw new Error(errorResult.message || "Gagal memperbarui alamat.");
  }
  await fetchAddresses();
}

// --- FUNGSI BARU (Perbaikan Error) ---
/**
 * Menghapus alamat dari server, lalu memicu refresh data di store.
 * @param addressId ID alamat yang akan dihapus.
 */
export async function deleteAddress(addressId: string) {
  const response = await fetch("/api/addresses", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addressId: addressId }),
  });

  if (!response.ok) {
    const errorResult = await response.json();
    throw new Error(errorResult.message || "Gagal menghapus alamat di server.");
  }

  // Setelah berhasil menghapus, panggil fetchAddresses untuk menyinkronkan state.
  await fetchAddresses();
}
