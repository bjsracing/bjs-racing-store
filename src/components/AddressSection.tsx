// File: src/components/AddressSection.tsx
// Deskripsi: Perbaikan UI/UX untuk tombol aksi (Ubah/Hapus) agar lebih profesional dan responsif.

import React, { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import {
  addressListStore,
  fetchAddresses,
  deleteAddress,
  type Address,
} from "@/stores/addressStore";
import AddressForm from "./AddressForm"; // Impor komponen form React

// =======================================================================
// == Komponen Internal: AddressCard (UI/UX Improvement)                ==
// =======================================================================
function AddressCard({
  address,
  onEdit,
  onDelete,
}: {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white shadow-md rounded-xl flex flex-col transition-shadow hover:shadow-lg">
      {/* Bagian Utama Konten Kartu */}
      <div className="p-5 space-y-3">
        <div className="flex justify-between items-start">
          {/* Label Alamat dan Badge Utama */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-bold text-lg text-slate-800 break-words">
              {address.label || "Alamat"}
            </h3>
            {address.is_primary && (
              <span className="flex-shrink-0 bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
                Utama
              </span>
            )}
          </div>
        </div>

        {/* Detail Alamat */}
        <div className="space-y-2 text-slate-600 text-sm">
          <p className="font-medium text-slate-700">{address.recipient_name}</p>
          <p>{address.recipient_phone}</p>
          <p>{address.full_address}</p>
          <p className="text-sm text-slate-500">
            {address.destination_text} {address.postal_code}
          </p>
        </div>
      </div>

      {/* --- PERBAIKAN UI/UX ---
        Tombol aksi dipindahkan ke footer kartu agar terlihat jelas.
        Menggunakan flexbox untuk tata letak responsif.
      */}
      <div className="flex justify-end items-center space-x-4 p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <button
          onClick={(e) => {
            e.preventDefault();
            onEdit();
          }}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors px-3 py-1 rounded-md hover:bg-blue-50"
        >
          Ubah
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
          className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors px-3 py-1 rounded-md hover:bg-red-50"
        >
          Hapus
        </button>
      </div>
    </div>
  );
}

// =======================================================================
// == Komponen Utama: AddressSection                                    ==
// =======================================================================
export default function AddressSection() {
  // --- Nano Stores Subscription ---
  const addresses = useStore(addressListStore);

  // --- State Lokal untuk Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);

  // --- Pengambilan Data Awal ---
  useEffect(() => {
    fetchAddresses();
  }, []);

  // --- Event Handlers ---
  const handleAddNew = () => {
    setAddressToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (address: Address) => {
    setAddressToEdit(address);
    setIsModalOpen(true);
  };

  const handleDelete = async (addressId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus alamat ini?")) {
      try {
        await deleteAddress(addressId);
      } catch (error) {
        alert(
          error instanceof Error ? error.message : "Gagal menghapus alamat.",
        );
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Buku Alamat</h2>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Tambah Alamat Baru
        </button>
      </div>

      {/* Render Daftar Alamat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {addresses.length === 0 ? (
          <p className="col-span-full text-center text-gray-500 py-10">
            Memuat alamat atau Anda belum memiliki alamat tersimpan.
          </p>
        ) : (
          addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => handleEdit(address)}
              onDelete={() => handleDelete(address.id)}
            />
          ))
        )}
      </div>

      {/* Modal Form */}
      <AddressForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        addressToEdit={addressToEdit}
      />
    </div>
  );
}
