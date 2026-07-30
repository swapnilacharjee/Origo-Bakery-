export interface Product {
  id: string; // Product ID
  name: string; // Product Name
  itemType?: string; // e.g. "Cookies", "Cake Slice", "Brownies"
  price: number; // Price
  stock: number; // Stock Quantity
  description: string; // Description
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  itemType?: string; // e.g. Cookies, Cake Slice, Brownies
  price: number;
  quantity: number;
  subtotal: number;
  description?: string;
  currentStock?: number;
}

export interface Invoice {
  id: string; // Invoice ID e.g. 02OB002
  date: string; // Date formatted DD-MM-YYYY or YYYY-MM-DD
  batchNo?: string; // e.g. 20260701
  mfgDate?: string; // e.g. 20-07-2026
  expiryDate?: string; // e.g. 20-07-2026
  deliveryDate?: string; // e.g. 20-07-2026
  items: InvoiceItem[];
  productName: string; // Primary or comma-joined for sheet summary
  price: number; // Summary price or total price
  quantity: number; // Summary quantity or total item count
  totalAmount: number; // Grand total
  subtotalAmount?: number; // Total items cost before discount / VAT / advance
  discountRate?: number; // Discount percentage
  discountAmount?: number; // Calculated discount amount
  lessAdvance?: number; // Advance paid
  vatRate?: number; // VAT / Tax percentage
  vatAmount?: number; // Calculated VAT amount
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  companyName?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface AppsScriptConfig {
  webAppUrl: string;
  isConnected: boolean;
  lastSyncedAt?: string;
  autoSync: boolean;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  routingNumber: string;
  swiftCode: string;
}

export interface CustomLink {
  id: string;
  name?: string;
  url?: string;
  iconUrl?: string; // base64 Data URL or image URL
}

export interface ShopSettings {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail?: string;
  shopWebsite?: string;
  facebookPageName?: string;
  facebookUrl?: string;
  addressIconUrl?: string;
  phoneIconUrl?: string;
  websiteIconUrl?: string;
  emailIconUrl?: string;
  facebookIconUrl?: string;
  customLinks?: CustomLink[];
  shopLogoUrl?: string;
  watermarkUrl?: string;
  watermarkOpacity?: number;
  currencySymbol: string;
  footerNote: string;
  vatRate?: number;
  discountRate?: number;
  bankDetails?: BankDetails;
  termsConditions?: string[];
  padImageUrl?: string;
  usePadBackground?: boolean;
}

export type ActiveTab = 'billing' | 'inventory' | 'history' | 'admin' | 'codegs' | 'indexhtml' | 'guide';
