export interface CartItem {
  productId: string;
  quantity: number;
  giftBoxes?: Array<{ productId: string; quantity: number }>;
}
