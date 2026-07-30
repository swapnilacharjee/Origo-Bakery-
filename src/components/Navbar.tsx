import React from 'react';
import { ActiveTab, AppsScriptConfig, ShopSettings } from '../types';
import { 
  FileText, 
  Package, 
  History, 
  ShieldCheck, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  Store
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  config: AppsScriptConfig;
  shopSettings?: ShopSettings;
  onOpenSettings: () => void;
  onOpenShopSettings: () => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  config,
  shopSettings,
  onOpenSettings,
  onOpenShopSettings,
  onOpenAdmin
}) => {
  const handleAdminClick = () => {
    if (onOpenAdmin) {
      onOpenAdmin();
    } else {
      setActiveTab('admin');
    }
  };
  return (
    <header className="no-print bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('billing')}>
            {shopSettings?.shopLogoUrl ? (
              <div className="bg-white p-1 rounded-xl shadow-md border border-slate-200/20 h-11 w-11 flex items-center justify-center overflow-hidden shrink-0">
                <img 
                  src={shopSettings.shopLogoUrl} 
                  alt={shopSettings.shopName || "Origo Bakery Logo"} 
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="bg-amber-500 text-slate-950 p-2.5 rounded-xl shadow-lg font-extrabold text-xl flex items-center justify-center">
                🥐
              </div>
            )}
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white block leading-tight">
                {shopSettings?.shopName || 'ORIGO BAKERY'}
              </span>
              <p className="text-xs text-amber-400 font-medium">Billing & Invoice System</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'billing'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Billing</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'inventory'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products Sheet</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Invoice Log</span>
            </button>

            <button
              onClick={handleAdminClick}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-extrabold'
                  : 'bg-indigo-950/60 text-amber-300 border-indigo-700/60 hover:bg-indigo-900/80'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Panel</span>
            </button>
          </nav>

          {/* Right Section - Single Admin Panel Button on small screens if nav hidden, or kept in nav */}
          <div className="flex items-center space-x-2.5">
            {/* Quick Admin Panel button for small screens where central nav is hidden */}
            <button
              onClick={handleAdminClick}
              className="md:hidden px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-extrabold flex items-center space-x-1.5 transition shadow-sm"
              title="Admin Panel (Password Required)"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </button>
          </div>

        </div>

        {/* Mobile Tab Row */}
        <div className="md:hidden flex items-center space-x-1 overflow-x-auto py-2 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'billing' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Billing
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'inventory' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Products Sheet
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Invoice Log
          </button>
          <button
            onClick={handleAdminClick}
            className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap ${
              activeTab === 'admin' ? 'bg-amber-500 text-slate-900' : 'bg-indigo-950 text-amber-300'
            }`}
          >
            Admin Panel
          </button>
        </div>

      </div>
    </header>
  );
};
