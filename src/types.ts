export interface User {
  uid: string;
  email: string;
  university?: string; // Derived from .edu or static for alpha
}

export interface Listing {
  id: string;
  sellerId: string;
  sellerEmail: string;
  title: string;
  category: string;
  description: string;
  estimatedOriginalPrice: number;
  suggestedSalePrice: number;
  imageUrls: string[];
  location: {
    lat: number;
    lng: number;
  };
  buildingOrArea: string; // "Lobby", "Dorm B", etc
  createdAt: number;
  status: "available" | "sold" | "draft";
  condition?: "new" | "like_new" | "good" | "fair";
  whatsappNumber?: string;
  isLocalOnly?: boolean;
}

export interface DraftListing {
  title: string;
  category: string;
  description: string;
  estimatedOriginalPrice: number;
  suggestedSalePrice: number;
  condition?: "new" | "like_new" | "good" | "fair";
  whatsappNumber?: string;
}
