import React, { useState, useEffect, useMemo } from 'react';
import { Product, InvoiceItem, Invoice, ShopSettings } from '../types';
import { InvoicePrintTemplate, A4PreviewWrapper } from './InvoicePrintTemplate';
import { generateAndDownloadPdf, generateAndDownloadInvoiceImage } from '../utils/pdfGenerator';
import { 
  Search, 
  ShoppingCart, 
  Printer, 
  AlertCircle, 
  Plus, 
  Trash2, 
  DollarSign, 
  Check, 
  User, 
  Phone,
  Building,
  CreditCard,
  RefreshCw,
  Sparkles,
  Download,
  Calendar,
  MapPin,
  Mail
} from 'lucide-react';

interface BillingFormProps {
  products: Product[];
  onSaveAndPrint: (invoice: Invoice) => Promise<void>;
  isLoadingBackend: boolean;
  shopSettings: ShopSettings;
  onOpenShopSettings: () => void;
}

const formatDateString = (dateStr: string): string => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [yyyy, mm, dd] = dateStr.split('-');
    return `${dd}-${mm}-${yyyy}`;
  }
  return dateStr;
};

export const BillingForm: React.FC<BillingFormProps> = ({
  products,
  onSaveAndPrint,
  isLoadingBackend,
  shopSettings,
  onOpenShopSettings
}) => {
  // Form State
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  
  const [quantity, setQuantity] = useState<number>(1);

  // Dates and Meta State
  const todayISO = new Date().toISOString().split('T')[0];
  const [invoiceDate, setInvoiceDate] = useState<string>(todayISO);
  const [mfgDate, setMfgDate] = useState<string>(todayISO);
  const [deliveryDate, setDeliveryDate] = useState<string>(todayISO);
  const [batchNo, setBatchNo] = useState<string>('');

  // Customer State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [lessAdvance, setLessAdvance] = useState<number | string>('');

  // Cart / Multi-item List
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Auto-fill selected product reference
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  // Filtered product options for search
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(
      p => p.name.toLowerCase().includes(term) || p.id.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  // Dynamic calculations
  const singleSubtotal = selectedProduct ? selectedProduct.price * quantity : 0;
  
  // Stock validation for single product entry
  const isSingleQtyValid = selectedProduct 
    ? quantity > 0 && quantity <= selectedProduct.stock
    : false;

  const currencySym = shopSettings.currencySymbol || '৳';
  const parsedVatRate = shopSettings.vatRate || 0;
  const parsedDiscountRate = shopSettings.discountRate || 0;

  // Cart total calculations
  const cartSubtotal = useMemo(() => {
    if (cartItems.length > 0) {
      return cartItems.reduce((acc, item) => acc + item.subtotal, 0);
    }
    return singleSubtotal;
  }, [cartItems, singleSubtotal]);

  const cartDiscountAmount = useMemo(() => {
    return parsedDiscountRate > 0 ? (cartSubtotal * parsedDiscountRate) / 100 : 0;
  }, [cartSubtotal, parsedDiscountRate]);

  const cartVatAmount = useMemo(() => {
    return parsedVatRate > 0 ? ((cartSubtotal - cartDiscountAmount) * parsedVatRate) / 100 : 0;
  }, [cartSubtotal, cartDiscountAmount, parsedVatRate]);

  const parsedAdvance = typeof lessAdvance === 'number' ? lessAdvance : (parseFloat(String(lessAdvance)) || 0);

  const cartGrandTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - cartDiscountAmount + cartVatAmount - parsedAdvance);
  }, [cartSubtotal, cartDiscountAmount, cartVatAmount, parsedAdvance]);

  // Generate unique invoice ID
  const [invoiceId, setInvoiceId] = useState<string>('');
  useEffect(() => {
    setInvoiceId('INV-' + Math.floor(100000 + Math.random() * 900000));
  }, []);

  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setSearchTerm(product.name);
    setIsDropdownOpen(false);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    if (quantity <= 0) return;
    if (quantity > selectedProduct.stock) return;

    const existingIdx = cartItems.findIndex(i => i.productId === selectedProduct.id);
    if (existingIdx >= 0) {
      const existing = cartItems[existingIdx];
      const newQty = existing.quantity + quantity;
      if (newQty > selectedProduct.stock) {
        alert(`Cannot add ${quantity} more. Total requested (${newQty}) exceeds stock (${selectedProduct.stock}).`);
        return;
      }
      const updated = [...cartItems];
      updated[existingIdx] = {
        ...existing,
        quantity: newQty,
        subtotal: existing.price * newQty
      };
      setCartItems(updated);
    } else {
      setCartItems(prev => [
        ...prev,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          itemType: selectedProduct.itemType || 'Item',
          price: selectedProduct.price,
          quantity: quantity,
          subtotal: selectedProduct.price * quantity,
          description: selectedProduct.description,
          currentStock: selectedProduct.stock
        }
      ]);
    }

    // Reset current selection
    setSelectedProductId('');
    setSearchTerm('');
    setQuantity(1);
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const activeInvoiceData: Invoice = useMemo(() => {
    const items = cartItems.length > 0 ? cartItems : (selectedProduct ? [{
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      itemType: selectedProduct.itemType || 'Item',
      price: selectedProduct.price,
      quantity: quantity,
      subtotal: singleSubtotal,
      description: selectedProduct.description
    }] : []);

    const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
    const dRate = parsedDiscountRate;
    const dAmount = dRate > 0 ? (subtotal * dRate) / 100 : 0;
    const vRate = parsedVatRate;
    const vAmount = vRate > 0 ? ((subtotal - dAmount) * vRate) / 100 : 0;
    const advVal = typeof lessAdvance === 'number' ? lessAdvance : (parseFloat(String(lessAdvance)) || 0);
    const total = Math.max(0, subtotal - dAmount + vAmount - advVal);

    const formattedInvDate = formatDateString(invoiceDate) || formatDateString(todayISO);
    const formattedMfgDate = formatDateString(mfgDate);
    const formattedDeliveryDate = formatDateString(deliveryDate);

    return {
      id: invoiceId,
      date: formattedInvDate,
      mfgDate: formattedMfgDate,
      deliveryDate: formattedDeliveryDate,
      batchNo: batchNo.trim() || invoiceDate.replace(/-/g, ''),
      productName: items.map(i => i.productName).join(', ') || 'No Item Selected',
      price: items[0]?.price || 0,
      quantity: items.reduce((acc, i) => acc + i.quantity, 0),
      subtotalAmount: subtotal,
      discountRate: dRate,
      discountAmount: dAmount,
      lessAdvance: advVal,
      vatRate: vRate,
      vatAmount: vAmount,
      totalAmount: total,
      items: items,
      customerName: customerName.trim() || 'N/A',
      customerAddress: customerAddress.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      companyName: companyName.trim(),
      paymentMethod: paymentMethod
    };
  }, [
    invoiceId,
    cartItems,
    selectedProduct,
    quantity,
    singleSubtotal,
    parsedDiscountRate,
    parsedVatRate,
    lessAdvance,
    invoiceDate,
    mfgDate,
    deliveryDate,
    batchNo,
    customerName,
    customerAddress,
    customerPhone,
    customerEmail,
    companyName,
    paymentMethod,
    todayISO
  ]);

  const handleSubmitAndPrint = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if we have items
    if (cartItems.length === 0 && !selectedProduct) {
      alert('Please select a product or add items to the invoice.');
      return;
    }

    if (cartItems.length === 0 && selectedProduct) {
      if (quantity > selectedProduct.stock) {
        alert('Requested quantity exceeds current available stock.');
        return;
      }
    }

    setIsSaving(true);
    try {
      // 1. Trigger parent save handler (updates Google Sheets / local state)
      await onSaveAndPrint(activeInvoiceData);

      // 2. Trigger Browser Print Dialog
      window.print();

      // 3. Reset Form for Next Sale
      setCartItems([]);
      setSelectedProductId('');
      setSearchTerm('');
      setQuantity(1);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerEmail('');
      setCompanyName('');
      setInvoiceDate(todayISO);
      setMfgDate(todayISO);
      setDeliveryDate(todayISO);
      setBatchNo('');
      setInvoiceId('INV-' + Math.floor(100000 + Math.random() * 900000));
    } catch (err) {
      console.error('Save and print failed:', err);
      alert('An error occurred while saving invoice. Please check backend connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (cartItems.length === 0 && !selectedProduct) {
      alert('Please select a product or add items to the invoice.');
      return;
    }

    if (cartItems.length === 0 && selectedProduct && quantity > selectedProduct.stock) {
      alert('Requested quantity exceeds current available stock.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Auto-save data to Google Sheets & Local Database
      await onSaveAndPrint(activeInvoiceData);

      // 2. Generate and download PDF or Invoice File using robust generator
      await generateAndDownloadPdf(activeInvoiceData, shopSettings);

      // 3. Reset Form for Next Sale
      setCartItems([]);
      setSelectedProductId('');
      setSearchTerm('');
      setQuantity(1);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerEmail('');
      setCompanyName('');
      setInvoiceDate(todayISO);
      setMfgDate(todayISO);
      setDeliveryDate(todayISO);
      setBatchNo('');
      setInvoiceId('INV-' + Math.floor(100000 + Math.random() * 900000));
    } catch (err) {
      console.error('PDF Download failed:', err);
      try {
        window.print();
      } catch (e) {
        console.warn('print failed', e);
      }
    } finally {
      setIsSaving(false);
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
      document.documentElement.style.pointerEvents = '';
    }
  };

  const handleDownloadImage = async () => {
    setIsSaving(true);
    try {
      await generateAndDownloadInvoiceImage(activeInvoiceData, shopSettings);
    } catch (err) {
      console.error('Image Download failed:', err);
      alert('Could not download image. Please try again or use Direct Print.');
    } finally {
      setIsSaving(false);
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
      document.documentElement.style.pointerEvents = '';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* LEFT FORM PANEL (Col 7) */}
      <div className="no-print lg:col-span-7 space-y-6">
        
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create Invoice Bill</h2>
                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Select products from your Google Sheets inventory, verify stock, and print formatted bill.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-right shrink-0">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">INVOICE ID</span>
              <span className="text-sm font-extrabold text-indigo-600 font-mono">{invoiceId}</span>
            </div>
          </div>

          <form onSubmit={handleSubmitAndPrint} className="space-y-6">
            
            {/* 1. PRODUCT SELECTION & AUTOCOMPLETE */}
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                1. Select Product by Name or ID *
              </label>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search product by name or ID (e.g. Wireless Mouse, PRD-101)..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedProductId('');
                      setIsDropdownOpen(false);
                    }}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Autocomplete Suggestions Dropdown */}
              {isDropdownOpen && filteredProducts.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-60 overflow-y-auto z-50 divide-y divide-slate-100">
                  {filteredProducts.map((prod, idx) => (
                    <div
                      key={`${prod.id}-${idx}`}
                      onClick={() => handleSelectProduct(prod)}
                      className="p-3 hover:bg-indigo-50/70 cursor-pointer transition flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{prod.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: {prod.id} • {prod.description ? prod.description.substring(0, 45) + '...' : 'No desc'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-extrabold text-indigo-600">{currencySym}{prod.price.toFixed(2)}</div>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                          prod.stock > 5 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : prod.stock > 0 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          Stock: {prod.stock}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. AUTO-FILLED PRODUCT DETAILS */}
            <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-2 border-b border-slate-200/60">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Auto-Filled Product Details
                </span>
                {selectedProduct ? (
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Auto-populated
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 font-normal">Select a product to auto-fill</span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Product ID</span>
                  <input
                    type="text"
                    readOnly
                    value={selectedProduct ? selectedProduct.id : '--'}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Price ({currencySym})</span>
                  <input
                    type="text"
                    readOnly
                    value={selectedProduct ? `${currencySym}${selectedProduct.price.toFixed(2)}` : `${currencySym}0.00`}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Current Stock</span>
                  <div className="pt-1">
                    {selectedProduct ? (
                      <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg ${
                        selectedProduct.stock > 5
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : selectedProduct.stock > 0
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {selectedProduct.stock} Available
                      </span>
                    ) : (
                      <span className="text-slate-400 font-semibold">--</span>
                    )}
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-3">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Description</span>
                  <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200 min-h-[36px]">
                    {selectedProduct ? selectedProduct.description || 'No description provided.' : 'Product details will auto-populate here upon selection.'}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. QUANTITY INPUT & DYNAMIC CALCULATION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  2. Billing Quantity *
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct ? selectedProduct.stock : 9999}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    disabled={!selectedProduct}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  {selectedProduct && (
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={!isSingleQtyValid}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shrink-0 disabled:opacity-50"
                      title="Add to multi-item invoice list"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Item
                    </button>
                  )}
                </div>

                {/* Real-time Stock Validation Error Message */}
                {selectedProduct && quantity > selectedProduct.stock && (
                  <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>Requested quantity ({quantity}) exceeds current available stock ({selectedProduct.stock})!</span>
                  </div>
                )}
              </div>

              {/* Calculated Subtotal Display */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Dynamic Calculation
                </label>
                <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-2.5 text-right">
                  <span className="text-[10px] text-indigo-600 font-semibold block uppercase">
                    {selectedProduct ? `${currencySym}${selectedProduct.price.toFixed(2)} × ${quantity}` : 'Price × Quantity'}
                  </span>
                  <span className="text-xl font-black text-indigo-700">
                    {currencySym}{singleSubtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* MULTI-ITEM CART TABLE (IF ITEMS ADDED) */}
            {cartItems.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-800 text-white px-4 py-2 text-xs font-bold flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Invoice Items List ({cartItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setCartItems([])}
                    className="text-[10px] text-slate-400 hover:text-red-300 font-normal"
                  >
                    Clear List
                  </button>
                </div>
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {cartItems.map((item, index) => (
                    <div key={index} className="p-3 text-xs flex justify-between items-center bg-white hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        <div className="text-[11px] text-slate-500">
                          {currencySym}{item.price.toFixed(2)} × {item.quantity} units
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-extrabold text-indigo-600">{currencySym}{item.subtotal.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(index)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Items Subtotal ({cartItems.reduce((a, b) => a + b.quantity, 0)} items):</span>
                    <span className="font-semibold text-slate-900">{currencySym}{cartSubtotal.toFixed(2)}</span>
                  </div>
                  {parsedDiscountRate > 0 && (
                    <div className="flex justify-between text-emerald-700 text-[11px] font-bold">
                      <span>Discount ({parsedDiscountRate}%):</span>
                      <span>-{currencySym}{cartDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {parsedVatRate > 0 && (
                    <div className="flex justify-between text-indigo-700 text-[11px] font-bold">
                      <span>VAT / Tax ({parsedVatRate}%):</span>
                      <span>+{currencySym}{cartVatAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {parsedAdvance > 0 && (
                    <div className="flex justify-between text-amber-700 text-[11px] font-bold">
                      <span>Less Advance:</span>
                      <span>-{currencySym}{parsedAdvance.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 font-extrabold text-slate-900 border-t border-slate-200 text-sm">
                    <span>Grand Total (Payable):</span>
                    <span className="text-base text-indigo-600">{currencySym}{cartGrandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* INVOICE DATES & BATCH SETTINGS */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
              <div className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Invoice Dates & Batch
                </span>
                <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Current Date Active
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Mfg Date
                  </label>
                  <input
                    type="date"
                    value={mfgDate}
                    onChange={(e) => setMfgDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Batch No.
                  </label>
                  <input
                    type="text"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    placeholder="e.g. 20260727"
                    className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* CUSTOMER & PAYMENT METHOD (ALL CUSTOMER FIELDS ARE OPTIONAL) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
              <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Customer Details (Optional)</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Print without filling</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Customer"
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+880 17..."
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Address
                  </label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Customer Address"
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" /> Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Company (Optional)"
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="Cash">Cash</option>
                    <option value="bKash / Nagad">bKash / Nagad</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-amber-600" /> Less Advance
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={lessAdvance}
                      onChange={(e) => setLessAdvance(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="0.00"
                      className="w-full border border-amber-300 rounded-xl pl-3 pr-7 py-1.5 text-xs text-amber-950 bg-amber-50/80 focus:ring-2 focus:ring-amber-500 font-bold shadow-sm"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs font-extrabold text-amber-700 pointer-events-none">
                      {currencySym}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS: DIRECT DOWNLOAD PDF */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={
                  isSaving ||
                  (cartItems.length === 0 && (!selectedProduct || !isSingleQtyValid))
                }
                className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs text-white shadow-lg transition flex items-center justify-center space-x-2 ${
                  isSaving || (cartItems.length === 0 && (!selectedProduct || !isSingleQtyValid))
                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-emerald-600/20'
                }`}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 shrink-0" />
                    <span>Download PDF File</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-500 mt-2">
                <strong>Auto-Saves to Google Sheets</strong> & downloads clean local PDF file to your computer or phone!
              </p>
            </div>

          </form>
        </div>

      </div>

      {/* RIGHT SIDE LIVE PRINTABLE PREVIEW (Col 5) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="no-print bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-md border border-slate-700/60">
          <span className="flex items-center gap-1.5 font-bold">
            <Printer className="w-4 h-4 text-indigo-400" />
            Live Printable Invoice Preview
          </span>
        </div>

        {/* The Printable Invoice Component inside A4 Paper Frame */}
        <A4PreviewWrapper>
          <InvoicePrintTemplate invoice={activeInvoiceData} shopSettings={shopSettings} />
        </A4PreviewWrapper>
      </div>

    </div>
  );
};
