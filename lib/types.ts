export type StoreBusiness = {
  id: string;
  slug: string;
  name: string;
  ownerName: string;
  phone: string;
};

export type StoreProduct = {
  id: string;
  name: string;
  sku?: string | null;
  imageUrl?: string | null;
  images: string[];
  price: string;
  stock: number;
  colors: string[];
  sizes: string[];
};

export type PaginatedProducts = {
  items: StoreProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type BusinessProfile = {
  id: string;
  slug: string;
  name: string;
  ownerName: string;
  phone: string;
};
