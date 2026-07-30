import React, { useState } from 'react';
import { Product } from '../types';
import { Package, RefreshCw, Search, ShieldAlert, Lock, ArrowRight } from 'lucide-react';

interface ProductsSheetProps {
  products: Product[];
  onRefreshProducts: () => Promise<void>;
  isLoading: boolean;
  isConnected: boolean;
  onGoToAdmin: () => void;
}

export const ProductsSheet: React.FC<ProductsSheetProps> = ({
  products,
  onRefreshProducts,
  isLoading,
  isConnected,
  onGoToAdmin
}) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  // Unique item types
  const itemTypes = ['ALL', ...Array.from(new Set(products.map(p => p.itemType || 'General').filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      (p.itemType && p.itemType.toLowerCase().includes(search.toLowerCase()));
    
    const matchesType = selectedType === 'ALL' || (p.itemType || 'General') === selectedType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900">Products Sheet (Read Only)</h2>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-slate-500 inline mr-0.5" /> View Only
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Full list of products and current stock. Product edit/update is restricted to Admin Panel.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={onRefreshProducts}
            disabled={isLoading}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 border ${
              isConnected 
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200' 
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
            }`}
            title={isConnected ? 'Sync products from connected Google Sheet' : 'Connect Google Sheet & Sync'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isConnected ? 'Sync Sheet' : 'Sync Sheet'}</span>
          </button>

          <button
            onClick={onGoToAdmin}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-sm"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Panel</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Note:</strong> Product update, price edit, new product add ebong delete Admin Panel theke kora jabe.
          </span>
        </div>
        <button
          onClick={onGoToAdmin}
          className="text-indigo-700 font-bold hover:underline shrink-0 ml-2"
        >
          Open Admin Panel &rarr;
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search products by ID, Name or Type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {itemTypes.map(t => (
              <option key={t} value={t}>
                {t === 'ALL' ? 'All Item Types' : t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Sheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">SL</th>
                <th className="p-3.5">Product ID</th>
                <th className="p-3.5">Item Type</th>
                <th className="p-3.5">Product Name</th>
                <th className="p-3.5">Price (৳)</th>
                <th className="p-3.5">Current Stock</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3.5 font-mono font-bold text-indigo-600">{p.id}</td>
                    <td className="p-3.5">
                      <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-semibold border border-slate-200">
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
                    <td className="p-3.5 text-slate-500 max-w-xs truncate">{p.description || '--'}</td>
                    <td className="p-3.5 text-right font-medium">
                      {p.stock > 0 ? (
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Available</span>
                      ) : (
                        <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">Stock Out</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                    No products found matching "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
