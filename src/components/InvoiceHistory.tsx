import React, { useState } from 'react';
import { Invoice, ShopSettings } from '../types';
import { History, Search, DollarSign, Calendar, FileText, Download, Eye, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { InvoicePrintTemplate, A4PreviewWrapper } from './InvoicePrintTemplate';
import { generateAndDownloadPdf, generateAndDownloadInvoiceImage } from '../utils/pdfGenerator';

interface InvoiceHistoryProps {
  invoices: Invoice[];
  onRefresh: () => Promise<void>;
  isLoading: boolean;
  shopSettings?: ShopSettings;
}

export const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({
  invoices,
  onRefresh,
  isLoading,
  shopSettings
}) => {
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const currencySym = shopSettings?.currencySymbol || '৳';

  const filtered = invoices.filter(inv => 
    inv.id.toLowerCase().includes(search.toLowerCase()) ||
    inv.productName.toLowerCase().includes(search.toLowerCase()) ||
    (inv.customerName && inv.customerName.toLowerCase().includes(search.toLowerCase()))
  );

  const totalSales = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);

  const handleDownloadPastPdf = async (inv: Invoice) => {
    setDownloadingId(inv.id);
    setSelectedInvoice(inv);

    // Small delay to allow React to mount InvoicePrintTemplate in the DOM
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      await generateAndDownloadPdf(inv, shopSettings);
    } catch (err) {
      console.error('PDF Download error:', err);
    } finally {
      setDownloadingId(null);
      setSelectedInvoice(null);
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
      document.documentElement.style.pointerEvents = '';
    }
  };

  const handleDownloadPastImage = async (inv: Invoice) => {
    setDownloadingId(inv.id);
    setSelectedInvoice(inv);

    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      await generateAndDownloadInvoiceImage(inv, shopSettings);
    } catch (err) {
      console.error('Image Download error:', err);
    } finally {
      setDownloadingId(null);
      setSelectedInvoice(null);
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
      document.documentElement.style.pointerEvents = '';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Total Invoices</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{invoices.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Total Revenue</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{currencySym}{totalSales.toFixed(2)}</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Database Status</span>
            <span className="text-xs font-bold text-slate-700 mt-1 block">Google Sheets & Local Sync</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 text-slate-600">
            <History className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search invoice history by Invoice ID, Product Name, or Customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Invoice ID</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Product Name</th>
                <th className="p-3.5 text-right">Price</th>
                <th className="p-3.5 text-center">Quantity</th>
                <th className="p-3.5 text-right">Total Amount</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No invoices found. Create a new invoice in Billing Form tab.
                  </td>
                </tr>
              ) : (
                filtered.map((inv, idx) => (
                  <tr key={`${inv.id}-${idx}`} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-amber-700">{inv.id}</td>
                    <td className="p-3.5 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {inv.date}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-800">
                      <div className="font-semibold text-slate-900">{inv.customerName || 'Walk-in Customer'}</div>
                      {inv.customerPhone && <div className="text-[11px] text-slate-500">{inv.customerPhone}</div>}
                      {inv.companyName && <div className="text-[11px] text-slate-600 font-medium">{inv.companyName}</div>}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{inv.productName}</td>
                    <td className="p-3.5 text-right text-slate-700">{currencySym}{inv.price.toFixed(2)}</td>
                    <td className="p-3.5 text-center font-bold text-slate-800">{inv.quantity}</td>
                    <td className="p-3.5 text-right font-black text-amber-800">{currencySym}{inv.totalAmount.toFixed(2)}</td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setViewingInvoice(inv)}
                        className="no-print px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium transition inline-flex items-center gap-1.5 border border-indigo-200 text-xs"
                        title="View Full Invoice"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Full Invoice Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-slate-100 relative">
            <div className="no-print flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Invoice Details — {viewingInvoice.id}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadPastPdf(viewingInvoice)}
                  disabled={downloadingId === viewingInvoice.id}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow-sm"
                >
                  {downloadingId === viewingInvoice.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => handleDownloadPastImage(viewingInvoice)}
                  disabled={downloadingId === viewingInvoice.id}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow-sm"
                >
                  {downloadingId === viewingInvoice.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                  <span>Download Image</span>
                </button>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <A4PreviewWrapper>
              <InvoicePrintTemplate invoice={viewingInvoice} shopSettings={shopSettings} />
            </A4PreviewWrapper>
          </div>
        </div>
      )}

      {/* Offscreen container for past invoice reprint / PDF generation */}
      {selectedInvoice && (
        <div className="offscreen-print-container">
          <InvoicePrintTemplate invoice={selectedInvoice} shopSettings={shopSettings} />
        </div>
      )}

    </div>
  );
};
