// lib/categories.ts
export type Category = {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
};

export const CATEGORIES: Category[] = [
  {
    id: "womens-fashion",
    name: "Women's Fashion",
    icon: "👗",
    subcategories: ["Tops", "Dresses", "Sarees", "Kurtis", "Jeans", "Skirts"],
  },
  {
    id: "jewelry-accessories",
    name: "Jewelry & Accessories",
    icon: "💍",
    subcategories: ["Necklaces", "Earrings", "Rings", "Bracelets", "Watches", "Hair Accessories"],
  },
  {
    id: "beauty-skincare",
    name: "Beauty & Skincare",
    icon: "💄",
    subcategories: ["Makeup", "Skincare", "Haircare", "Fragrances", "Tools & Brushes"],
  },
  {
    id: "bags-wallets",
    name: "Bags & Wallets",
    icon: "👜",
    subcategories: ["Handbags", "Tote Bags", "Clutches", "Wallets", "Backpacks"],
  },
  {
    id: "shoes-footwear",
    name: "Shoes & Footwear",
    icon: "👠",
    subcategories: ["Heels", "Flats", "Sneakers", "Sandals", "Slippers"],
  },
  {
    id: "home-kitchen",
    name: "Home & Kitchen",
    icon: "🏠",
    subcategories: ["Cookware", "Storage", "Decor", "Bedding", "Lighting"],
  },
  {
    id: "gadgets-electronics",
    name: "Gadgets & Electronics",
    icon: "📱",
    subcategories: ["Earbuds", "Phone Accessories", "Smart Watches", "Chargers"],
  },
  {
    id: "toys-kids",
    name: "Toys & Kids",
    icon: "🧸",
    subcategories: ["Baby Toys", "Kids Clothing", "Educational Toys", "Baby Care"],
  },
  {
    id: "health-wellness",
    name: "Health & Wellness",
    icon: "💪",
    subcategories: ["Supplements", "Personal Care", "Fitness", "Aromatherapy"],
  },
  {
    id: "gifts-stationery",
    name: "Gifts & Stationery",
    icon: "🎁",
    subcategories: ["Gift Boxes", "Journals", "Pens", "Art Supplies", "Greeting Cards"],
  },
];

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getCategoryName(id: string): string {
  return getCategoryById(id)?.name ?? id;
}