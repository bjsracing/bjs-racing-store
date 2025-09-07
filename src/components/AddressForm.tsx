// File: src/components/AddressForm.tsx
// Deskripsi: Form tambah/ubah alamat dengan pencarian kota otomatis RajaOngkir.

import React, { useState, useEffect, useCallback } from "react";
import type { Address, FormDataState } from "@/stores/addressStore";
import { addAddress, updateAddress } from "@/stores/addressStore";

// --- Tipe Data ---
interface RajaOngkirResult {
  subdistrict_id: string;
  subdistrict_name: string;
  district_name: string; // Kecamatan
  city_name: string;
  province_name: string;
  zip_code: string;
}

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

// --- Komponen React ---
export default function AddressForm({
  isOpen,
  onClose,
  addressToEdit,
}: AddressFormProps) {
  // --- State Form Utama ---
  const [formData, setFormData] = useState<FormDataState>(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // --- State untuk Pencarian RajaOngkir ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RajaOngkirResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- Efek untuk mengisi form saat mode edit ---
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
        // Set input pencarian agar sesuai dengan data yang ada saat edit
        setSearchQuery(addressToEdit.destination_text || "");
      } else {
        setFormData(initialFormState);
        setSearchQuery("");
      }
      setErrorMessage("");
      setSearchResults([]);
      setIsDropdownOpen(false);
    }
  }, [addressToEdit, isOpen]);

  // --- Logika Pencarian Kota RajaOngkir dengan Debounce ---
  const performSearch = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/rajaongkir/search-city?query=${encodeURIComponent(query)}`,
      );
      if (!response.ok) throw new Error("Gagal mencari kota.");
      const results: RajaOngkirResult[] = await response.json();
      setSearchResults(results);
      setIsDropdownOpen(true);
    } catch (error) {
      console.error("RajaOngkir search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      // Hanya lakukan pencarian jika query tidak sama dengan teks destinasi yang sudah dipilih
      if (searchQuery && searchQuery !== formData.destination_text) {
        performSearch(searchQuery);
      }
    }, 500); // Tunda 500ms setelah pengguna berhenti mengetik

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, formData.destination_text, performSearch]);

  // --- Event Handlers ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Jika pengguna mengetik manual, hapus ID destinasi yang tersimpan sebelumnya
    setFormData((prev) => ({ ...prev, destination: "" }));
  };

  const handleCitySelect = (city: RajaOngkirResult) => {
    const fullText = `${city.subdistrict_name}, ${city.district_name}, ${city.city_name}, ${city.province_name}`;
    setFormData((prev) => ({
      ...prev,
      destination: city.subdistrict_id,
      destination_text: fullText,
      postal_code: city.zip_code,
    }));
    setSearchQuery(fullText); // Set teks input ke hasil pilihan
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    // Validasi: Pastikan ID destinasi sudah dipilih, bukan hanya teks manual
    if (!formData.destination) {
      setErrorMessage(
        "Kota/Kecamatan harus dipilih dari hasil pencarian dropdown.",
      );
      setIsLoading(false);
      return;
    }
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

  // --- Render JSX ---
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

            {/* Form Fields */}
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4">
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

              {/* --- Input Pencarian Kota RajaOngkir --- */}
              <div className="relative">
                <label
                  htmlFor="city-search"
                  className="block text-sm font-medium text-gray-700"
                >
                  Kota / Kabupaten / Kecamatan
                </label>
                <input
                  type="text"
                  id="city-search"
                  autoComplete="off"
                  placeholder="Ketik min. 3 huruf (misal: Bandung)"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {/* --- Dropdown Hasil Pencarian --- */}
                {isDropdownOpen &&
                  (searchResults.length > 0 || isSearching) && (
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5">
                      {isSearching && (
                        <div className="p-2 text-gray-500">Mencari...</div>
                      )}
                      {searchResults.map((city) => (
                        <div
                          key={city.subdistrict_id}
                          onClick={() => handleCitySelect(city)}
                          className="cursor-pointer p-2 hover:bg-orange-100"
                        >
                          <div className="font-semibold text-gray-800">{`${city.subdistrict_name}, ${city.district_name}`}</div>
                          <div className="text-xs text-gray-500">{`${city.city_name}, ${city.province_name}`}</div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
              {/* --- Akhir Input Pencarian Kota --- */}

              <div>
                <label
                  htmlFor="full_address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Alamat Lengkap
                </label>
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
                  readOnly
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>
          {/* Tombol Aksi Form */}
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
