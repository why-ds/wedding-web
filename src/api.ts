export type Criteria = {
  date: string; time: string; guests: number; region: string; style: string;
  query: string; budget: number | null; beverages: boolean; sort: string;
};
export type Estimate = {
  venue: { id: string; name: string; hall: string; region: string; address: string;
    style: string; capacity: number; guarantee: number; meal: string; features: string[]; description: string };
  state: 'COMPLETE_FIXED' | 'COMPLETE_RANGE' | 'PARTIAL' | 'UNAVAILABLE';
  totalMin: string | null; totalMax: string | null; knownSubtotal: string; billedGuests: number;
  lines: { label: string; quantity: string; amount: string; explanation: string }[];
  unknownItems: string[]; availabilityState: string; securityState: string; comparisonContext: string; demo: boolean;
};
export type SearchResponse = { results: Estimate[]; count: number; demo: boolean; notice: string };
export const defaults: Criteria = { date: '2027-02-27', time: '12:00', guests: 250, region: '', style: '', query: '', budget: null, beverages: false, sort: 'price' };
export function initialCriteria(): Criteria {
  const p = new URLSearchParams(location.search);
  const guests = Number(p.get('guests') ?? defaults.guests);
  const budget = p.get('budget') ? Number(p.get('budget')) : null;
  return { ...defaults, date: /^2027-\d{2}-\d{2}$/.test(p.get('date') ?? '') ? p.get('date')! : defaults.date,
    time: /^([01]\d|2[0-3]):[0-5]\d$/.test(p.get('time') ?? '') ? p.get('time')! : defaults.time,
    guests: Number.isInteger(guests) && guests >= 1 && guests <= 2000 ? guests : defaults.guests,
    budget: budget !== null && Number.isFinite(budget) && budget >= 0 && budget <= 1000000000 ? budget : null,
    region: p.get('region') ?? '', style: p.get('style') ?? '', query: (p.get('query') ?? '').slice(0,100),
    beverages: p.get('beverages') === 'true', sort: p.get('sort') === 'meal' ? 'meal' : 'price' };
}
export async function search(criteria: Criteria, signal: AbortSignal): Promise<SearchResponse> {
  const response = await fetch('/api/v1/searches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(criteria), signal });
  if (!response.ok) throw new Error(response.status === 400 ? '날짜와 인원 등 검색 조건을 확인해 주세요.' : '검색 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.');
  const p = new URLSearchParams();
  for (const [key,value] of Object.entries(criteria)) if (value !== null && value !== '') p.set(key,String(value));
  history.replaceState(null,'',`?${p}`);
  return response.json();
}
