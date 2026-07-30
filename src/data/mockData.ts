import { Product, Invoice, ShopSettings } from '../types';

export const DEFAULT_BAKERY_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 240" width="300" height="240"><g fill="none" stroke="%23000000" stroke-width="12"><ellipse cx="105" cy="100" rx="42" ry="62" stroke-width="13"/><path d="M125 38 L170 38 C205 38 215 72 172 100 C215 128 205 162 125 162 L125 38 Z" stroke-width="13" stroke-linecap="round"/><line x1="125" y1="38" x2="125" y2="162" stroke-width="18"/></g><text x="150" y="210" font-family="'Times New Roman', Times, serif" font-weight="bold" font-size="22" fill="%23000" text-anchor="middle" letter-spacing="3">ORIGO BAKERY</text></svg>`;

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  shopName: 'ORIGO BAKERY',
  shopAddress: 'Gulshan Tower, Plot # 31, Road # 53. Gulshan North C/A, Dhaka-1212 Ground Floor.',
  shopPhone: '+880 18042-56099',
  shopEmail: 'hi@gmail.com',
  shopWebsite: 'www.origobd.com',
  facebookPageName: 'Origo Bakery',
  facebookUrl: 'https://www.facebook.com/share/19MHmL8wph/',
  shopLogoUrl: DEFAULT_BAKERY_LOGO,
  watermarkUrl: DEFAULT_BAKERY_LOGO,
  watermarkOpacity: 0.07,
  currencySymbol: '৳',
  footerNote: 'Authorized Signature',
  vatRate: 0,
  bankDetails: {
    accountName: 'AYESHA SHABNAM',
    accountNumber: '1077334520001',
    bankName: 'BRAC Bank PLC.',
    branchName: 'Dhanmondi 27 Branch',
    routingNumber: '060261184',
    swiftCode: 'BRAKBDDH'
  },
  termsConditions: [
    'Delivery Available: Only in Dhaka City.',
    'Delivery Charges: 100-500 TAKA (Area-based).',
    'Customized Cake: Order 5 days in advance and extra charges applicable.',
    'Regular Cake: Order 3 days in advance.',
    'Brownies & Cupcakes: Order 1 day in advance.',
    '40% payment advance on any order.',
    'Excluding VAT & AIT.'
  ]
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'PRD-101',
    name: 'Chocolate Chip Cookies',
    itemType: 'Cookies',
    price: 85.00,
    stock: 100,
    description: 'Crispy freshly baked chocolate chip cookies'
  },
  {
    id: 'PRD-102',
    name: 'Oreo Cheesecake Slices',
    itemType: 'Cake Slice',
    price: 200.00,
    stock: 50,
    description: 'Creamy Oreo cheesecake slice'
  },
  {
    id: 'PRD-103',
    name: 'Chocolate Fudge Cake Slices',
    itemType: 'Cake Slice',
    price: 190.00,
    stock: 40,
    description: 'Rich chocolate fudge cake slice'
  },
  {
    id: 'PRD-104',
    name: 'Brownies',
    itemType: 'Brownies',
    price: 90.00,
    stock: 80,
    description: 'Fudgy chocolate brownie'
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: '02OB002',
    date: '21-07-2026',
    batchNo: '20260701',
    mfgDate: '20-07-2026',
    deliveryDate: '20-07-2026',
    productName: 'Cookies, Cheesecake & Cake Slices',
    price: 85.00,
    quantity: 38,
    totalAmount: 5720.00,
    subtotalAmount: 5720.00,
    lessAdvance: 0,
    customerName: 'Crema and Co.',
    customerAddress: 'Level-3, Hena Suvastu Skyline, 55 Gulshan Ave, Dhaka 1212.',
    customerPhone: '01312-820804',
    customerEmail: 'N/A',
    paymentMethod: 'Cash',
    items: [
      {
        productId: 'PRD-101',
        productName: 'Chocolate Chip Cookies',
        itemType: 'Cookies',
        price: 85.00,
        quantity: 4,
        subtotal: 340.00
      },
      {
        productId: 'PRD-102',
        productName: 'Oreo Cheesecake Slices',
        itemType: 'Cake Slice',
        price: 200.00,
        quantity: 12,
        subtotal: 2400.00
      },
      {
        productId: 'PRD-103',
        productName: 'Chocolate Fudge Cake Slices',
        itemType: 'Cake Slice',
        price: 190.00,
        quantity: 10,
        subtotal: 1900.00
      },
      {
        productId: 'PRD-104',
        productName: 'Brownies',
        itemType: 'Brownies',
        price: 90.00,
        quantity: 12,
        subtotal: 1080.00
      }
    ]
  }
];


