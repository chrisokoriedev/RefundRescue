export interface PredefinedProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  isFinalSale: boolean;
  description: string;
}

export const PREDEFINED_PRODUCTS: PredefinedProduct[] = [
  {
    id: 'PROD-COOK-01',
    name: 'Cast Iron Ceramic Cookware Set (5-Piece)',
    sku: 'COOK-CER-01',
    category: 'Kitchenware',
    unitPrice: 180.0,
    isFinalSale: false,
    description: 'Enameled cast iron cookware set with glass lids, Dutch oven, and skillets'
  },
  {
    id: 'PROD-AUDIO-02',
    name: 'True Wireless Noise-Cancelling Earbuds',
    sku: 'AUDIO-EAR-02',
    category: 'Electronics',
    unitPrice: 79.99,
    isFinalSale: false,
    description: 'Bluetooth 5.3 earbuds with active noise cancellation and IPX5 resistance'
  },
  {
    id: 'PROD-SCARF-03',
    name: 'Luxury Cashmere Scarf - Clearance',
    sku: 'APP-SCARF-FS',
    category: 'Apparel',
    unitPrice: 95.0,
    isFinalSale: true,
    description: '100% Mongolian cashmere scarf marked as final sale clearance (non-returnable)'
  },
  {
    id: 'PROD-TV-04',
    name: '55" Ultra HD 4K OLED Smart TV',
    sku: 'ELEC-TV-55',
    category: 'Electronics',
    unitPrice: 850.0,
    isFinalSale: false,
    description: 'High-value 4K OLED display with Dolby Vision (triggers $500 threshold)'
  },
  {
    id: 'PROD-SHOE-05',
    name: 'Pro Performance Running Shoes (Size 10)',
    sku: 'SHOE-RUN-10',
    category: 'Footwear',
    unitPrice: 120.0,
    isFinalSale: false,
    description: 'Breathable carbon-plate road racing and marathon training shoes'
  },
  {
    id: 'PROD-WATCH-06',
    name: 'Rugged GPS Smartwatch Series 4',
    sku: 'WATCH-GPS-04',
    category: 'Wearables',
    unitPrice: 300.0,
    isFinalSale: false,
    description: 'Titanium bezel multi-sport GPS smartwatch with sapphire crystal display'
  },
  {
    id: 'PROD-COAT-07',
    name: 'Italian Wool Overcoat',
    sku: 'APP-COAT-WOL',
    category: 'Apparel',
    unitPrice: 420.0,
    isFinalSale: false,
    description: 'Hand-tailored Italian virgin wool winter overcoat with satin lining'
  },
  {
    id: 'PROD-AUDIO-08',
    name: 'Portable Waterproof Bluetooth Speaker',
    sku: 'AUDIO-SPK-01',
    category: 'Audio',
    unitPrice: 65.0,
    isFinalSale: false,
    description: 'IPX7 waterproof portable speaker with 360-degree sound and 20h battery'
  },
  {
    id: 'PROD-LAPTOP-09',
    name: 'Apex Gaming Laptop 16" RTX 4070',
    sku: 'COMP-LAP-09',
    category: 'Computers',
    unitPrice: 1299.0,
    isFinalSale: false,
    description: '16-inch QHD 240Hz gaming laptop with NVIDIA RTX 4070 (high-value asset)'
  },
  {
    id: 'PROD-SWIM-10',
    name: 'Athletic One-Piece Swimwear (Clearance)',
    sku: 'APP-SWIM-FS',
    category: 'Apparel',
    unitPrice: 45.0,
    isFinalSale: true,
    description: 'Chlorine-resistant competitive swimwear marked as final sale / hygiene policy'
  },
  {
    id: 'PROD-ESPR-11',
    name: 'Artisan Compact Espresso Machine',
    sku: 'KITCH-ESP-01',
    category: 'Kitchenware',
    unitPrice: 280.0,
    isFinalSale: false,
    description: '15-bar Italian pump stainless steel espresso and cappuccino machine'
  },
  {
    id: 'PROD-KEYB-12',
    name: 'RGB Wireless Mechanical Keyboard',
    sku: 'COMP-KEY-03',
    category: 'Peripherals',
    unitPrice: 110.0,
    isFinalSale: false,
    description: 'Hot-swappable linear mechanical keyboard with per-key RGB backlighting'
  },
  {
    id: 'PROD-LEATH-13',
    name: 'Vintage Biker Leather Jacket',
    sku: 'APP-LEATH-01',
    category: 'Apparel',
    unitPrice: 290.0,
    isFinalSale: false,
    description: 'Full-grain distressed cowhide leather motorcycle jacket with YKK hardware'
  },
  {
    id: 'PROD-HEPA-14',
    name: 'True HEPA Smart Air Purifier',
    sku: 'HOME-AIR-02',
    category: 'Home Appliances',
    unitPrice: 180.0,
    isFinalSale: false,
    description: '3-stage filtration with Medical Grade H13 True HEPA filter and Wi-Fi control'
  },
  {
    id: 'PROD-DRONE-15',
    name: 'GPS 4K Camera Drone Quadcopter',
    sku: 'TOY-DRONE-4K',
    category: 'Electronics',
    unitPrice: 350.0,
    isFinalSale: false,
    description: 'Foldable quadcopter with 3-axis gimbal 4K HDR camera and 35-min flight time'
  }
];

export function getPredefinedProducts(): PredefinedProduct[] {
  return PREDEFINED_PRODUCTS;
}

export function getProductById(idOrSku: string): PredefinedProduct | undefined {
  return PREDEFINED_PRODUCTS.find(
    p => p.id.toLowerCase() === idOrSku.toLowerCase() || p.sku.toLowerCase() === idOrSku.toLowerCase()
  );
}
