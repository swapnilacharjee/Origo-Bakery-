import React from 'react';
import { CustomLink } from '../types';
import { Plus, Trash2, Upload, Image as ImageIcon, Link as LinkIcon, Globe, Info } from 'lucide-react';

interface CustomLinksManagerProps {
  customLinks?: CustomLink[];
  onChange: (links: CustomLink[]) => void;
}

export const CustomLinksManager: React.FC<CustomLinksManagerProps> = ({
  customLinks = [],
  onChange
}) => {
  const handleAddLink = () => {
    const newLink: CustomLink = {
      id: 'link_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: '',
      url: '',
      iconUrl: ''
    };
    onChange([...customLinks, newLink]);
  };

  const handleUpdateLink = (id: string, fields: Partial<CustomLink>) => {
    const updated = customLinks.map(link => {
      if (link.id === id) {
        return { ...link, ...fields };
      }
      return link;
    });
    onChange(updated);
  };

  const handleDeleteLink = (id: string) => {
    onChange(customLinks.filter(link => link.id !== id));
  };

  const handleIconFileUpload = (id: string, file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Icon image must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        handleUpdateLink(id, { iconUrl: result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" /> Custom Links & Upload Icons
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Add custom social links or website URLs with uploaded icon images (Facebook, WhatsApp, Website, etc.)
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddLink}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Add New Link
        </button>
      </div>

      {customLinks.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-white p-4">
          <LinkIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-600 mb-2">No custom links added yet</p>
          <button
            type="button"
            onClick={handleAddLink}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add First Link
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {customLinks.map((link, idx) => (
            <div key={link.id || idx} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  Link #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteLink(link.id)}
                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition text-xs flex items-center gap-1 font-semibold"
                  title="Delete Link"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Icon upload / preview */}
                <div className="md:col-span-4 flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="w-10 h-10 shrink-0 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden relative shadow-xs">
                    {link.iconUrl ? (
                      <img src={link.iconUrl} alt="Icon" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Upload Icon
                    </label>
                    <div className="flex items-center gap-1">
                      <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] bg-white hover:bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-300 font-medium transition shadow-2xs">
                        <Upload className="w-3 h-3 text-slate-500" /> Browse
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleIconFileUpload(link.id, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      {link.iconUrl && (
                        <button
                          type="button"
                          onClick={() => handleUpdateLink(link.id, { iconUrl: '' })}
                          className="text-[10px] text-red-600 hover:underline font-semibold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name Input */}
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Display Name <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={link.name || ''}
                    onChange={(e) => handleUpdateLink(link.id, { name: e.target.value })}
                    placeholder="e.g. Facebook Page, WhatsApp"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Link URL Input */}
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Link / URL <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={link.url || ''}
                    onChange={(e) => handleUpdateLink(link.id, { url: e.target.value })}
                    placeholder="e.g. https://facebook.com/..."
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-amber-50 text-amber-800 p-2.5 rounded-lg border border-amber-200/80">
        <Info className="w-4 h-4 shrink-0 text-amber-600" />
        <span>Uploaded icons and names will automatically appear in the invoice header and print outputs.</span>
      </div>
    </div>
  );
};
