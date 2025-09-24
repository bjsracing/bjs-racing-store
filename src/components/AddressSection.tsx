// File: src/components/AddressSection.tsx
import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import AddressForm from "./AddressForm";
import type { Address } from "@/lib/store";

// --- Komponen Kartu Alamat (Dengan Tipe Data Lengkap) ---
function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetPrimary, // Prop baru
}: {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetPrimary: () => void; // PERBAIKAN 1: Tambahkan tipe untuk prop baru
}) {
  return (
    <div
      className={`bg-white shadow-md rounded-xl flex flex-col transition-all duration-300 ${address.is_primary ? "border-2 border-orange-500" : "border border-transparent"}`}
    >
      <div className="p-5 space-y-3 flex-grow">
        <div className="flex justify-between items-start">
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
        <div className="space-y-2 text-slate-600 text-sm">
          <p className="font-medium text-slate-700">{address.recipient_name}</p>
          <p>{address.recipient_phone}</p>
          <p>{address.full_address}</p>
          <p className="text-sm text-slate-500">
            {address.destination_text} {address.postal_code}
          </p>
        </div>
      </div>
      <div className="flex justify-end items-center space-x-2 p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        {!address.is_primary && (
          <button
            onClick={onSetPrimary}
            className="text-sm font-medium text-green-600 hover:text-green-800 transition-colors px-3 py-1 rounded-md hover:bg-green-50"
          >
            Jadikan Utama
          </button>
        )}
        <button
          onClick={onEdit}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors px-3 py-1 rounded-md hover:bg-blue-50"
        >
          Ubah
        </button>
        <button
          onClick={onDelete}
          className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors px-3 py-1 rounded-md hover:bg-red-50"
        >
          Hapus
        </button>
      </div>
    </div>
  );
}

// --- Komponen Utama Section Alamat ---
export default function AddressSection() {
  const { addresses, fetchAddresses, deleteAddress, addToast } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // PERBAIKAN 2: Gunakan 'addToast' dari store untuk notifikasi
  const handleSetPrimary = async (addressId: string) => {
    try {
      const response = await fetch("/api/addresses/set-primary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address_id: addressId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal menjadikan alamat utama.");
      }
      addToast({ type: "success", message: "Alamat utama berhasil diubah." });
      fetchAddresses();
    } catch (error) {
      addToast({ type: "error", message: (error as Error).message });
    }
  };

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
        addToast({ type: "success", message: "Alamat berhasil dihapus." });
      } catch (error) {
        addToast({ type: "error", message: (error as Error).message });
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
              onSetPrimary={() => handleSetPrimary(address.id)}
            />
          ))
        )}
      </div>
      <AddressForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        addressToEdit={addressToEdit}
      />
    </div>
  );
}
