// lib/categories.ts
// Bangladesh-focused catalog.
// Backwards compatible: `name` and `icon` still exist on every category.
// New additive fields: `slug` and `image` on subcategories + `image` on categories.

export type Subcategory = {
  name: string;        // display name (backwards compat)
  slug: string;        // url slug, also fine to keep same as name for now
  image: string;       // preview image URL (CDN, no repo bloat)
};

export type Category = {
  id: string;
  name: string;
  icon: string;        // emoji (backwards compat, used in header drawer + tiles)
  image: string;       // hero image for the category card
  subcategories: Subcategory[];
};

// Helper: unsplash source URLs with stable photo IDs (fast, cached, no key)
const U = (id: string, w = 600, h = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

export const CATEGORIES: Category[] = [
  // =============================================================
  // 1. WOMEN'S FASHION
  // =============================================================
  {
    id: "womens-fashion",
    name: "Women's Fashion",
    icon: "👗",
    image: U("photo-1490481651871-ab68de25d43d"),
    subcategories: [
      { name: "Sarees",             slug: "sarees",             image: U("photo-1610030469983-98e550d6193c") },
      { name: "Three Piece",        slug: "three-piece",        image: U("photo-1583391733956-6c78276477e2") },
      { name: "Kurtis",             slug: "kurtis",             image: U("photo-1618354691373-d851c5c3a990") },
      { name: "Salwar Kameez",      slug: "salwar-kameez",      image: U("photo-1594633312681-425c7b97ccd1") },
      { name: "Tops & Blouses",     slug: "tops",               image: U("photo-1564257631407-4deb1f99d992") },
      { name: "Dresses",            slug: "dresses",            image: U("photo-1595777457583-95e059d581b8") },
      { name: "Jeans & Trousers",   slug: "jeans",              image: U("photo-1541099649105-f69ad21f3246") },
      { name: "Skirts",             slug: "skirts",             image: U("photo-1583496661160-fb5886a0aaaa") },
      { name: "Hijabs & Abayas",    slug: "hijabs",             image: U("photo-1600180758890-6b94519a8ba6") },
      { name: "Nightwear",          slug: "nightwear",          image: U("photo-1596755094514-f87e34085b2c") },
    ],
  },

  // =============================================================
  // 2. MEN'S FASHION
  // =============================================================
  {
    id: "mens-fashion",
    name: "Men's Fashion",
    icon: "👔",
    image: U("photo-1516257984-b1b4d707412e"),
    subcategories: [
      { name: "T-Shirts",           slug: "mens-tshirts",        image: U("photo-1521572163474-6864f9cf17ab") },
      { name: "Shirts",             slug: "mens-shirts",         image: U("photo-1596755094514-f87e34085b2c") },
      { name: "Panjabi",            slug: "panjabi",             image: U("photo-1622470953794-aa9c70b0fb9d") },
      { name: "Jeans & Pants",      slug: "mens-jeans",          image: U("photo-1542272604-787c3835535d") },
      { name: "Shorts",             slug: "mens-shorts",         image: U("photo-1591195853828-11db59a44f6b") },
      { name: "Jackets & Hoodies",  slug: "jackets",             image: U("photo-1551028719-00167b16eac5") },
      { name: "Sneakers",           slug: "mens-sneakers",       image: U("photo-1549298916-b41d501d3772") },
      { name: "Formal Shoes",       slug: "mens-formal-shoes",   image: U("photo-1614252369475-531eba835eb1") },
    ],
  },

  // =============================================================
  // 3. JEWELRY & ACCESSORIES
  // =============================================================
  {
    id: "jewelry-accessories",
    name: "Jewelry & Accessories",
    icon: "💍",
    image: U("photo-1515562141207-7a88fb7ce338"),
    subcategories: [
      { name: "Necklaces",          slug: "necklaces",           image: U("photo-1599643478518-a784e5dc4c8f") },
      { name: "Earrings",           slug: "earrings",            image: U("photo-1535632066927-ab7c9ab60908") },
      { name: "Rings",              slug: "rings",               image: U("photo-1605100804763-247f67b3557e") },
      { name: "Bracelets & Bangles",slug: "bracelets",           image: U("photo-1611652022419-a9419f74343d") },
      { name: "Watches",            slug: "watches",             image: U("photo-1524592094714-0f0654e20314") },
      { name: "Hair Accessories",   slug: "hair-accessories",    image: U("photo-1522337360788-8b13dee7a37e") },
      { name: "Sunglasses",         slug: "sunglasses",          image: U("photo-1511499767150-a48a237f0083") },
      { name: "Scarves & Shawls",   slug: "scarves",             image: U("photo-1601924994987-69e26d50dc26") },
    ],
  },

  // =============================================================
  // 4. BEAUTY & SKINCARE
  // =============================================================
  {
    id: "beauty-skincare",
    name: "Beauty & Skincare",
    icon: "💄",
    image: U("photo-1522335789203-aabd1fc54bc9"),
    subcategories: [
      { name: "Makeup",             slug: "makeup",              image: U("photo-1512496015851-a90fb38ba796") },
      { name: "Skincare",           slug: "skincare",            image: U("photo-1556228720-195a672e8a03") },
      { name: "Haircare",           slug: "haircare",            image: U("photo-1522338242992-e1a54906a8da") },
      { name: "Fragrances",         slug: "fragrances",          image: U("photo-1541643600914-78b084683601") },
      { name: "Nail Polish",        slug: "nail-polish",         image: U("photo-1604654894610-df63bc536371") },
      { name: "Tools & Brushes",    slug: "beauty-tools",        image: U("photo-1596704017254-9b121068fb31") },
      { name: "Face Masks",         slug: "face-masks",          image: U("photo-1570172619644-dfd03ed5d881") },
    ],
  },

  // =============================================================
  // 5. BAGS & WALLETS
  // =============================================================
  {
    id: "bags-wallets",
    name: "Bags & Wallets",
    icon: "👜",
    image: U("photo-1548036328-c9fa89d128fa"),
    subcategories: [
      { name: "Handbags",           slug: "handbags",            image: U("photo-1584917865442-de89df76afd3") },
      { name: "Tote Bags",          slug: "tote-bags",           image: U("photo-1591561954557-26941169b49e") },
      { name: "Clutches",           slug: "clutches",            image: U("photo-1566150905458-1bf1fc113f0d") },
      { name: "Wallets",            slug: "wallets",             image: U("photo-1627123424574-724758594e93") },
      { name: "Backpacks",          slug: "backpacks",           image: U("photo-1553062407-98eeb64c6a62") },
      { name: "Crossbody Bags",     slug: "crossbody-bags",      image: U("photo-1548863227-3af567fc3b27") },
      { name: "School Bags",        slug: "school-bags",         image: U("photo-1553062407-98eeb64c6a62") },
    ],
  },

  // =============================================================
  // 6. SHOES & FOOTWEAR
  // =============================================================
  {
    id: "shoes-footwear",
    name: "Shoes & Footwear",
    icon: "👠",
    image: U("photo-1543163521-1bf539c55dd2"),
    subcategories: [
      { name: "Heels",              slug: "heels",               image: U("photo-1543163521-1bf539c55dd2") },
      { name: "Flats",              slug: "flats",               image: U("photo-1560343090-f0409e92791a") },
      { name: "Sneakers",           slug: "sneakers",            image: U("photo-1549298916-b41d501d3772") },
      { name: "Sandals",            slug: "sandals",             image: U("photo-1603487742131-4160ec999306") },
      { name: "Slippers",           slug: "slippers",            image: U("photo-1603487742131-4160ec999306") },
      { name: "Boots",              slug: "boots",               image: U("photo-1608256246200-53e635b5b65f") },
      { name: "Formal Shoes",       slug: "formal-shoes",        image: U("photo-1614252369475-531eba835eb1") },
    ],
  },

  // =============================================================
  // 7. HOME & KITCHEN
  // =============================================================
  {
    id: "home-kitchen",
    name: "Home & Kitchen",
    icon: "🏠",
    image: U("photo-1556909212-d5b604d0c90d"),
    subcategories: [
      { name: "Cookware",           slug: "cookware",            image: U("photo-1556909212-d5b604d0c90d") },
      { name: "Storage & Organizers",slug: "storage",            image: U("photo-1600880292089-90a7e086ee0c") },
      { name: "Home Decor",         slug: "home-decor",          image: U("photo-1513519245088-0e12902e5a38") },
      { name: "Bedding",            slug: "bedding",             image: U("photo-1522771739844-6a9f6d5f14af") },
      { name: "Lighting",           slug: "lighting",            image: U("photo-1524484485831-a92ffc0de03f") },
      { name: "Kitchen Tools",      slug: "kitchen-tools",       image: U("photo-1556910103-1c02745aae4d") },
      { name: "Dinnerware",         slug: "dinnerware",          image: U("photo-1603199506016-51bdb8e5e24a") },
    ],
  },

  // =============================================================
  // 8. GADGETS & ELECTRONICS
  // =============================================================
  {
    id: "gadgets-electronics",
    name: "Gadgets & Electronics",
    icon: "📱",
    image: U("photo-1519389950473-47ba0277781c"),
    subcategories: [
      { name: "Earbuds & Headphones",slug: "earbuds",            image: U("photo-1590658268037-6bf12165a8df") },
      { name: "Phone Accessories",  slug: "phone-accessories",   image: U("photo-1511707171634-5f897ff02aa9") },
      { name: "Smart Watches",      slug: "smart-watches",       image: U("photo-1523275335684-37898b6baf30") },
      { name: "Chargers & Cables",  slug: "chargers",            image: U("photo-1583863788434-e58a36330cf0") },
      { name: "Power Banks",        slug: "power-banks",         image: U("photo-1609592806596-b43bada2f4b8") },
      { name: "Bluetooth Speakers", slug: "speakers",            image: U("photo-1608043152269-423dbba4e7e1") },
      { name: "Phone Cases",        slug: "phone-cases",         image: U("photo-1601593346740-925612772716") },
    ],
  },

  // =============================================================
  // 9. TOYS & BABY
  // =============================================================
  {
    id: "toys-kids",
    name: "Toys & Baby",
    icon: "🧸",
    image: U("photo-1596461404969-9ae70f2830c1"),
    subcategories: [
      { name: "Baby Toys",          slug: "baby-toys",           image: U("photo-1596461404969-9ae70f2830c1") },
      { name: "Kids Clothing",      slug: "kids-clothing",       image: U("photo-1519238263530-99bdd11df2ea") },
      { name: "Educational Toys",   slug: "educational-toys",    image: U("photo-1516627145497-ae6968895b74") },
      { name: "Baby Care",          slug: "baby-care",           image: U("photo-1515488042361-ee00e0ddd4e4") },
      { name: "Strollers & Seats",  slug: "strollers",           image: U("photo-1591088398332-8a7791972843") },
      { name: "Soft Toys",          slug: "soft-toys",           image: U("photo-1559454403-b8fb88521f11") },
    ],
  },

  // =============================================================
  // 10. HEALTH & WELLNESS
  // =============================================================
  {
    id: "health-wellness",
    name: "Health & Wellness",
    icon: "💪",
    image: U("photo-1571019613454-1cb2f99b2d8b"),
    subcategories: [
      { name: "Supplements",        slug: "supplements",         image: U("photo-1550572017-edd951b55104") },
      { name: "Personal Care",      slug: "personal-care",       image: U("photo-1608248597279-f99d160bfcbc") },
      { name: "Fitness Equipment",  slug: "fitness",             image: U("photo-1571019613454-1cb2f99b2d8b") },
      { name: "Aromatherapy",       slug: "aromatherapy",        image: U("photo-1608571423902-eed4a5ad8108") },
      { name: "Massagers",          slug: "massagers",           image: U("photo-1544161515-4ab6ce6db874") },
    ],
  },

  // =============================================================
  // 11. GIFTS & STATIONERY
  // =============================================================
  {
    id: "gifts-stationery",
    name: "Gifts & Stationery",
    icon: "🎁",
    image: U("photo-1513885535751-8b9238bd345a"),
    subcategories: [
      { name: "Gift Boxes",         slug: "gift-boxes",          image: U("photo-1513885535751-8b9238bd345a") },
      { name: "Journals & Diaries", slug: "journals",            image: U("photo-1517842645767-c639042777db") },
      { name: "Pens & Pencils",     slug: "pens",                image: U("photo-1583485088034-697b5bc54ccd") },
      { name: "Art Supplies",       slug: "art-supplies",        image: U("photo-1513364776144-60967b0f800f") },
      { name: "Greeting Cards",     slug: "greeting-cards",      image: U("photo-1607082349566-187342175e2f") },
    ],
  },

  // =============================================================
  // 12. KITCHEN & DINING
  // =============================================================
  {
    id: "kitchen-dining",
    name: "Kitchen & Dining",
    icon: "🍽️",
    image: U("photo-1556909114-f6e7ad7d3136"),
    subcategories: [
      { name: "Cookware Sets",      slug: "cookware-sets",       image: U("photo-1556909114-f6e7ad7d3136") },
      { name: "Knives & Cutlery",   slug: "knives",              image: U("photo-1593618998160-e34014e67546") },
      { name: "Food Storage",       slug: "food-storage",        image: U("photo-1600880292203-757bb62b4baf") },
      { name: "Water Bottles",      slug: "water-bottles",       image: U("photo-1602143407151-7111542de6e8") },
      { name: "Tea & Coffee Mugs",  slug: "mugs",                image: U("photo-1514228742587-6b1558fcca3d") },
    ],
  },

  // =============================================================
  // 13. SPORTS & OUTDOORS
  // =============================================================
  {
    id: "sports-outdoors",
    name: "Sports & Outdoors",
    icon: "⚽",
    image: U("photo-1461896836934-ffe607ba8211"),
    subcategories: [
      { name: "Cricket Gear",       slug: "cricket",             image: U("photo-1531415074968-036ba1b575da") },
      { name: "Football",           slug: "football",            image: U("photo-1579952363873-27f3bade9f55") },
      { name: "Badminton",          slug: "badminton",           image: U("photo-1626224583764-f87db24ac4ea") },
      { name: "Yoga & Fitness",     slug: "yoga",                image: U("photo-1544367567-0f2fcb009e0b") },
      { name: "Cycling",            slug: "cycling",             image: U("photo-1485965120184-e220f721d03e") },
    ],
  },

  // =============================================================
  // 14. WINTER & SEASONAL
  // =============================================================
  {
    id: "winter-seasonal",
    name: "Winter & Seasonal",
    icon: "🧥",
    image: U("photo-1483985988355-763728e1935b"),
    subcategories: [
      { name: "Sweaters",           slug: "sweaters",            image: U("photo-1576566588028-4147f3842f27") },
      { name: "Hoodies",            slug: "hoodies",             image: U("photo-1556821840-3a63f95609a7") },
      { name: "Jackets & Coats",    slug: "winter-jackets",      image: U("photo-1544923246-77307dd654cb") },
      { name: "Blankets",           slug: "blankets",            image: U("photo-1580301762395-21ce84d00bc6") },
      { name: "Winter Scarves",     slug: "winter-scarves",      image: U("photo-1520903920243-00d872a2d1c9") },
      { name: "Thermal Wear",       slug: "thermal-wear",        image: U("photo-1602293589930-45aad59ba3ab") },
    ],
  },
];

// =============================================================
// Helpers
// =============================================================
export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getCategoryName(id: string): string {
  return getCategoryById(id)?.name ?? id;
}

export function getAllSubcategoryNames(): string[] {
  return CATEGORIES.flatMap((c) => c.subcategories.map((s) => s.name));
}

export function getAllSubcategories(): Array<Subcategory & { categoryId: string; categoryName: string }> {
  return CATEGORIES.flatMap((c) =>
    c.subcategories.map((s) => ({
      ...s,
      categoryId: c.id,
      categoryName: c.name,
    }))
  );
}