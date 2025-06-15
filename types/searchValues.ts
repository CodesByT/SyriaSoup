// src/types/index.ts
export interface SearchValue {
  make: string;
  model: string;
  location: string[]; // IMPORTANT: Allows both single string and array of strings
  cylinder: string;
  transmission: string;
  fuelType: string;
  exteriorColor: string;
  interiorColor: string;
  priceMin: string;
  priceMax: string;
  yearMin: string;
  yearMax: string;
  kilometerMin: string;
  kilometerMax: string;
}

// You can add other shared interfaces here if needed in the future
