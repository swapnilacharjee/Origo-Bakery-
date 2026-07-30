import React, { useState } from 'react';
import { Product } from '../types';
import { Package, Plus, RefreshCw, Search, Check, AlertCircle } from 'lucide-react';

interface InventoryManagerProps {
  products: Product[];
  onAddProduct: (newProduct: Product) => Promise<void>;
  onRefreshProducts: () => Promise<void>;
  isLoading: boolean;
  isConnected: boolean;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  onAddProduct,
  onRefreshProducts,
  isLoading,
  isConnected
}) => {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Product Form state
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newItemType, setNewItemType] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    (p.itemType && p.itemType.toLowerCase().includes(search.toLowerCase()))
  );

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

  return (
    <div className="space-y-6">
      
      {/* Top Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Products Sheet Inventory</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Corresponds to Google Sheet 1 ("Products"): Product ID, Type, Product Name, Price, Stock Quantity, Description.
          </p>
        </div>

        <div className="flex items-center space-x-3">
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
            <span>{isConnected ? 'Sync Sheet' : 'Connect & Sync Sheet'}</span>
            {isConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5"></span>
            )}
          </button>

          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-500/20 flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Add Product to Sheet 1</h3>
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="PRD-107"
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Item Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Pastry, Bakery"
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
                  <label className="block font-semibold text-slate-700 mb-1">Initial Stock *</label>
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
                  placeholder="Brief description of features..."
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

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Filter products by ID or Name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Product ID</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Product Name</th>
                <th className="p-3.5">Price</th>
                <th className="p-3.5">Stock Quantity</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p, idx) => (
                <tr key={`${p.id}-${idx}`} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-mono font-bold text-indigo-600">{p.id}</td>
                  <td className="p-3.5 font-semibold text-slate-700">
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                      {p.itemType || 'General'}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">{p.name}</td>
                  <td className="p-3.5 font-semibold text-slate-800">৳{p.price.toFixed(2)}</td>
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
                  <td className="p-3.5 text-right">
                    {p.stock > 0 ? (
                      <span className="text-emerald-600 font-medium">In Stock</span>
                    ) : (
                      <span className="text-red-600 font-medium">Out of Stock</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
