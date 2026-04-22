// Pure function to handle all filtering and sorting outside the component
export const filterAndSortBids = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bids: any[],
  searchTerm: string,
  selectedStatuses: string[],
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null,
) => {
  let result = [...bids];

  // 1. Filter by Status
  if (selectedStatuses.length > 0) {
    result = result.filter((bid) => selectedStatuses.includes(bid.status));
  }

  // 2. Filter by Search
  if (searchTerm) {
    const lowerSearch = searchTerm.toLowerCase();
    result = result.filter(
      (bid) =>
        (bid.job_name || '').toLowerCase().includes(lowerSearch) ||
        (bid.general_contractor || '').toLowerCase().includes(lowerSearch),
    );
  }

  // 3. Sort Data
  if (sortConfig) {
    result.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      // Handle numerical sorting for money/numbers
      if (['final_bid_amount', 'distance', 'sqft'].includes(sortConfig.key)) {
        const aNum = Number(aVal) || 0;
        const bNum = Number(bVal) || 0;
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // Handle string sorting
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return result;
};
