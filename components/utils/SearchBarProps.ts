// src/components/SearchBar/SearchBar.types.ts

export type SearchBarProps = {
  value: {
    make: string;
    model: string;
    location: string;
  };
  onChange: (search: { make: string; model: string; location: string }) => void;
  placeholder?: string;
};
