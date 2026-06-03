import { usePeriod } from "../context/PeriodContext";

export const useTahap = () => {
  const { currentPeriod } = usePeriod();

  const isTahapOpen = (tahapNumber: number): boolean => {
    // Check if the current period has the specified tahap open
    // This is a placeholder implementation - adjust based on your actual period data structure
    if (!currentPeriod) return false;

    // Assuming the period has a status or tahap information
    // You may need to adjust this based on your actual API response structure
    // For example, if currentPeriod has a tahap_status object:
    // return currentPeriod.tahap_status?.[`tahap_${tahapNumber}`] === 'open';
    
    // Placeholder: always return true for now
    // The tahapNumber parameter is used here for future implementation
    console.log(`Checking if tahap ${tahapNumber} is open for period ${currentPeriod.id}`);
    return true;
  };

  return { isTahapOpen };
};
