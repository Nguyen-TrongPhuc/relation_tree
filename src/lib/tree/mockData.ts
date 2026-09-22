import { buildTreeState, getVietnamTime, formatYYYYMMDD } from '@/lib/tree/engine';

export const MOCK_START_DATE = "2026-11-20";

export function getMockTreeState(asOfDate?: string) {
  const startDate = MOCK_START_DATE;
  
  // Giả lập ngày xem đến 20/11 năm sau
  const endDate = new Date("2027-11-20T00:00:00Z");
  const todayStr = asOfDate ?? "2027-11-20";

  // Tạo mock data
  const rawDailyData: { date: string; activity: number }[] = [];
  
  let current = new Date("2026-11-20T00:00:00Z");
  while (current <= endDate) {
    const dStr = formatYYYYMMDD(current);
    
    let activity = 0;
    const m = current.getMonth();
    
    if (m === 10) activity = 0.8; // Tháng 11
    else if (m === 11) activity = 0.7; // Tháng 12
    else if (m === 0) activity = 0.2; // Tháng 1
    else if (m === 1) activity = 0.5; // Tháng 2
    else activity = Math.random();
    
    // Thỉnh thoảng có ngày 0 activity
    if (Math.random() > 0.9) activity = 0;
    
    rawDailyData.push({ date: dStr, activity });
    current.setDate(current.getDate() + 1);
  }

  const events = [
    { type: "anniversary", date: "2026-12-20" },
    { type: "memory", date: "2027-01-15" }
  ];

  return buildTreeState(startDate, todayStr, rawDailyData, events);
}
