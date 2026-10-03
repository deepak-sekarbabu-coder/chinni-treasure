import { PRODUCT_BADGES } from "@/src/lib/constants";
import type { ProductFormData } from "@/src/types";

/**
 * The product form draft — the editable state of a Product in the admin form.
 *
 * Pure, no React: the three 14-field lists (empty state, product → form,
 * form → payload) live here so a new field is one line, not three. The
 * controller holds one `useState` via `useAdminCrud` and supplies these.
 *
 * Image edits are NOT here — `image-set.ts` owns that invariant.
 */

/** Blank form for a create; also restores the form after close. */
export const EMPTY_PRODUCT_DRAFT: ProductFormData = {
  id: "",
  name: "",
  sku: "",
  description: "",
  price: "",
  compareAtPrice: "",
  stockQuantity: "",
  imageUrl: "",
  badge: "",
  categoryId: "",
  isActive: true,
  allowGiftBoxBundling: false,
  visibleHostnames: "",
  images: [],
};

/** The form's shape for a stored product. The stored badge is a plain string;
 *  the form only offers the shared vocabulary, so an unrecognised value falls
 *  back to "None" rather than rendering a select with no matching option. */
export function draftFromProduct(product: {
  id: string;
  name: string;
  sku: string | null;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  stockQuantity: number;
  imageUrl: string | null;
  badge: string | null;
  categoryId: number | null;
  isActive: boolean;
  allowGiftBoxBundling?: boolean | null;
  visibleHostnames?: string | null;
  images?: { url: string; isPrimary: boolean; displayOrder: number }[] | null;
}): ProductFormData {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku || "",
    description: product.description || "",
    price: product.price.toString(),
    compareAtPrice: product.compareAtPrice?.toString() ?? "",
    stockQuantity: product.stockQuantity.toString(),
    imageUrl: product.imageUrl || "",
    badge: PRODUCT_BADGES.find((b) => b === product.badge) ?? "",
    categoryId: product.categoryId ? product.categoryId.toString() : "",
    isActive: product.isActive,
    allowGiftBoxBundling: product.allowGiftBoxBundling ?? false,
    visibleHostnames: product.visibleHostnames || "",
    images: (product.images || []).map((img) => ({
      url: img.url,
      isPrimary: img.isPrimary,
      displayOrder: img.displayOrder,
    })),
  };
}

/** Return an error message to block the save, or null to proceed. */
export function validateProductDraft(form: ProductFormData): string | null {
  if (!form.name.trim()) return "Product name is required";
  const price = parseFloat(form.price);
  if (Number.isNaN(price) || price <= 0) return "Price must be greater than zero";
  return null;
}

/** Form → the write contract's input. Omitted fields are left undefined so
 *  the update contract can tell "cleared" from "untouched". */
export function productDraftPayload(form: ProductFormData) {
  const compareAtPrice = form.compareAtPrice ? parseFloat(form.compareAtPrice) : null;
  return {
    name: form.name.trim(),
    sku: form.sku.trim() || undefined,
    description: form.description,
    price: parseFloat(form.price),
    compareAtPrice: compareAtPrice && compareAtPrice > 0 ? compareAtPrice : null,
    stockQuantity: parseInt(form.stockQuantity) || 0,
    imageUrl: form.imageUrl || undefined,
    badge: form.badge || null,
    categoryId: form.categoryId ? parseInt(form.categoryId) : null,
    isActive: form.isActive,
    allowGiftBoxBundling: form.allowGiftBoxBundling,
    visibleHostnames: form.visibleHostnames || undefined,
    // Always the array, never undefined: the form holds the whole desired
    // gallery, so `[]` means "cleared it". Sending undefined here made
    // `updateProduct`'s `images !== undefined` guard skip the replace and
    // leave the old rows in the database.
    images: form.images.map((img) => ({
      url: img.url,
      isPrimary: img.isPrimary,
      displayOrder: img.displayOrder,
    })),
  };
}