// File: src/components/AddressForm.tsx
import React, { useState, useEffect } from "react";
import type { Address, FormDataState } from "@/stores/addressStore";
import { addAddress, updateAddress } from "@/stores/addressStore";

interface AddressFormProps {
  isOpen: boolean;
  onClose: () => void;
  addressToEdit?: Address | null;
}

const initialFormState: FormDataState = {
  label: "",
  recipient_name: "",
  recipient_phone: "",
  destination: "",
  destination_text: "",
  full_address: "",
  postal_code: "",
};

export default function AddressForm({
  isOpen,
  onClose,
  addressToEdit,
}: AddressFormProps) {
  const [formData, setFormData] = useState<FormDataState>(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (addressToEdit) {
        setFormData({
          label: addressToEdit.label || "",
          recipient_name: addressToEdit.recipient_name || "",
          recipient_phone: addressToEdit.recipient_phone || "",
          destination: addressToEdit.destination || "",
          destination_text: addressToEdit.destination_text || "",
          full_address: addressToEdit.full_address || "",
          postal_code: addressToEdit.postal_code || "",
        });
      } else {
        setFormData(initialFormState);
      }
      setErrorMessage("");
    }
  }, [addressToEdit, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    if (
      !formData.recipient_name ||
      !formData.recipient_phone ||
      !formData.full_address
    ) {
      setErrorMessage("Nama, telepon, dan alamat lengkap wajib diisi.");
      setIsLoading(false);
      return;
    }

    try {
      const dataToSubmit = { ...formData };

      if (addressToEdit) {
        await updateAddress(addressToEdit.id, dataToSubmit);
      } else {
        await addAddress(dataToSubmit);
      }
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Terjadi kesalahan.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all">
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-xl font-bold">
                {addressToEdit ? "Ubah Alamat" : "Tambah Alamat Baru"}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-800 text-3xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4">
              {/* Input Fields */}
              <div>
                <label
                  htmlFor="label"
                  className="block text-sm font-medium text-gray-700"
                >
                  Label Alamat
                </label>
                <input
                  type="text"
                  id="label"
                  name="label"
                  value={formData.label}
                  onChange={handleChange}
                  placeholder="Contoh: Rumah, Kantor"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label
                  htmlFor="recipient_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nama Penerima
                </label>
                <input
                  type="text"
                  id="recipient_name"
                  name="recipient_name"
                  value={formData.recipient_name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label
                  htmlFor="recipient_phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  id="recipient_phone"
                  name="recipient_phone"
                  value={formData.recipient_phone}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label
                  htmlFor="destination_text"
                  className="block text-sm font-medium text-gray-700"
                >
                  Kota / Kabupaten (Input Manual Sementara)
                </label>
                <input
                  type="text"
                  id="destination_text"
                  name="destination_text"
                  value={formData.destination_text}
                  onChange={handleChange}
                  placeholder="Misal: Kecamatan Coblong, Kota Bandung"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label
                  htmlFor="full_address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Alamat Lengkap
                </label>
                {/* --- PERBAIKAN TYPO JSX (Error 3) --- */}
                <textarea
                  id="full_address"
                  name="full_address"
                  value={formData.full_address}
                  onChange={handleChange}
                  rows={3}
                  required
                  placeholder="Nama jalan, nomor rumah, RT/RW"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-orange-500 focus:border-orange-500"
                ></textarea>
              </div>
              <div>
                <label
                  htmlFor="postal_code"
                  className="block text-sm font-medium text-gray-700"
                >
                  Kode Pos
                </label>
                <input
                  type="text"
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg items-center">
            {errorMessage && (
              <p className="text-red-500 text-sm mr-auto">{errorMessage}</p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-orange-500 text-white font-bold px-4 py-2 rounded-md hover:bg-orange-600 transition-opacity disabled:opacity-50"
            >
              {isLoading ? "Menyimpan..." : "Simpan Alamat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
