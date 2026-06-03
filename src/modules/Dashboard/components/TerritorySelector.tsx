import { useState } from "react";
import { useTerritory } from "../../../context/TerritoryContext";

const TerritorySelector: React.FC = () => {
  const { currentTerritory, availableTerritories, loading, changeTerritory } =
    useTerritory();
  const [isOpen, setIsOpen] = useState(false);
  const [changing, setChanging] = useState(false);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  const handleChange = async (territoryId: number) => {
    if (territoryId === currentTerritory?.id) return;

    try {
      setChanging(true);
      await changeTerritory(territoryId);
      setIsOpen(false);
    } catch (err) {
      console.error("Gagal mengganti wilayah:", err);
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={changing}
        className="flex items-center gap-2 px-3 py-2 min-w-[200px] max-w-[280px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        {/* Map pin icon — solid, lebih jelas */}
        <svg
          className="w-4 h-4 flex-shrink-0 text-brand-500 dark:text-brand-400"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.961-5.247 3.961-9.067V9.75a8.25 8.25 0 00-16.5 0v.518c0 3.82 2.017 6.988 3.96 9.067a19.58 19.58 0 002.684 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
          />
        </svg>

        <span className="flex-1 font-medium text-sm text-gray-900 dark:text-white truncate text-left">
          {currentTerritory ? currentTerritory.name : "Tidak ada wilayah"}
        </span>

        <svg
          className={`w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20">
            <div className="p-2">
              <div className="flex items-center gap-2 px-3 py-2 mb-1">
                <svg className="w-3.5 h-3.5 text-brand-500" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.961-5.247 3.961-9.067V9.75a8.25 8.25 0 00-16.5 0v.518c0 3.82 2.017 6.988 3.96 9.067a19.58 19.58 0 002.684 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pilih Wilayah
                </span>
              </div>

              {availableTerritories.length === 0 && (
                <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  Tidak ada wilayah tersedia
                </div>
              )}

              {availableTerritories.map((territory) => {
                const isSelected = territory.id === currentTerritory?.id;

                return (
                  <button
                    key={territory.id}
                    onClick={() => handleChange(territory.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors mb-0.5 flex items-center gap-3 ${
                      isSelected
                        ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {/* Checkmark hanya untuk yang terpilih */}
                    <div className={`w-4 h-4 flex-shrink-0 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? "border-brand-500 bg-brand-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm truncate ${isSelected ? "text-brand-700 dark:text-brand-300" : "text-gray-900 dark:text-white"}`}>
                        {territory.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {territory.type}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TerritorySelector;