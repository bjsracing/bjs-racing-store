// File: src/components/AddressSection.tsx
import React, { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import {
  addressListStore,
  fetchAddresses,
  deleteAddress,
  type Address,
} from "@/stores/addressStore";
import AddressForm from "./AddressForm"; // Impor komponen form React

// Komponen Kartu Alamat (didefinisikan di file yang sama atau impor terpisah)
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
    <div className="bg-white shadow-md rounded-xl p-5 mb-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-lg text-slate-800">
            {address.label || "Alamat"}
          </h3>
          {address.is_primary && (
            <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
              Utama
            </span>
          )}
        </div>
        <div className="relative group">
          {/* Tombol Opsi (Edit/Delete) */}
          <button className="text-slate-500 hover:text-slate-800">...</button>
          <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border z-10 hidden group-hover:block">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onEdit();
              }}
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-gray-100"
            >
              Ubah Alamat
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
              className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Hapus
            </a>
          </div>
        </div>
      </div>
      <hr />
      <div className="space-y-3 text-slate-600">
        <p>
          <strong>Penerima:</strong> {address.recipient_name}
        </p>
        <p>
          <strong>Telepon:</strong> {address.recipient_phone}
        </p>
        <p>
          <strong>Alamat:</strong> {address.full_address}
        </p>
        <p className="text-sm text-slate-500">
          {address.destination_text} {address.postal_code}
        </p>
      </div>
    </div>
  );
}

// Komponen Utama Section Alamat
export default function AddressSection() {
  // --- Nano Stores Subscription ---
  // useStore akan secara otomatis berlangganan perubahan di addressListStore.
  const addresses = useStore(addressListStore);

  // --- State Lokal untuk Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);

  // --- Pengambilan Data Awal ---
  useEffect(() => {
    // Panggil fetchAddresses saat komponen pertama kali dimuat.
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
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Tambah Alamat Baru
        </button>
      </div>

      {/* Render Daftar Alamat */}
      <div id="address-list-container">
        {addresses.length === 0 ? (
          <p>Memuat alamat atau Anda belum memiliki alamat tersimpan.</p>
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
