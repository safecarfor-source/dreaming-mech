export interface Mechanic {
  id: number;
  name: string;
  location: string;
  phone: string;
  description?: string;
  address: string;
  mapLat: number;
  mapLng: number;
  mainImageUrl?: string;
  galleryImages?: string[];
  youtubeUrl?: string;
  clickCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Admin {
  id: number;
  email: string;
  name?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodingResult {
  address: string;
  lat: number;
  lng: number;
}
