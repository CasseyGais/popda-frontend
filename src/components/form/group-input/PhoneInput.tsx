// src/components/form/group-input/PhoneInput.tsx
import { useState, useEffect } from "react";

interface CountryCode {
  code: string;
  label: string;
}

interface PhoneInputProps {
  countries: CountryCode[];
  placeholder?: string;
  value?: string; // ← tambah ini untuk nilai awal dari luar
  onChange?: (phoneNumber: string) => void; // ← tambah ini untuk kirim perubahan ke parent
  selectPosition?: "start" | "end";
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  countries,
  placeholder = "+62 812 3456 7890",
  value = "",
  onChange,
  selectPosition = "start",
}) => {
  // State untuk input field (tanpa country code)
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("ID");

  // Initialize dengan value dari parent, tapi tidak update setiap saat berubah
  useEffect(() => {
    if (value) {
      const phoneWithoutCode = value.replace(/^\+\d+/, "");
      setInputValue(phoneWithoutCode);
      
      const countryCode = countries.find(country => value.startsWith(country.label))?.code || "ID";
      setSelectedCountry(countryCode);
    }
  }, []); // Hanya jalankan sekali saat mount

  // Sync dengan external value jika berubah (tapi bukan dari internal change)
  useEffect(() => {
    if (value && !inputValue) {
      const phoneWithoutCode = value.replace(/^\+\d+/, "");
      setInputValue(phoneWithoutCode);
      
      const countryCode = countries.find(country => value.startsWith(country.label))?.code || "ID";
      setSelectedCountry(countryCode);
    }
  }, [value, countries]);

  const countryCodes: Record<string, string> = countries.reduce(
    (acc, { code, label }) => ({ ...acc, [code]: label }),
    {}
  );

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    setSelectedCountry(newCountry);
    const fullNumber = countryCodes[newCountry] + inputValue;
    if (onChange) onChange(fullNumber);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value.replace(/[^0-9]/g, "");
    setInputValue(newInput);
    const fullNumber = countryCodes[selectedCountry] + newInput;
    if (onChange) onChange(fullNumber);
  };

  return (
    <div className="relative flex">
      {/* Dropdown */}
      {selectPosition === "start" && (
        <div className="absolute inset-y-0 left-0 flex items-center z-10">
          <select
            value={selectedCountry}
            onChange={handleCountryChange}
            className="h-full appearance-none bg-transparent border-r border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:border-brand-500 dark:border-gray-600 dark:text-gray-300"
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Input */}
      <input
        type="tel"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-gray-300 bg-white py-3 px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
          selectPosition === "start" ? "pl-16" : "pr-16"
        }`}
        style={{ zIndex: 1 }}
      />

      {/* Hapus prefix display yang duplicate */}

      {/* Dropdown position end */}
      {selectPosition === "end" && (
        <div className="absolute inset-y-0 right-0 flex items-center z-10">
          <select
            value={selectedCountry}
            onChange={handleCountryChange}
            className="h-full appearance-none bg-transparent border-l border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:border-brand-500 dark:border-gray-600 dark:text-gray-300"
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default PhoneInput;