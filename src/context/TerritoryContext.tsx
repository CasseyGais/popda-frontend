import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";

export interface Territory {
  id: number;
  name: string;
  type: "PROVINSI" | "KABUPATEN" | "KOTA";
}

interface TerritoryContextType {
  currentTerritory: Territory | null;
  availableTerritories: Territory[];
  loading: boolean;
  changeTerritory: (territoryId: number) => Promise<void>;
}

const TerritoryContext = createContext<TerritoryContextType | undefined>(undefined);

export const TerritoryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [currentTerritory, setCurrentTerritory] = useState<Territory | null>(null);
  const [availableTerritories, setAvailableTerritories] = useState<Territory[]>([]);
  const loading = false;

  useEffect(() => {
    if (user?.territories && user.territories.length > 0) {
      setAvailableTerritories(user.territories);
      
      const storedTerritoryId = localStorage.getItem("current_territory_id");
      if (storedTerritoryId) {
        const storedTerritory = user.territories.find(
          (t) => t.id === parseInt(storedTerritoryId)
        );
        if (storedTerritory) {
          setCurrentTerritory(storedTerritory);
        } else {
          setCurrentTerritory(user.territories[0]);
        }
      } else {
        setCurrentTerritory(user.territories[0]);
      }
    } else {
      setAvailableTerritories([]);
      setCurrentTerritory(null);
    }
  }, [user]);

  const changeTerritory = async (territoryId: number) => {
    const territory = availableTerritories.find((t) => t.id === territoryId);
    if (territory) {
      setCurrentTerritory(territory);
      localStorage.setItem("current_territory_id", territoryId.toString());
    }
  };

  return (
    <TerritoryContext.Provider
      value={{
        currentTerritory,
        availableTerritories,
        loading,
        changeTerritory,
      }}
    >
      {children}
    </TerritoryContext.Provider>
  );
};

export const useTerritory = () => {
  const context = useContext(TerritoryContext);

  if (context === undefined) {
    throw new Error("useTerritory must be used within a TerritoryProvider");
  }

  return context;
};