import React, { useState, useEffect } from 'react';
import { ShopSettings, BankDetails } from '../types';
import { FacebookIcon } from './FacebookIcon';
import { CustomLinksManager } from './CustomLinksManager';
import { ContactIconUploader } from './ContactIconUploader';
import { Store, Upload, Image as ImageIcon, CheckCircle, Trash2, X, Plus, Building2, FileText, MapPin, Phone, Mail, Globe } from 'lucide-react';

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

interface ShopSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopSettings: ShopSettings;
  onSaveShopSettings: (settings: ShopSettings) => void;
}

export const ShopSettingsModal: React.FC<ShopSettingsModalProps> = ({
  isOpen,
  onClose,
  shopSettings,
  onSaveShopSettings
}) => {
  const [formData, setFormData] = useState<ShopSettings>(shopSettings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...shopSettings,
        termsConditions: shopSettings.termsConditions || DEFAULT_TERMS,
        bankDetails: shopSettings.bankDetails || DEFAULT_BANK
      });
    }
  }, [shopSettings, isOpen]);

  if (!isOpen) return null;

  const currentTerms = formData.termsConditions || DEFAULT_TERMS;
  const currentBank = formData.bankDetails || DEFAULT_BANK;

  const handleAddTerm = () => {
    setFormData(prev => ({
      ...prev,
      termsConditions: [...(prev.termsConditions || DEFAULT_TERMS), '']
    }));
  };

  const handleUpdateTerm = (index: number, val: string) => {
    const updated = [...currentTerms];
    updated[index] = val;
    setFormData(prev => ({
      ...prev,
      termsConditions: updated
    }));
  };

  const handleRemoveTerm = (index: number) => {
    const updated = currentTerms.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      termsConditions: updated
    }));
  };

  const handleBankChange = (field: keyof BankDetails, val: string) => {
    setFormData(prev => ({
      ...prev,
      bankDetails: {
        ...(prev.bankDetails || DEFAULT_BANK),
        [field]: val
      }
    }));
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
        setFormData(prev => ({ ...prev, watermarkUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
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
        setFormData(prev => ({ ...prev, shopLogoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveShopSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Shop Branding & Logo Settings</h3>
              <p className="text-xs text-slate-500">Customize Invoice Header & Shop Info</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          
          <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1.5 custom-scrollbar">
            {/* Shop Logo Upload */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Shop Logo / Emblem
              </label>
              <div className="flex items-center space-x-4 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                {formData.shopLogoUrl ? (
                  <div className="relative group shrink-0">
                    <img 
                      src={formData.shopLogoUrl} 
                      alt="Shop Logo" 
                      className="w-16 h-16 object-contain rounded-lg border bg-white p-1"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, shopLogoUrl: '' }))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600 transition"
                      title="Remove Logo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-slate-200 border flex flex-col items-center justify-center text-slate-400 shrink-0">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[9px] mt-0.5">No Logo</span>
                  </div>
                )}

                <div className="flex-1 space-y-1">
                  <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo Image</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </label>
                  <p className="text-[10px] text-slate-400">
                    PNG, JPG or WebP (Max 2MB). Automatically prints on top of every invoice.
                  </p>
                </div>
              </div>
            </div>

            {/* Shop Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Shop Name *
              </label>
              <input
                type="text"
                required
                value={formData.shopName}
                onChange={(e) => setFormData(prev => ({ ...prev, shopName: e.target.value }))}
                placeholder="e.g. Rahat General Store / Tech Point"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>

            {/* Address, Phone, Email, Website & Facebook */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <ContactIconUploader
                  label="Shop Address"
                  iconUrl={formData.addressIconUrl}
                  defaultIcon={<MapPin className="w-3.5 h-3.5 text-slate-600" />}
                  onUpload={(url) => setFormData(prev => ({ ...prev, addressIconUrl: url }))}
                  onClear={() => setFormData(prev => ({ ...prev, addressIconUrl: undefined }))}
                />
                <input
                  type="text"
                  value={formData.shopAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, shopAddress: e.target.value }))}
                  placeholder="e.g. Gulshan Tower, Plot # 31, Road # 53. Gulshan North C/A, Dhaka-1212 Ground Floor."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <ContactIconUploader
                  label="Phone Number"
                  iconUrl={formData.phoneIconUrl}
                  defaultIcon={<Phone className="w-3.5 h-3.5 text-slate-600" />}
                  onUpload={(url) => setFormData(prev => ({ ...prev, phoneIconUrl: url }))}
                  onClear={() => setFormData(prev => ({ ...prev, phoneIconUrl: undefined }))}
                />
                <input
                  type="text"
                  value={formData.shopPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, shopPhone: e.target.value }))}
                  placeholder="+880 18042-56099"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <ContactIconUploader
                  label="Email Address"
                  iconUrl={formData.emailIconUrl}
                  defaultIcon={<Mail className="w-3.5 h-3.5 text-slate-600" />}
                  onUpload={(url) => setFormData(prev => ({ ...prev, emailIconUrl: url }))}
                  onClear={() => setFormData(prev => ({ ...prev, emailIconUrl: undefined }))}
                />
                <input
                  type="email"
                  value={formData.shopEmail || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, shopEmail: e.target.value }))}
                  placeholder="e.g. hi@gmail.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <ContactIconUploader
                  label="Website Link"
                  iconUrl={formData.websiteIconUrl}
                  defaultIcon={<Globe className="w-3.5 h-3.5 text-slate-600" />}
                  onUpload={(url) => setFormData(prev => ({ ...prev, websiteIconUrl: url }))}
                  onClear={() => setFormData(prev => ({ ...prev, websiteIconUrl: undefined }))}
                />
                <input
                  type="text"
                  value={formData.shopWebsite || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, shopWebsite: e.target.value }))}
                  placeholder="e.g. www.origobd.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <ContactIconUploader
                  label="Facebook Page Name & Icon"
                  iconUrl={formData.facebookIconUrl}
                  defaultIcon={<FacebookIcon className="w-3.5 h-3.5 text-blue-600" />}
                  onUpload={(url) => setFormData(prev => ({ ...prev, facebookIconUrl: url }))}
                  onClear={() => setFormData(prev => ({ ...prev, facebookIconUrl: undefined }))}
                />
                <input
                  type="text"
                  value={formData.facebookPageName ?? (formData.facebookUrl && !formData.facebookUrl.startsWith('http') ? formData.facebookUrl : 'Origo Bakery')}
                  onChange={(e) => setFormData(prev => ({ ...prev, facebookPageName: e.target.value }))}
                  placeholder="e.g. Origo Bakery"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5 text-xs">
                  <FacebookIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  Facebook Page Link
                </label>
                <input
                  type="text"
                  value={formData.facebookUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, facebookUrl: e.target.value }))}
                  placeholder="https://www.facebook.com/share/19MHmL8wph/"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
              </div>
            </div>

            {/* Dynamic Custom Links & Icons Section */}
            <CustomLinksManager
              customLinks={formData.customLinks}
              onChange={(links) => setFormData(prev => ({ ...prev, customLinks: links }))}
            />

            {/* Watermark Image & Opacity Settings */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Background Watermark Image
              </label>
              <div className="flex items-center space-x-4">
                {formData.watermarkUrl ? (
                  <div className="relative group shrink-0">
                    <img 
                      src={formData.watermarkUrl} 
                      alt="Watermark Preview" 
                      className="w-14 h-14 object-contain rounded-lg border bg-white p-1"
                      style={{ opacity: formData.watermarkOpacity ?? 0.1 }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, watermarkUrl: '' }))}
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

                <div className="flex-1 space-y-1.5">
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
                  <p className="text-[10px] text-slate-400">
                    Adds a faint background image behind invoice text.
                  </p>
                </div>
              </div>

              {/* Opacity Slider */}
              {formData.watermarkUrl && (
                <div className="pt-2 border-t border-slate-200/80">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-700">Watermark Transparency / Opacity:</span>
                    <span className="font-bold text-indigo-600 font-mono">
                      {Math.round((formData.watermarkOpacity ?? 0.07) * 100)}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0.02" 
                    max="0.30" 
                    step="0.01" 
                    value={formData.watermarkOpacity ?? 0.07} 
                    onChange={(e) => setFormData(prev => ({ ...prev, watermarkOpacity: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Currency, VAT & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Currency Symbol
                </label>
                <select
                  value={formData.currencySymbol}
                  onChange={(e) => setFormData(prev => ({ ...prev, currencySymbol: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="৳">৳ (BDT Taka)</option>
                  <option value="$">$ (USD Dollar)</option>
                  <option value="₹">₹ (INR Rupee)</option>
                  <option value="€">€ (EUR Euro)</option>
                  <option value="£">£ (GBP Pound)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  VAT / Tax %
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.vatRate ?? 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, vatRate: Math.max(0, parseFloat(e.target.value) || 0) }))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Discount %
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.discountRate ?? 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountRate: Math.max(0, parseFloat(e.target.value) || 0) }))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Shop Address
                </label>
                <input
                  type="text"
                  value={formData.shopAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, shopAddress: e.target.value }))}
                  placeholder="e.g. Shop #12, Central Market, Dhaka"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Terms & Conditions Section */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
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
                  <span>Add Term Condition</span>
                </button>
              </div>

              <p className="text-[10.5px] text-slate-500">
                You can add, edit, or delete the terms that appear at the bottom of the invoice.
              </p>

              <div className="space-y-2">
                {currentTerms.map((term, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="font-bold text-slate-500 text-[11px] w-5 shrink-0 text-right">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={term}
                      onChange={(e) => handleUpdateTerm(idx, e.target.value)}
                      placeholder={`Term #${idx + 1} e.g. Delivery Charges: 100-500 TAKA`}
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTerm(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                      title="Delete this term"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bank Details Section */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Bank Account Details
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Account Name</label>
                  <input
                    type="text"
                    value={currentBank.accountName}
                    onChange={(e) => handleBankChange('accountName', e.target.value)}
                    placeholder="AYESHA SHABNAM"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">A/C Number</label>
                  <input
                    type="text"
                    value={currentBank.accountNumber}
                    onChange={(e) => handleBankChange('accountNumber', e.target.value)}
                    placeholder="1077334520001"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Bank Name</label>
                  <input
                    type="text"
                    value={currentBank.bankName}
                    onChange={(e) => handleBankChange('bankName', e.target.value)}
                    placeholder="BRAC Bank PLC."
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Branch Name</label>
                  <input
                    type="text"
                    value={currentBank.branchName}
                    onChange={(e) => handleBankChange('branchName', e.target.value)}
                    placeholder="Dhanmondi 27 Branch"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Routing Number</label>
                  <input
                    type="text"
                    value={currentBank.routingNumber}
                    onChange={(e) => handleBankChange('routingNumber', e.target.value)}
                    placeholder="060261184"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">SWIFT Code</label>
                  <input
                    type="text"
                    value={currentBank.swiftCode}
                    onChange={(e) => handleBankChange('swiftCode', e.target.value)}
                    placeholder="BRAKBDDH"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Invoice Footer Note / Terms
              </label>
              <input
                type="text"
                value={formData.footerNote}
                onChange={(e) => setFormData(prev => ({ ...prev, footerNote: e.target.value }))}
                placeholder="e.g. Thank you for your business!"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Shop settings saved successfully! Invoice updated.</span>
              </div>
            )}
          </div>

          {/* Sticky Action Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2 shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md text-xs transition"
            >
              Save Shop Branding
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
