export interface User {
  _id: string;
  username: string;
  phone: string;
  profileImage?: string;
}

export interface Car {
  _id: string;
  user: string | { _id: string; username: string; phone: string }; // Allow user as string or object
  make: string;
  model: string;
  priceUSD: string;
  priceSYP: string;
  year: string;
  kilometer: string;
  engineSize: string;
  location: string;
  transmission: string;
  fuelType: string;
  exteriorColor: string;
  interiorColor: string;
  features: string[];
  description: string;
  images: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: string;
  message: string;
  image?: string;
  read: boolean;
  createdAt: string;
}

export interface Wishlist {
  _id: string;
  user: string;
  car: string;
}
