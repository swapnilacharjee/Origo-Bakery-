import React from 'react';
import { Upload } from 'lucide-react';

interface ContactIconUploaderProps {
  label: string;
  iconUrl?: string;
  defaultIcon: React.ReactNode;
  onUpload: (dataUrl: string) => void;
  onClear: () => void;
}

export const ContactIconUploader: React.FC<ContactIconUploaderProps> = ({
  label,
  iconUrl,
  defaultIcon,
  onUpload,
  onClear,
}) => {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Icon image must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        onUpload(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center justify-between gap-2 mb-1.5">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 shrink-0 bg-slate-100 border border-slate-200 rounded flex items-center justify-center overflow-hidden">
          {iconUrl ? (
            <img src={iconUrl} alt={label} className="w-full h-full object-contain p-0.5" />
          ) : (
            defaultIcon
          )}
        </div>
        <span className="font-bold text-slate-700 text-xs">{label}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="cursor-pointer text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded transition inline-flex items-center gap-1">
          <Upload className="w-2.5 h-2.5" />
          {iconUrl ? 'Change Icon' : 'Upload Icon'}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
        {iconUrl && (
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] font-bold text-red-600 hover:underline px-1"
            title="Reset to default icon"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};
