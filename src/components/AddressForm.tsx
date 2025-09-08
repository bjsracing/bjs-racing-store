// File: src/components/AddressForm.tsx
// Perbaikan: Menggunakan React.lazy untuk memastikan komponen peta hanya dirender di browser.

import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useAppStore } from "@/lib/store.ts";
import type { Address, FormDataState } from "@/lib/store.ts";

// PERBAIKAN 1: Impor komponen peta secara dinamis
const MapPicker = lazy(() => import("./MapPicker"));

// Tipe data untuk hasil pencarian dari API Komerce
interface KomerceSearchResult {
  id: number;
  label: string;
  subdistrict_name: string;
  district_name: string;
  city_name: string;
  province_name: string;
  zip_code: string;
}

// Tipe props untuk komponen form
interface AddressFormProps {
  isOpen: boolean;
  onClose: () => void;
  addressToEdit?: Address | null;
}

// State awal untuk form
const initialFormState: FormDataState = {
  label: "",
  recipient_name: "",
  recipient_phone: "",
  destination: "",
  destination_text: "",
  full_address: "",
  postal_code: "",
  latitude: -6.2088,
  longitude: 106.8456,
};

export default function AddressForm({
  isOpen,
  onClose,
  addressToEdit,
}: AddressFormProps) {
  const [formData, setFormData] = useState<FormDataState>(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<KomerceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const addAddress = useAppStore((state) => state.addAddress);
  const updateAddress = useAppStore((state) => state.updateAddress);

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
          latitude: addressToEdit.latitude || initialFormState.latitude,
          longitude: addressToEdit.longitude || initialFormState.longitude,
        });
        setSearchQuery(addressToEdit.destination_text || "");
        setShowMap(true);
      } else {
        setFormData(initialFormState);
        setSearchQuery("");
        setShowMap(false);
      }
      setErrorMessage("");
      setSearchResults([]);
      setIsDropdownOpen(false);
    }
  }, [addressToEdit, isOpen]);

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
      if (!response.ok) throw new Error("Gagal mencari destinasi.");
      const results: KomerceSearchResult[] = await response.json();
      setSearchResults(results);
      setIsDropdownOpen(true);
    } catch (error) {
      console.error("Komerce search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery && searchQuery !== formData.destination_text) {
        performSearch(searchQuery);
      }
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, formData.destination_text, performSearch]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    if (newQuery !== formData.destination_text) {
      setFormData((prev) => ({ ...prev, destination: "" }));
      setShowMap(false);
    }
  };

  const handleCitySelect = (city: KomerceSearchResult) => {
    setFormData((prev) => ({
      ...prev,
      destination: String(city.id),
      destination_text: city.label,
      postal_code: city.zip_code,
    }));
    setSearchQuery(city.label);
    setIsDropdownOpen(false);
    setShowMap(true);
  };

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    if (!formData.destination) {
      setErrorMessage("Area destinasi harus dipilih dari hasil pencarian.");
      setIsLoading(false);
      return;
    }
    if (!formData.latitude || !formData.longitude) {
      setErrorMessage("Mohon tentukan titik lokasi di peta.");
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
      if (addressToEdit) {
        await updateAddress(addressToEdit.id, formData);
      } else {
        await addAddress(formData);
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>

              <div className="relative">
                <label
                  htmlFor="city-search"
                  className="block text-sm font-medium text-gray-700"
                >
                  Cari Kecamatan / Kota
                </label>
                <input
                  type="text"
                  id="city-search"
                  autoComplete="off"
                  placeholder="Ketik min. 3 huruf..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
                {isDropdownOpen &&
                  (searchResults.length > 0 || isSearching) && (
                    <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5">
                      {isSearching && (
                        <div className="p-2 text-gray-500">Mencari...</div>
                      )}
                      {searchResults.map((city) => (
                        <div
                          key={city.id}
                          onMouseDown={() => handleCitySelect(city)}
                          className="cursor-pointer p-2 hover:bg-orange-100"
                        >
                          <p className="font-semibold text-gray-800 text-sm">
                            {city.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* PERBAIKAN 2: Bungkus komponen peta dengan Suspense */}
              {showMap && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tentukan Pin Point Lokasi
                  </label>
                  <div className="mt-2">
                    <Suspense
                      fallback={
                        <div className="h-64 w-full flex items-center justify-center bg-gray-100 rounded-lg">
                          Memuat peta...
                        </div>
                      }
                    >
                      <MapPicker
                        key={`${formData.latitude}-${formData.longitude}`}
                        initialLat={formData.latitude}
                        initialLng={formData.longitude}
                        onLocationChange={handleLocationChange}
                      />
                    </Suspense>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="full_address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Alamat Lengkap (Nama Jalan, No. Rumah)
                </label>
                <textarea
                  id="full_address"
                  name="full_address"
                  value={formData.full_address}
                  onChange={handleChange}
                  rows={3}
                  required
                  placeholder="Contoh: Jl. Merdeka No. 10, RT 01/RW 02"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100"
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
