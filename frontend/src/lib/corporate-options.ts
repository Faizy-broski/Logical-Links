// Dropdown options for the corporate customer company profile (register page,
// admin add-customer sheet / detail page, customer's own Company page).
// Values are stored as the plain label text, so existing free-text records keep
// working — CompanyOptionSelect adds a stored value that isn't in the list.

export const ORGANIZATION_TYPES = [
  "Hospital / Healthcare",
  "Pharmacy",
  "Laboratory / Diagnostics",
  "Clinic / Medical Practice",
  "Long-Term Care / Senior Living",
  "Home Healthcare",
  "Medical Supplier / Distributor",
  "Healthcare Logistics / Courier",
  "Retail",
  "Corporate / Office",
  "Automotive",
  "Food / Restaurant",
  "Grocery / Supermarket",
  "Manufacturing",
  "Aerospace / Aviation",
  "Construction",
  "Industrial",
  "Technology",
  "Professional Services",
  "Government / Public Sector",
  "Education",
  "Hospitality",
  "Real Estate / Property Management",
  "Other",
] as const;

export const PHONE_TYPES = [
  "Direct Contact",
  "Direct Department",
  "Pharmacy",
  "Operations",
  "Dispatch",
  "General",
  "Reception",
] as const;

// Canadian provinces and territories (the app is Canada-only).
export const PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
] as const;

export const OTHER_CITY = "Other";

// Major cities per province. "Other" lets a customer outside this list type theirs.
export const CITIES_BY_PROVINCE: Record<(typeof PROVINCES)[number], string[]> = {
  Alberta: ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "St. Albert", "Medicine Hat", "Grande Prairie", "Airdrie", "Spruce Grove", "Fort McMurray", "Okotoks", "Cochrane"],
  "British Columbia": ["Vancouver", "Surrey", "Burnaby", "Richmond", "Abbotsford", "Coquitlam", "Kelowna", "Langley", "Victoria", "Saanich", "Delta", "Nanaimo", "Kamloops", "Prince George", "Chilliwack", "North Vancouver", "New Westminster", "Maple Ridge"],
  Manitoba: ["Winnipeg", "Brandon", "Steinbach", "Thompson", "Portage la Prairie", "Winkler"],
  "New Brunswick": ["Moncton", "Saint John", "Fredericton", "Dieppe", "Miramichi", "Bathurst"],
  "Newfoundland and Labrador": ["St. John's", "Mount Pearl", "Corner Brook", "Conception Bay South", "Paradise", "Gander"],
  "Northwest Territories": ["Yellowknife", "Hay River", "Inuvik"],
  "Nova Scotia": ["Halifax", "Dartmouth", "Sydney", "Truro", "New Glasgow", "Lower Sackville"],
  Nunavut: ["Iqaluit", "Rankin Inlet", "Arviat"],
  Ontario: ["Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton", "London", "Markham", "Vaughan", "Kitchener", "Windsor", "Richmond Hill", "Oakville", "Burlington", "Oshawa", "Barrie", "St. Catharines", "Cambridge", "Guelph", "Kingston", "Waterloo", "Whitby", "Ajax", "Pickering", "Milton", "Georgetown", "Thunder Bay", "Sudbury", "Niagara Falls", "Peterborough", "Sarnia"],
  "Prince Edward Island": ["Charlottetown", "Summerside", "Stratford", "Cornwall"],
  Quebec: ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil", "Sherbrooke", "Saguenay", "Lévis", "Trois-Rivières", "Terrebonne", "Saint-Jean-sur-Richelieu", "Repentigny", "Brossard", "Drummondville"],
  Saskatchewan: ["Saskatoon", "Regina", "Prince Albert", "Moose Jaw", "Swift Current", "Yorkton", "North Battleford"],
  Yukon: ["Whitehorse", "Dawson City", "Watson Lake"],
};

export function citiesForProvince(province: string): string[] {
  return CITIES_BY_PROVINCE[province as keyof typeof CITIES_BY_PROVINCE] ?? [];
}
