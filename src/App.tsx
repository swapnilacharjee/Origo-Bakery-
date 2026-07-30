import React, { useState, useEffect } from 'react';
import { Product, Invoice, AppsScriptConfig, ShopSettings, ActiveTab } from './types';
import { INITIAL_PRODUCTS, INITIAL_INVOICES, DEFAULT_SHOP_SETTINGS } from './data/mockData';
import { Navbar } from './components/Navbar';
import { BillingForm } from './components/BillingForm';
import { ProductsSheet } from './components/ProductsSheet';
import { AdminPanel } from './components/AdminPanel';
import { InvoiceHistory } from './components/InvoiceHistory';
import { CodeViewer } from './components/CodeViewer';
import { SetupGuide } from './components/SetupGuide';
import { AppsScriptModal } from './components/AppsScriptModal';
import { ShopSettingsModal } from './components/ShopSettingsModal';
import { AdminPasswordModal } from './components/AdminPasswordModal';
import { 
  subscribeShopSettings, 
  saveShopSettingsToFirebase, 
  subscribeAppConfig, 
  saveAppConfigToFirebase,
  subscribeProducts,
  saveProductToFirebase,
  deleteProductFromFirebase,
  saveAllProductsToFirebase
} from './lib/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('billing');
  
  // Local persistence initialized with mock data
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('quickbill_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('quickbill_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [shopSettings, setShopSettings] = useState<ShopSettings>(() => {
    const saved = localStorage.getItem('quickbill_shop_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_SHOP_SETTINGS,
        ...parsed,
        bankDetails: {
          ...DEFAULT_SHOP_SETTINGS.bankDetails,
          ...(parsed.bankDetails || {})
        },
        termsConditions: parsed.termsConditions && parsed.termsConditions.length > 0
          ? parsed.termsConditions
          : DEFAULT_SHOP_SETTINGS.termsConditions
      };
    }
    return DEFAULT_SHOP_SETTINGS;
  });

  const [config, setConfig] = useState<AppsScriptConfig>(() => {
    const url = localStorage.getItem('quickbill_appsscript_url') || '';
    return {
      webAppUrl: url,
      isConnected: !!url,
      autoSync: true
    };
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState(false);
  const [adminSubTab, setAdminSubTab] = useState<'products' | 'branding' | 'sheets' | 'code'>('products');
  const [pendingAdminSubTab, setPendingAdminSubTab] = useState<'products' | 'branding' | 'sheets' | 'code'>('products');
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const handleOpenAdmin = () => {
    const isAuth = sessionStorage.getItem('origobakery_admin_session') === 'true';
    if (isAuth) {
      setAdminSubTab('products');
      setActiveTab('admin');
    } else {
      setPendingAdminSubTab('products');
      setIsAdminPasswordModalOpen(true);
    }
  };

  const handleOpenShopSettings = () => {
    const isAuth = sessionStorage.getItem('origobakery_admin_session') === 'true';
    if (isAuth) {
      setAdminSubTab('branding');
      setActiveTab('admin');
    } else {
      setPendingAdminSubTab('branding');
      setIsAdminPasswordModalOpen(true);
    }
  };

  const handleOpenSheetsSettings = () => {
    const isAuth = sessionStorage.getItem('origobakery_admin_session') === 'true';
    if (isAuth) {
      setAdminSubTab('sheets');
      setActiveTab('admin');
    } else {
      setPendingAdminSubTab('sheets');
      setIsAdminPasswordModalOpen(true);
    }
  };

  const handleAdminAuthSuccess = () => {
    sessionStorage.setItem('origobakery_admin_session', 'true');
    setIsAdminPasswordModalOpen(false);
    setAdminSubTab(pendingAdminSubTab);
    setActiveTab('admin');
    showToast('🔓 Password correct! Welcome to Admin Panel.', 'success');
  };

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('quickbill_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('quickbill_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('quickbill_shop_settings', JSON.stringify(shopSettings));
  }, [shopSettings]);

  // Realtime Firebase Firestore Listeners
  useEffect(() => {
    // 1. Shop Settings Firebase Sync
    const unsubShop = subscribeShopSettings((firebaseSettings) => {
      setShopSettings(prev => ({
        ...DEFAULT_SHOP_SETTINGS,
        ...firebaseSettings,
        bankDetails: {
          ...DEFAULT_SHOP_SETTINGS.bankDetails,
          ...(firebaseSettings.bankDetails || {})
        },
        termsConditions: firebaseSettings.termsConditions && firebaseSettings.termsConditions.length > 0
          ? firebaseSettings.termsConditions
          : DEFAULT_SHOP_SETTINGS.termsConditions
      }));
    });

    // 2. App Config (Google Sheets URL) Firebase Sync
    const unsubConfig = subscribeAppConfig((firebaseConfig) => {
      if (firebaseConfig.webAppUrl) {
        setConfig({
          webAppUrl: firebaseConfig.webAppUrl,
          isConnected: true,
          autoSync: true
        });
      }
    });

    // 3. Products Firebase Sync
    const unsubProducts = subscribeProducts((firebaseProducts) => {
      if (firebaseProducts && firebaseProducts.length > 0) {
        setProducts(firebaseProducts);
      }
    });

    return () => {
      unsubShop();
      unsubConfig();
      unsubProducts();
    };
  }, []);

  // Initial backend fetch if Apps Script URL is set
  useEffect(() => {
    if (config.webAppUrl) {
      fetchBackendProducts(config.webAppUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveShopSettings = (updated: ShopSettings) => {
    setShopSettings(updated);
    saveShopSettingsToFirebase(updated);
    showToast('✨ Shop Branding details synced to Cloud Database!', 'success');
  };

  const fetchBackendProducts = async (url?: string) => {
    const targetUrl = url !== undefined ? url : config.webAppUrl;
    if (!targetUrl) {
      showToast('⚠️ Google Sheets URL is not configured! Opening settings window to enter Web App URL.', 'warning');
      setIsModalOpen(true);
      return;
    }

    setIsLoadingBackend(true);
    try {
      const fetchUrl = targetUrl.includes('?') ? `${targetUrl}&action=getProducts` : `${targetUrl}?action=getProducts`;
      const res = await fetch(fetchUrl);
      const data = await res.json();
      
      let fetchedProds: any[] = [];
      if (Array.isArray(data)) {
        fetchedProds = data;
      } else if (data && Array.isArray(data.products)) {
        fetchedProds = data.products;
      }

      if (fetchedProds.length > 0) {
        const parseClientNum = (val: any): number => {
          if (typeof val === 'number') return isNaN(val) ? 0 : val;
          if (!val) return 0;
          const cleaned = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
          const num = parseFloat(cleaned);
          return isNaN(num) ? 0 : num;
        };

        const cleanedProds: Product[] = fetchedProds.map((p: any) => ({
          id: String(p.id || '').trim(),
          name: String(p.name || p.productName || 'Unnamed Item').trim(),
          itemType: String(p.itemType || p.type || 'General').trim(),
          price: parseClientNum(p.price),
          stock: parseClientNum(p.stock),
          description: String(p.description || p.desc || '').trim()
        }));

        setProducts(cleanedProds);
        saveAllProductsToFirebase(cleanedProds);
        setConfig(prev => ({ ...prev, isConnected: true, lastSyncedAt: new Date().toLocaleTimeString() }));
        showToast(`✅ Successfully synced ${cleanedProds.length} products from Google Sheets!`, 'success');
      } else if (data && data.status === 'error') {
        showToast(`❌ Sheet Sync Error: ${data.message || 'Unknown error'}`, 'warning');
      } else {
        showToast('⚠️ Google Sheet connected, point to "Products" tab. 0 products found.', 'warning');
      }
    } catch (err) {
      console.warn('Backend fetch warning: Using cached products database.', err);
      showToast('❌ Google Sheet Sync failed. Make sure Web App access is set to "Anyone".', 'warning');
    } finally {
      setIsLoadingBackend(false);
    }
  };

  const handleSaveAndPrintInvoice = async (newInvoice: Invoice) => {
    // 1. Deduct stock in products state
    setProducts(prevProducts => {
      const updated = [...prevProducts];
      const items = newInvoice.items || [];
      
      items.forEach(item => {
        const idx = updated.findIndex(p => p.id === item.productId || p.name.toLowerCase() === item.productName.toLowerCase());
        if (idx >= 0) {
          const currentStock = updated[idx].stock;
          const updatedProd = {
            ...updated[idx],
            stock: Math.max(0, currentStock - item.quantity)
          };
          updated[idx] = updatedProd;
          saveProductToFirebase(updatedProd);
        }
      });
      return updated;
    });

    // 2. Add to Invoices History state
    setInvoices(prev => [newInvoice, ...prev]);

    // 3. Post to Google Apps Script Backend if URL exists
    if (config.webAppUrl) {
      try {
        await fetch(config.webAppUrl, {
          method: 'POST',
          mode: 'no-cors', // Standard Google Apps Script cross-origin submission
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'saveInvoice',
            invoice: newInvoice
          })
        });
        showToast(`✅ Invoiced ${newInvoice.id} auto-saved to Google Sheets & Cloud Database!`, 'success');
      } catch (err) {
        console.error('Failed to post invoice to Google Sheets Apps Script:', err);
        showToast('⚠️ Auto-saved locally. Google Sheets update encountered an issue.', 'warning');
      }
    } else {
      showToast('💾 Auto-saved locally! (Connect Google Sheets URL in settings for cloud sync)', 'info');
    }
  };

  const handleAddProduct = async (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
    saveProductToFirebase(newProduct);

    if (config.webAppUrl) {
      try {
        await fetch(config.webAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'addProduct',
            product: newProduct
          })
        });
        showToast(`✅ Product "${newProduct.name}" auto-saved to Google Sheets!`, 'success');
      } catch (err) {
        console.error('Failed to push product to Google Sheets:', err);
        showToast('⚠️ Product saved in cloud database.', 'warning');
      }
    } else {
      showToast('💾 Product auto-saved in cloud database!', 'info');
    }
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    saveProductToFirebase(updatedProduct);
    showToast(`✅ Product "${updatedProduct.name}" (${updatedProduct.id}) updated!`, 'success');
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    deleteProductFromFirebase(productId);
    showToast(`🗑️ Product ${productId} deleted from inventory.`, 'info');
  };

  const handleSaveConfig = async (url: string): Promise<boolean> => {
    const newConfig = { webAppUrl: url, isConnected: !!url, autoSync: true };
    saveAppConfigToFirebase(newConfig);

    if (!url) {
      localStorage.removeItem('quickbill_appsscript_url');
      setConfig({ webAppUrl: '', isConnected: false, autoSync: false });
      return true;
    }

    try {
      // Test endpoint
      const testUrl = url.includes('?') ? `${url}&action=getProducts` : `${url}?action=getProducts`;
      const res = await fetch(testUrl);
      const data = await res.json();
      
      localStorage.setItem('quickbill_appsscript_url', url);
      setConfig({
        webAppUrl: url,
        isConnected: true,
        lastSyncedAt: new Date().toLocaleTimeString(),
        autoSync: true
      });

      let fetchedProds: any[] = [];
      if (Array.isArray(data)) {
        fetchedProds = data;
      } else if (data && Array.isArray(data.products)) {
        fetchedProds = data.products;
      }

      if (fetchedProds.length > 0) {
        const parseClientNum = (val: any): number => {
          if (typeof val === 'number') return isNaN(val) ? 0 : val;
          if (!val) return 0;
          const cleaned = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
          const num = parseFloat(cleaned);
          return isNaN(num) ? 0 : num;
        };

        const cleanedProds: Product[] = fetchedProds.map((p: any) => ({
          id: String(p.id || '').trim(),
          name: String(p.name || p.productName || 'Unnamed Item').trim(),
          itemType: String(p.itemType || p.type || 'General').trim(),
          price: parseClientNum(p.price),
          stock: parseClientNum(p.stock),
          description: String(p.description || p.desc || '').trim()
        }));

        setProducts(cleanedProds);
        saveAllProductsToFirebase(cleanedProds);
      }
      return true;
    } catch (err) {
      console.error('Web app test failed:', err);
      localStorage.setItem('quickbill_appsscript_url', url);
      setConfig({
        webAppUrl: url,
        isConnected: false,
        autoSync: true
      });
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased flex flex-col">
      
      {/* Top Navigation Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        shopSettings={shopSettings}
        onOpenSettings={handleOpenSheetsSettings}
        onOpenShopSettings={handleOpenShopSettings}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* Floating Auto-Save Notification Toast */}
      {toast && (
        <div className="no-print fixed top-20 right-4 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-xl shadow-xl text-xs font-bold flex items-center space-x-2 border ${
            toast.type === 'success' 
              ? 'bg-emerald-900 text-emerald-100 border-emerald-600' 
              : toast.type === 'warning'
              ? 'bg-amber-900 text-amber-100 border-amber-600'
              : 'bg-indigo-900 text-indigo-100 border-indigo-600'
          }`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 font-bold opacity-80 hover:opacity-100">✕</button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'billing' && (
          <BillingForm
            products={products}
            onSaveAndPrint={handleSaveAndPrintInvoice}
            isLoadingBackend={isLoadingBackend}
            shopSettings={shopSettings}
            onOpenShopSettings={handleOpenShopSettings}
          />
        )}

        {activeTab === 'inventory' && (
          <ProductsSheet
            products={products}
            onRefreshProducts={() => fetchBackendProducts(config.webAppUrl)}
            isLoading={isLoadingBackend}
            isConnected={config.isConnected}
            onGoToAdmin={handleOpenAdmin}
          />
        )}

        {activeTab === 'history' && (
          <InvoiceHistory
            invoices={invoices}
            onRefresh={() => fetchBackendProducts(config.webAppUrl)}
            isLoading={isLoadingBackend}
            shopSettings={shopSettings}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onRefreshProducts={() => fetchBackendProducts(config.webAppUrl)}
            isLoading={isLoadingBackend}
            config={config}
            onSaveConfig={handleSaveConfig}
            shopSettings={shopSettings}
            onSaveShopSettings={handleSaveShopSettings}
            initialTab={adminSubTab}
          />
        )}

        {activeTab === 'codegs' && (
          <CodeViewer initialTab="codegs" />
        )}

        {activeTab === 'indexhtml' && (
          <CodeViewer initialTab="indexhtml" />
        )}

        {activeTab === 'guide' && (
          <SetupGuide />
        )}

      </main>

      {/* Footer */}
      <footer className="no-print bg-slate-900 text-slate-400 py-4 text-center text-xs border-t border-slate-800">
      </footer>

      {/* Google Sheets Settings Modal */}
      <AppsScriptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />

      {/* Shop Logo & Branding Modal */}
      <ShopSettingsModal
        isOpen={isShopModalOpen}
        onClose={() => setIsShopModalOpen(false)}
        shopSettings={shopSettings}
        onSaveShopSettings={handleSaveShopSettings}
      />

      {/* Admin Password Modal */}
      <AdminPasswordModal
        isOpen={isAdminPasswordModalOpen}
        onClose={() => setIsAdminPasswordModalOpen(false)}
        onSuccess={handleAdminAuthSuccess}
      />

    </div>
  );
}
