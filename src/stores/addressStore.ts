// File: src/stores/addressStore.ts

import { atom } from "nanostores";

// Definisikan tipe data untuk satu alamat (sesuaikan jika perlu)
export interface Address {
  id: string;
  label: string;
  recipient_name: string;
  recipient_phone: string;
  full_address: string;
  destination_text: string;
  postal_code: string;
  is_primary: boolean;
}

// 1. Definisikan Atom Store
// Ini adalah state terpusat yang menyimpan daftar alamat.
// Kita mulai dengan array kosong.
export const addressListStore = atom<Address[]>([]);

// 2. Definisikan Aksi (Actions) untuk memanipulasi store

/**
 * Mengambil data alamat terbaru dari server dan memperbarui store.
 * Fungsi ini akan dipanggil saat halaman dimuat dan setiap kali ada perubahan data.
 */
export async function fetchAddresses() {
  try {
    // Gunakan cache busting untuk memastikan data selalu segar
    const response = await fetch(`/api/addresses?timestamp=${Date.now()}`);
    if (!response.ok)
      throw new Error("Gagal mengambil data alamat dari server.");

    const data: Address[] = await response.json();
    addressListStore.set(data); // Memperbarui state terpusat dengan data baru
  } catch (error) {
    console.error("Error fetching addresses:", error);
    // Set store ke array kosong jika terjadi error untuk menghindari data basi
    addressListStore.set([]);
  }
}

/**
 * Menambahkan alamat baru ke server, lalu memicu refresh data di store.
 * @param addressData Data alamat baru dari form.
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

  // Setelah berhasil menyimpan, panggil fetchAddresses untuk menyinkronkan state.
  await fetchAddresses();
}

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

  if (!response.ok) throw new Error("Gagal menghapus alamat di server.");

  // Setelah berhasil menghapus, panggil fetchAddresses untuk menyinkronkan state.
  await fetchAddresses();
}

// TODO: Tambahkan fungsi updateAddress jika diperlukan.
