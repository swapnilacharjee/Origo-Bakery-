import React, { useState } from 'react';
import { AppsScriptConfig } from '../types';
import { Settings, Link, CheckCircle, AlertCircle, RefreshCw, Database } from 'lucide-react';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppsScriptConfig;
  onSaveConfig: (url: string) => Promise<boolean>;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig
}) => {
  const [urlInput, setUrlInput] = useState(config.webAppUrl || '');
  const [isTesting, setIsTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setStatusMsg(null);

    try {
      const success = await onSaveConfig(urlInput.trim());
      if (success) {
        setStatusMsg({
          type: 'success',
          text: 'Connected successfully! Verified connection to Google Sheets backend.'
        });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMsg({
          type: 'error',
          text: 'Unable to reach Apps Script endpoint. Please verify URL deployment settings (Access: Anyone).'
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Connection test failed.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200/90 space-y-4 max-h-[90vh] my-auto flex flex-col overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Google Sheets Database Link</h3>
              <p className="text-xs text-slate-500">Google Apps Script Web App Endpoint</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSaveAndTest} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Apps Script Web App URL *
            </label>
            <div className="relative">
              <Link className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="url"
                required
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Ensure the Web App deployment is set to "Execute as: Me" and "Who has access: Anyone".
            </p>
          </div>

          {/* Status Message */}
          {statusMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
              statusMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {statusMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setUrlInput('');
                onSaveConfig('');
                setStatusMsg(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
            >
              Reset to Demo Mode
            </button>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isTesting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing Endpoint...</span>
                  </>
                ) : (
                  <span>Test & Save Connection</span>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
