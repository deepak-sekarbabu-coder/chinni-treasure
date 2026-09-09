export interface ProductFormData {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: string;
  imageUrl: string;
  badge: string;
  categoryId: string;
  isActive: boolean;
  allowGiftBoxBundling: boolean;
  visibleHostnames: string;
  images: Array<{ url: string; isPrimary: boolean; displayOrder: number }>;
}
