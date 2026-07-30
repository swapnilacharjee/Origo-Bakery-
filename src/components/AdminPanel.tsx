import React, { useState, useEffect } from 'react';
import { Product, ShopSettings, AppsScriptConfig, BankDetails } from '../types';
import { FacebookIcon } from './FacebookIcon';
import { CustomLinksManager } from './CustomLinksManager';
import { ContactIconUploader } from './ContactIconUploader';
import { 
  ShieldCheck, 
  Package, 
  Store, 
  Database, 
  Code, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  RefreshCw, 
  Search, 
  Check, 
  X, 
  BookOpen,
  Globe,
  MapPin,
  Phone,
  Mail,
  Building,
  Building2,
  FileText,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  ShieldAlert,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { CodeViewer } from './CodeViewer';
import { InvoicePrintTemplate, A4PreviewWrapper } from './InvoicePrintTemplate';
import { INITIAL_INVOICES } from '../data/mockData';

const DEFAULT_TERMS = [
  'Delivery Available: Only in Dhaka City.',
  'Delivery Charges: 100-500 TAKA (Area-based).',
  'Customized Cake: Order 5 days in advance and extra charges applicable.',
  'Regular Cake: Order 3 days in advance.',
  'Brownies & Cupcakes: Order 1 day in advance.',
  '40% payment advance on any order.',
  'Excluding VAT & AIT.'
];

const DEFAULT_BANK: BankDetails = {
  accountName: 'AYESHA SHABNAM',
  accountNumber: '1077334520001',
  bankName: 'BRAC Bank PLC.',
  branchName: 'Dhanmondi 27 Branch',
  routingNumber: '060261184',
  swiftCode: 'BRAKBDDH'
};

interface AdminPanelProps {
  products: Product[];
  onAddProduct: (newProduct: Product) => Promise<void>;
  onUpdateProduct: (updatedProduct: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onRefreshProducts: () => Promise<void>;
  isLoading: boolean;
  config: AppsScriptConfig;
  onSaveConfig: (url: string) => Promise<boolean>;
  shopSettings: ShopSettings;
  onSaveShopSettings: (settings: ShopSettings) => void;
  initialTab?: 'products' | 'branding' | 'sheets' | 'code';
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onRefreshProducts,
  isLoading,
  config,
  onSaveConfig,
  shopSettings,
  onSaveShopSettings,
  initialTab = 'products'
}) => {
  // Password protection state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('origobakery_admin_session') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [activeAdminTab, setActiveAdminTab] = useState<'products' | 'branding' | 'sheets' | 'code'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveAdminTab(initialTab);
    }
  }, [initialTab]);

  // Search in admin product manager
  const [search, setSearch] = useState('');
  
  // Add Product Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newItemType, setNewItemType] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Product state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Shop Settings local state
  const [localSettings, setLocalSettings] = useState<ShopSettings>(shopSettings);
  const [shopSavedMsg, setShopSavedMsg] = useState(false);

  useEffect(() => {
    setLocalSettings({
      ...shopSettings,
      termsConditions: shopSettings.termsConditions && shopSettings.termsConditions.length > 0 ? shopSettings.termsConditions : DEFAULT_TERMS,
      bankDetails: shopSettings.bankDetails || DEFAULT_BANK
    });
  }, [shopSettings]);

  const handleAddTerm = () => {
    setLocalSettings(prev => ({
      ...prev,
      termsConditions: [...(prev.termsConditions || DEFAULT_TERMS), '']
    }));
  };

  const handleUpdateTerm = (index: number, val: string) => {
    const currentTerms = localSettings.termsConditions || DEFAULT_TERMS;
    const updated = [...currentTerms];
    updated[index] = val;
    setLocalSettings(prev => ({ ...prev, termsConditions: updated }));
  };

  const handleRemoveTerm = (index: number) => {
    const currentTerms = localSettings.termsConditions || DEFAULT_TERMS;
    const updated = currentTerms.filter((_, i) => i !== index);
    setLocalSettings(prev => ({ ...prev, termsConditions: updated }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({ ...prev, shopLogoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Watermark image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({ ...prev, watermarkUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePadImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Pad image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({ ...prev, padImageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Google Sheets URL state
  const [webAppUrl, setWebAppUrl] = useState(config.webAppUrl || '');
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [urlSavedMsg, setUrlSavedMsg] = useState<string | null>(null);

  // Password submission handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim().toLowerCase() === 'origobakery') {
      setIsAuthenticated(true);
      sessionStorage.setItem('origobakery_admin_session', 'true');
      setErrorMsg('');
      setPasswordInput('');
    } else {
      setErrorMsg('Incorrect Password! Please enter "origobakery" to unlock.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('origobakery_admin_session');
    setPasswordInput('');
    setErrorMsg('');
  };

  // If not authenticated, render password prompt screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-center text-white space-y-3">
          <div className="w-14 h-14 bg-indigo-600/30 border border-indigo-500/40 rounded-2xl flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black tracking-tight">Admin Panel Access</h2>
          <p className="text-xs text-slate-300">
            Enter the admin password to unlock management settings.
          </p>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 font-medium rounded-xl flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">Admin Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter password..."
                value={passwordInput}
                onChange={e => {
                  setPasswordInput(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full pl-3.5 pr-10 py-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Hint: Enter password <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono font-bold">origobakery</code>
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-md shadow-indigo-500/20 flex items-center justify-center space-x-2 text-xs"
          >
            <KeyRound className="w-4 h-4" />
            <span>Unlock Admin Panel</span>
          </button>
        </form>
      </div>
    );
  }

  // Filter products
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    (p.itemType && p.itemType.toLowerCase().includes(search.toLowerCase()))
  );

  // Add Product Handler
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newName.trim() || !newPrice) {
      alert('Please fill out Product ID, Name, and Price');
      return;
    }

    const prod: Product = {
      id: newId.trim().toUpperCase(),
      name: newName.trim(),
      itemType: newItemType.trim() || 'General',
      price: parseFloat(newPrice) || 0,
      stock: parseInt(newStock) || 0,
      description: newDesc.trim()
    };

    setIsSubmitting(true);
    try {
      await onAddProduct(prod);
      setShowAddForm(false);
      setNewId('');
      setNewName('');
      setNewItemType('');
      setNewPrice('');
      setNewStock('');
      setNewDesc('');
    } catch (err) {
      console.error(err);
      alert('Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Product Handler
  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    onUpdateProduct(editingProduct);
    setEditingProduct(null);
  };

  // Delete Product Handler
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete product "${name}" (${id})?`)) {
      onDeleteProduct(id);
    }
  };

  // Save Shop Settings Handler
  const handleSaveShopBranding = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveShopSettings(localSettings);
    setShopSavedMsg(true);
    setTimeout(() => setShopSavedMsg(false), 3000);
  };

  // Save Sheets Config Handler
  const handleConnectSheets = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUrl(true);
    setUrlSavedMsg(null);
    const success = await onSaveConfig(webAppUrl.trim());
    setIsSavingUrl(false);
    if (success) {
      setUrlSavedMsg('✅ Google Sheets Apps Script URL saved & connected!');
    } else {
      setUrlSavedMsg('⚠️ URL saved. Please ensure Apps Script deployment access is set to "Anyone".');
    }
    setTimeout(() => setUrlSavedMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 sm:p-3 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-400 shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">Admin Control Panel</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                Full Access Mode
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
              Manage Products, Shop Branding, Google Sheets URL, Code.gs, & System Settings.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={onRefreshProducts}
            disabled={isLoading}
            className="flex-1 sm:flex-initial justify-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync All Data</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shrink-0"
            title="Lock Admin Panel"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto w-full no-scrollbar pt-1">
        <button
          onClick={() => setActiveAdminTab('products')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
            activeAdminTab === 'products'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Management ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('branding')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
            activeAdminTab === 'branding'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Shop Branding & Details</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('sheets')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
            activeAdminTab === 'sheets'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Google Sheets Link</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('code')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
            activeAdminTab === 'code'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Apps Script Code</span>
        </button>
      </div>

      {/* TAB 1: PRODUCT MANAGEMENT */}
      {activeAdminTab === 'products' && (
        <div className="space-y-6">
          {/* Controls bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-500/20 flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          {/* Add Product Modal */}
          {showAddForm && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-base sm:text-lg text-slate-900">Add New Product to Inventory</h3>
                  <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1">✕</button>
                </div>

                <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Product ID *</label>
                      <input
                        type="text"
                        required
                        placeholder="PRD-108"
                        value={newId}
                        onChange={e => setNewId(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Eclair / Cake / Cookie"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Item Type</label>
                      <input
                        type="text"
                        placeholder="e.g. Pastry"
                        value={newItemType}
                        onChange={e => setNewItemType(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Price (৳) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="250"
                        value={newPrice}
                        onChange={e => setNewPrice(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Stock Quantity *</label>
                      <input
                        type="number"
                        required
                        placeholder="25"
                        value={newStock}
                        onChange={e => setNewStock(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Product details..."
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2"
                    />
                  </div>

                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Product'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Product Modal */}
          {editingProduct && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-base sm:text-lg text-slate-900">Edit Product: {editingProduct.id}</h3>
                  <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1">✕</button>
                </div>

                <form onSubmit={handleSaveEditProduct} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Product ID</label>
                      <input
                        type="text"
                        disabled
                        value={editingProduct.id}
                        className="w-full border border-slate-200 bg-slate-100 rounded-lg p-2 font-mono font-bold text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
                      <input
                        type="text"
                        required
                        value={editingProduct.name}
                        onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Item Type</label>
                      <input
                        type="text"
                        value={editingProduct.itemType || ''}
                        onChange={e => setEditingProduct({ ...editingProduct, itemType: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Price (৳) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editingProduct.price}
                        onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Stock Quantity *</label>
                      <input
                        type="number"
                        required
                        value={editingProduct.stock}
                        onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                        className="w-full border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={editingProduct.description || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2"
                    />
                  </div>

                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
                    >
                      Update Product
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Product Table with Actions */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80 uppercase tracking-wider whitespace-nowrap">
                  <tr>
                    <th className="p-3.5">Product ID</th>
                    <th className="p-3.5">Item Type</th>
                    <th className="p-3.5">Product Name</th>
                    <th className="p-3.5">Price (৳)</th>
                    <th className="p-3.5">Stock Quantity</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 whitespace-nowrap">
                  {filteredProducts.map((p, idx) => (
                    <tr key={`${p.id}-${idx}`} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-indigo-600">{p.id}</td>
                      <td className="p-3.5">
                        <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold border border-slate-200">
                          {p.itemType || 'General'}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3.5 font-bold text-slate-800">৳{p.price.toFixed(2)}</td>
                      <td className="p-3.5">
                        <span className={`inline-block font-bold px-2.5 py-0.5 rounded-full ${
                          p.stock > 10 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : p.stock > 0 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => setEditingProduct(p)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition inline-flex items-center space-x-1 border border-indigo-200"
                          title="Edit product details, price, or stock"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition inline-flex items-center space-x-1 border border-red-200"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SHOP BRANDING */}
      {activeAdminTab === 'branding' && (
        <>
        {/* Live A4 Invoice Preview */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">Live A4 Invoice Preview</h3>
            <span className="text-[11px] text-slate-500">— updates as you edit branding below</span>
          </div>
          <A4PreviewWrapper>
            <InvoicePrintTemplate invoice={INITIAL_INVOICES[0]} shopSettings={localSettings} />
          </A4PreviewWrapper>
        </div>

        <form onSubmit={handleSaveShopBranding} className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <Store className="w-5 h-5 text-indigo-600 shrink-0" />
                <span>Shop Branding & Printable Invoice Details</span>
              </h3>
              <p className="text-slate-500 mt-0.5">Configure Shop Header, Address, Contact details, Logo, Watermark, Bank details and Terms.</p>
            </div>
            {shopSavedMsg && (
              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg font-bold flex items-center space-x-1 animate-pulse shrink-0">
                <Check className="w-4 h-4" />
                <span>Shop details updated successfully!</span>
              </span>
            )}
          </div>

          {/* Pad Background Image Section */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block font-bold text-amber-900 uppercase tracking-wider text-[11px]">
                  🖨️ Printed Pad / Letterhead Background
                </label>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Upload your pre-printed A4 pad image. Invoice details will print on top — header auto-hidden.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <span className="text-xs font-bold text-amber-800">Use Pad</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={!!localSettings.usePadBackground}
                    onChange={e => setLocalSettings(prev => ({ ...prev, usePadBackground: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${
                    localSettings.usePadBackground ? 'bg-amber-500' : 'bg-slate-300'
                  }`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      localSettings.usePadBackground ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </div>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {localSettings.padImageUrl ? (
                <div className="relative shrink-0">
                  <img
                    src={localSettings.padImageUrl}
                    alt="Pad Preview"
                    className="w-16 h-20 object-cover rounded border border-amber-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setLocalSettings(prev => ({ ...prev, padImageUrl: '' }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-20 rounded border border-amber-300 bg-amber-100 flex flex-col items-center justify-center text-amber-400 shrink-0">
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-[8px] mt-0.5">No Pad</span>
                </div>
              )}
              <div className="flex-1 w-full space-y-2">
                <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs rounded-lg border border-amber-300 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Pad Image (A4)</span>
                  <input type="file" accept="image/*" onChange={handlePadImageUpload} className="hidden" />
                </label>
                <input
                  type="text"
                  placeholder="https://i.ibb.co/... or paste URL"
                  value={localSettings.padImageUrl || ''}
                  onChange={e => setLocalSettings({ ...localSettings, padImageUrl: e.target.value })}
                  className="w-full border border-amber-300 bg-white rounded-lg p-2 font-mono text-[11px]"
                />
              </div>
            </div>

            {localSettings.usePadBackground && !localSettings.padImageUrl && (
              <p className="text-[11px] text-red-600 font-semibold">⚠️ Pad mode is ON but no image uploaded. Please upload a pad image.</p>
            )}
            {localSettings.usePadBackground && localSettings.padImageUrl && (
              <p className="text-[11px] text-emerald-700 font-semibold">✅ Pad mode active — invoice header will be hidden, only details will print on pad.</p>
            )}
          </div>

          {/* Logo Upload & URL */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Shop Logo / Emblem
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              {localSettings.shopLogoUrl ? (
                <div className="relative group shrink-0">
                  <img 
                    src={localSettings.shopLogoUrl} 
                    alt="Shop Logo" 
                    className="w-16 h-16 object-contain rounded-lg border bg-white p-1"
                  />
                  <button
                    type="button"
                    onClick={() => setLocalSettings(prev => ({ ...prev, shopLogoUrl: '' }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600 transition"
                    title="Remove Logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-slate-200 border flex flex-col items-center justify-center text-slate-400 shrink-0">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-[9px] mt-0.5">No Logo</span>
                </div>
              )}

              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo File</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </label>
                  <span className="text-slate-400 text-[11px]">or enter URL below</span>
                </div>
                <input
                  type="text"
                  placeholder="https://i.ibb.co/... or /logo.png"
                  value={localSettings.shopLogoUrl || ''}
                  onChange={e => setLocalSettings({ ...localSettings, shopLogoUrl: e.target.value })}
                  className="w-full border border-slate-300 bg-white rounded-lg p-2 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Basic Shop Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Shop Name *</label>
              <input
                type="text"
                required
                value={localSettings.shopName}
                onChange={e => setLocalSettings({ ...localSettings, shopName: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
              />
            </div>

            <div>
              <ContactIconUploader
                label="Shop Address"
                iconUrl={localSettings.addressIconUrl}
                defaultIcon={<MapPin className="w-3.5 h-3.5 text-slate-600" />}
                onUpload={(url) => setLocalSettings({ ...localSettings, addressIconUrl: url })}
                onClear={() => setLocalSettings({ ...localSettings, addressIconUrl: undefined })}
              />
              <input
                type="text"
                value={localSettings.shopAddress}
                onChange={e => setLocalSettings({ ...localSettings, shopAddress: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900"
              />
            </div>

            <div>
              <ContactIconUploader
                label="Phone Number"
                iconUrl={localSettings.phoneIconUrl}
                defaultIcon={<Phone className="w-3.5 h-3.5 text-slate-600" />}
                onUpload={(url) => setLocalSettings({ ...localSettings, phoneIconUrl: url })}
                onClear={() => setLocalSettings({ ...localSettings, phoneIconUrl: undefined })}
              />
              <input
                type="text"
                value={localSettings.shopPhone}
                onChange={e => setLocalSettings({ ...localSettings, shopPhone: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900"
              />
            </div>

            <div>
              <ContactIconUploader
                label="Email Address"
                iconUrl={localSettings.emailIconUrl}
                defaultIcon={<Mail className="w-3.5 h-3.5 text-slate-600" />}
                onUpload={(url) => setLocalSettings({ ...localSettings, emailIconUrl: url })}
                onClear={() => setLocalSettings({ ...localSettings, emailIconUrl: undefined })}
              />
              <input
                type="text"
                value={localSettings.shopEmail || ''}
                onChange={e => setLocalSettings({ ...localSettings, shopEmail: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900"
              />
            </div>

            <div>
              <ContactIconUploader
                label="Website URL"
                iconUrl={localSettings.websiteIconUrl}
                defaultIcon={<Globe className="w-3.5 h-3.5 text-slate-600" />}
                onUpload={(url) => setLocalSettings({ ...localSettings, websiteIconUrl: url })}
                onClear={() => setLocalSettings({ ...localSettings, websiteIconUrl: undefined })}
              />
              <input
                type="text"
                value={localSettings.shopWebsite || ''}
                onChange={e => setLocalSettings({ ...localSettings, shopWebsite: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900"
              />
            </div>

            <div>
              <ContactIconUploader
                label="Facebook Page Name & Icon"
                iconUrl={localSettings.facebookIconUrl}
                defaultIcon={<FacebookIcon className="w-3.5 h-3.5 text-blue-600" />}
                onUpload={(url) => setLocalSettings({ ...localSettings, facebookIconUrl: url })}
                onClear={() => setLocalSettings({ ...localSettings, facebookIconUrl: undefined })}
              />
              <input
                type="text"
                placeholder="e.g. Origo Bakery"
                value={localSettings.facebookPageName ?? (localSettings.facebookUrl && !localSettings.facebookUrl.startsWith('http') ? localSettings.facebookUrl : 'Origo Bakery')}
                onChange={e => setLocalSettings({ ...localSettings, facebookPageName: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-900"
              />
              <p className="text-[10px] text-slate-500 mt-1">Display text shown on the invoice header</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5 text-xs">
                <FacebookIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                Facebook Link / URL
              </label>
              <input
                type="text"
                placeholder="https://www.facebook.com/share/19MHmL8wph/"
                value={localSettings.facebookUrl || ''}
                onChange={e => setLocalSettings({ ...localSettings, facebookUrl: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-mono text-xs"
              />
              <p className="text-[10px] text-slate-500 mt-1">Clicking this link on the invoice will redirect here</p>
            </div>
          </div>

          {/* Dynamic Custom Links & Icons Section */}
          <CustomLinksManager
            customLinks={localSettings.customLinks}
            onChange={(links) => setLocalSettings({ ...localSettings, customLinks: links })}
          />

          {/* Watermark Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Background Watermark Image
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              {localSettings.watermarkUrl ? (
                <div className="relative group shrink-0">
                  <img 
                    src={localSettings.watermarkUrl} 
                    alt="Watermark Preview" 
                    className="w-14 h-14 object-contain rounded-lg border bg-white p-1"
                    style={{ opacity: localSettings.watermarkOpacity ?? 0.08 }}
                  />
                  <button
                    type="button"
                    onClick={() => setLocalSettings(prev => ({ ...prev, watermarkUrl: '' }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600 transition"
                    title="Remove Watermark"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg bg-slate-200 border flex flex-col items-center justify-center text-slate-400 shrink-0">
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-[8px] mt-0.5">No Image</span>
                </div>
              )}

              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Watermark Image</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleWatermarkUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="https://i.ibb.co/..."
                  value={localSettings.watermarkUrl || ''}
                  onChange={e => setLocalSettings({ ...localSettings, watermarkUrl: e.target.value })}
                  className="w-full border border-slate-300 bg-white rounded-lg p-2 font-mono text-[11px]"
                />
              </div>
            </div>

            {localSettings.watermarkUrl && (
              <div className="pt-2 border-t border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-700">Watermark Opacity:</span>
                  <span className="font-bold text-indigo-600 font-mono">
                    {Math.round((localSettings.watermarkOpacity ?? 0.08) * 100)}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0.02" 
                  max="0.30" 
                  step="0.01" 
                  value={localSettings.watermarkOpacity ?? 0.08} 
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, watermarkOpacity: parseFloat(e.target.value) }))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Currency, VAT & Discount */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Currency Symbol</label>
              <select
                value={localSettings.currencySymbol}
                onChange={e => setLocalSettings({ ...localSettings, currencySymbol: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
              >
                <option value="৳">৳ (BDT Taka)</option>
                <option value="$">$ (USD Dollar)</option>
                <option value="₹">₹ (INR Rupee)</option>
                <option value="€">€ (EUR Euro)</option>
                <option value="£">£ (GBP Pound)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Default VAT / Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={localSettings.vatRate ?? 0}
                onChange={e => setLocalSettings({ ...localSettings, vatRate: Math.max(0, parseFloat(e.target.value) || 0) })}
                placeholder="0"
                className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
              />
              <p className="text-[10px] text-slate-500 mt-1">If set to 0%, it will NOT show on invoice.</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Discount Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={localSettings.discountRate ?? 0}
                onChange={e => setLocalSettings({ ...localSettings, discountRate: Math.max(0, parseFloat(e.target.value) || 0) })}
                placeholder="0"
                className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
              />
              <p className="text-[10px] text-slate-500 mt-1">If set to 0%, it will NOT show on invoice.</p>
            </div>
          </div>

          {/* Terms & Conditions List */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Terms & Conditions
                </label>
              </div>
              <button
                type="button"
                onClick={handleAddTerm}
                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg border border-indigo-200 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Term</span>
              </button>
            </div>

            <div className="space-y-2">
              {(localSettings.termsConditions || DEFAULT_TERMS).map((term, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="font-bold text-slate-500 text-[11px] w-5 shrink-0 text-right">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={term}
                    onChange={(e) => handleUpdateTerm(idx, e.target.value)}
                    placeholder={`Term #${idx + 1}`}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTerm(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                    title="Delete term"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bank Details */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Beneficiary Bank Account Details</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Name</label>
                <input
                  type="text"
                  value={localSettings.bankDetails?.accountName || ''}
                  onChange={e => setLocalSettings({
                    ...localSettings,
                    bankDetails: { ...(localSettings.bankDetails || DEFAULT_BANK), accountName: e.target.value }
                  })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
                <input
                  type="text"
                  value={localSettings.bankDetails?.accountNumber || ''}
                  onChange={e => setLocalSettings({
                    ...localSettings,
                    bankDetails: { ...(localSettings.bankDetails || DEFAULT_BANK), accountNumber: e.target.value }
                  })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={localSettings.bankDetails?.bankName || ''}
                  onChange={e => setLocalSettings({
                    ...localSettings,
                    bankDetails: { ...(localSettings.bankDetails || DEFAULT_BANK), bankName: e.target.value }
                  })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  value={localSettings.bankDetails?.branchName || ''}
                  onChange={e => setLocalSettings({
                    ...localSettings,
                    bankDetails: { ...(localSettings.bankDetails || DEFAULT_BANK), branchName: e.target.value }
                  })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Routing Number</label>
                <input
                  type="text"
                  value={localSettings.bankDetails?.routingNumber || ''}
                  onChange={e => setLocalSettings({
                    ...localSettings,
                    bankDetails: { ...(localSettings.bankDetails || DEFAULT_BANK), routingNumber: e.target.value }
                  })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SWIFT Code</label>
                <input
                  type="text"
                  value={localSettings.bankDetails?.swiftCode || ''}
                  onChange={e => setLocalSettings({
                    ...localSettings,
                    bankDetails: { ...(localSettings.bankDetails || DEFAULT_BANK), swiftCode: e.target.value }
                  })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-md flex items-center space-x-2 text-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Shop Branding Details</span>
            </button>
          </div>
        </form>
        </>
      )}

      {/* TAB 3: GOOGLE SHEETS LINK */}
      {activeAdminTab === 'sheets' && (
        <form onSubmit={handleConnectSheets} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5 text-xs">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <span>Google Apps Script Web App URL Sync</span>
            </h3>
            <p className="text-slate-500 mt-0.5">
              Connect your deployed Google Apps Script Web App URL to sync products and auto-save invoices into Google Sheets.
            </p>
          </div>

          {urlSavedMsg && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl font-medium">
              {urlSavedMsg}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Google Apps Script Web App URL</label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              value={webAppUrl}
              onChange={e => setWebAppUrl(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Must end with <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">/exec</code>. Access level must be set to <strong>"Anyone"</strong> in Google Apps Script deployment settings.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 gap-3">
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full shrink-0 ${config.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span className="font-semibold text-slate-700">
                Status: {config.isConnected ? 'Connected to Google Sheets' : 'Local Standalone Mode'}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSavingUrl}
              className="w-full sm:w-auto justify-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-md flex items-center space-x-2 text-xs"
            >
              <RefreshCw className={`w-4 h-4 ${isSavingUrl ? 'animate-spin' : ''}`} />
              <span>{isSavingUrl ? 'Connecting...' : 'Save & Test Connection'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: APPS SCRIPT CODE */}
      {activeAdminTab === 'code' && (
        <CodeViewer initialTab="codegs" />
      )}

    </div>
  );
};
