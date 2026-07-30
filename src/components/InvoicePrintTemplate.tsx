import React, { useState, useEffect, useRef } from 'react';
import { Invoice, ShopSettings } from '../types';
import { DEFAULT_SHOP_SETTINGS } from '../data/mockData';
import { MapPin, Phone, Globe, Mail } from 'lucide-react';
import { FacebookIcon } from './FacebookIcon';

export const A4PreviewWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isFullSize, setIsFullSize] = useState(false);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current || isFullSize) {
        setScale(1);
        return;
      }
      // Use full container width minus tiny padding (8px) for maximum fit on mobile
      const availableWidth = containerRef.current.clientWidth - 8;
      const a4WidthPx = 793.7; // 210mm in px @ 96dpi
      if (availableWidth > 0) {
        const computedScale = availableWidth / a4WidthPx;
        // Cap at 1 so on wide desktop it doesn't scale bigger than 100%, but on mobile auto-scales
        setScale(Math.min(1, Math.max(0.25, computedScale)));
      } else {
        setScale(1);
      }
    };

    updateScale();
    // Short timeout handles dynamic mobile browser layout/orientation settling
    const timer = setTimeout(updateScale, 100);

    window.addEventListener('resize', updateScale);
    window.addEventListener('orientationchange', updateScale);

    let observer: ResizeObserver | null = null;
    if (containerRef.current) {
      observer = new ResizeObserver(updateScale);
      observer.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScale);
      window.removeEventListener('orientationchange', updateScale);
      if (observer) observer.disconnect();
    };
  }, [isFullSize]);

  const a4WidthPx = 793.7;
  const a4HeightPx = 1122.5;

  return (
    <div className="w-full bg-slate-200/90 rounded-2xl p-1.5 sm:p-4 border border-slate-300 shadow-inner flex flex-col items-center">
      {/* Zoom / Scale Header Indicator */}
      <div className="w-full flex items-center justify-between mb-2 text-xs text-slate-600 font-medium px-1 flex-wrap gap-1">
        <span className="flex items-center gap-1.5 font-bold text-slate-700 text-[11px] sm:text-xs">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          A4 Live Preview ({Math.round(scale * 100)}% {scale < 1 && !isFullSize ? 'Auto Mobile View' : 'Full Size'})
        </span>
        <button
          type="button"
          onClick={() => setIsFullSize(!isFullSize)}
          className="text-[11px] bg-white hover:bg-slate-50 text-slate-700 font-bold px-2.5 py-1 rounded-md border border-slate-300 shadow-sm transition shrink-0"
        >
          {isFullSize ? 'Auto Fit' : '100% Size'}
        </button>
      </div>

      {/* Sheet Frame */}
      <div 
        ref={containerRef}
        className={`w-full flex justify-center items-start ${isFullSize ? 'overflow-x-auto pb-4' : 'overflow-hidden'}`}
      >
        <div 
          className="relative shadow-2xl rounded-sm ring-1 ring-black/10 bg-white shrink-0 transition-all duration-200"
          style={{
            width: isFullSize ? `${a4WidthPx}px` : `${a4WidthPx * scale}px`,
            minHeight: isFullSize ? `${a4HeightPx}px` : `${a4HeightPx * scale}px`,
          }}
        >
          <div 
            style={{
              width: `${a4WidthPx}px`,
              minHeight: `${a4HeightPx}px`,
              transform: isFullSize ? 'none' : `scale(${scale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

interface InvoicePrintTemplateProps {
  invoice: Invoice;
  shopSettings?: ShopSettings;
}

const formatWebsiteUrl = (url?: string): string => {
  if (!url || !url.trim()) return 'https://www.origobd.com';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
};

const formatEmailUrl = (email?: string): string => {
  const val = (email && email.trim()) ? email.trim() : 'hi@gmail.com';
  return `mailto:${val}`;
};

const getFacebookDisplayName = (settings?: ShopSettings): string => {
  if (settings?.facebookPageName && settings.facebookPageName.trim()) {
    return settings.facebookPageName.trim();
  }
  if (settings?.facebookUrl && !settings.facebookUrl.startsWith('http')) {
    return settings.facebookUrl.trim();
  }
  return 'Origo Bakery';
};

const formatFacebookUrl = (fbUrl?: string, pageName?: string): string => {
  if (fbUrl && fbUrl.trim()) {
    const trimmed = fbUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.includes('facebook.com') || trimmed.includes('fb.com')) return `https://${trimmed}`;
  }
  if (pageName && pageName.trim() && (pageName.startsWith('http://') || pageName.startsWith('https://'))) {
    return pageName.trim();
  }
  return 'https://www.facebook.com/share/19MHmL8wph/';
};

const B = '1px solid #000000';

const tdS = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: '8px',
  border: B,
  borderStyle: 'solid',
  borderWidth: '1px',
  borderColor: '#000000',
  textAlign: 'center' as const,
  color: '#000000',
  ...extra
});

const InvoiceTable: React.FC<{
  invoice: Invoice;
  bank: { accountName: string; accountNumber: string; bankName: string; branchName: string; routingNumber: string; swiftCode: string };
  subtotal: number; discountRate: number; discountAmount: number;
  vatRate: number; vatAmount: number; lessAdvance: number; grandTotal: number;
  formatNumber: (n: number) => string;
  formatQty: (n: number) => string;
}> = ({ invoice, bank, subtotal, discountRate, discountAmount, vatRate, vatAmount, lessAdvance, grandTotal, formatNumber, formatQty }) => (
  <div style={{ margin: '8px 0' }}>
    <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse', tableLayout: 'fixed', border: B }}>
      <colgroup>
        <col style={{ width: '40px' }} />
        <col style={{ width: '100px' }} />
        <col />
        <col style={{ width: '56px' }} />
        <col style={{ width: '80px' }} />
        <col style={{ width: '90px' }} />
      </colgroup>
      <thead>
        <tr style={{ backgroundColor: '#ffffff', color: '#000000', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '13px' }}>
          <th style={tdS()}>SL</th>
          <th style={tdS()}>TYPE</th>
          <th style={tdS()}>ITEM</th>
          <th style={tdS()}>QTY</th>
          <th style={tdS()}>PRICE</th>
          <th style={tdS()}>TOTAL</th>
        </tr>
      </thead>
      <tbody>
        {invoice.items && invoice.items.length > 0 ? (
          invoice.items.map((item, idx) => (
            <tr key={idx}>
              <td style={tdS({ fontWeight: '500', fontSize: '13.5px' })}>{idx + 1}.</td>
              <td style={tdS({ fontWeight: '500', fontSize: '13.5px' })}>{item.itemType || 'Item'}</td>
              <td style={tdS({ fontWeight: '500', fontSize: '13.5px', textAlign: 'center' })}>{item.productName}</td>
              <td style={tdS({ fontWeight: '500', fontSize: '13.5px' })}>{formatQty(item.quantity)}</td>
              <td style={tdS({ fontWeight: '500', fontSize: '13.5px' })}>{formatNumber(item.price)}</td>
              <td style={tdS({ fontWeight: '600', fontSize: '13.5px' })}>{formatNumber(item.subtotal)}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td style={tdS({ fontWeight: '500', fontSize: '13.5px' })}>1.</td>
            <td style={tdS({ fontWeight: '500', fontSize: '13.5px' })}>Item</td>
            <td style={tdS({ fontWeight: '500', fontSize: '13.5px', textAlign: 'center' })}>{invoice.productName}</td>
            <td style={tdS({ fontWeight: '500', fontSize: '13.5px' })}>{formatQty(invoice.quantity)}</td>
            <td style={tdS({ fontWeight: '500', fontSize: '13.5px' })}>{formatNumber(invoice.price)}</td>
            <td style={tdS({ fontWeight: '600', fontSize: '13.5px' })}>{formatNumber(invoice.totalAmount)}</td>
          </tr>
        )}
        {(invoice.items?.length || 1) < 5 && Array.from({ length: Math.max(0, 4 - (invoice.items?.length || 1)) }).map((_, i) => (
          <tr key={`empty-${i}`} style={{ height: '28px' }}>
            <td style={tdS()}></td>
            <td style={tdS()}></td>
            <td style={tdS()}></td>
            <td style={tdS()}></td>
            <td style={tdS()}></td>
            <td style={tdS()}></td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={3} style={{ ...tdS(), textAlign: 'left', verticalAlign: 'top', fontSize: '13px', lineHeight: '1.5', fontWeight: '500' }}>
            <p style={{ fontWeight: 'bold', color: '#000000', margin: '0 0 2px 0' }}>Beneficiary account: <span style={{ textTransform: 'uppercase' }}>{bank.accountName},</span></p>
            <p style={{ fontWeight: 'bold', margin: '0 0 2px 0' }}>A/C: {bank.accountNumber},</p>
            <p style={{ fontWeight: 'bold', margin: '0 0 2px 0' }}>{bank.bankName}, {bank.branchName}</p>
            <p style={{ margin: '0 0 2px 0' }}>Routing number: {bank.routingNumber}</p>
            <p style={{ margin: 0 }}>SWIFT Code: {bank.swiftCode}</p>
          </td>
          <td colSpan={3} style={{ ...tdS(), padding: 0, verticalAlign: 'top' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#000000' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: B }}><span style={{ textTransform: 'uppercase' }}>Sub Total</span><span>{formatNumber(subtotal)}</span></div>
              {discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: B }}><span>Discount {discountRate > 0 ? `(${discountRate}%)` : ''}</span><span>-{formatNumber(discountAmount)}</span></div>}
              {vatAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: B }}><span>VAT / TAX {vatRate > 0 ? `(${vatRate}%)` : ''}</span><span>+{formatNumber(vatAmount)}</span></div>}
              {lessAdvance > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: B }}><span>Less Advance</span><span>-{formatNumber(lessAdvance)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontWeight: '900', fontSize: '15px' }}><span style={{ textTransform: 'uppercase' }}>Grand Total</span><span>{formatNumber(grandTotal)}</span></div>
            </div>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
);

export const InvoicePrintTemplate: React.FC<InvoicePrintTemplateProps> = ({
  invoice,
  shopSettings = DEFAULT_SHOP_SETTINGS
}) => {
  const bank = shopSettings.bankDetails || DEFAULT_SHOP_SETTINGS.bankDetails!;
  const terms = shopSettings.termsConditions || DEFAULT_SHOP_SETTINGS.termsConditions!;

  const subtotal = invoice.subtotalAmount ?? (invoice.items && invoice.items.length > 0 
    ? invoice.items.reduce((acc, i) => acc + i.subtotal, 0) 
    : (invoice.price * invoice.quantity || invoice.totalAmount));

  const discountRate = invoice.discountRate ?? shopSettings.discountRate ?? 0;
  const discountAmount = invoice.discountAmount ?? (discountRate > 0 ? (subtotal * discountRate) / 100 : 0);

  const vatRate = invoice.vatRate ?? shopSettings.vatRate ?? 0;
  const vatAmount = invoice.vatAmount ?? (vatRate > 0 ? ((subtotal - discountAmount) * vatRate) / 100 : 0);

  const lessAdvance = invoice.lessAdvance ?? 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + vatAmount - lessAdvance);

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  const formatQty = (qty: number) => {
    return qty < 10 ? `0${qty}` : `${qty}`;
  };

  return (
    <div 
      id="printable-invoice-container" 
      className={`printable-invoice relative bg-white text-black shadow-md border border-slate-300 print:border-none print:shadow-none w-[210mm] min-w-[210mm] max-w-[210mm] min-h-[296.5mm] mx-auto font-sans box-border flex flex-col justify-between shrink-0${shopSettings.usePadBackground && shopSettings.padImageUrl ? ' pad-mode' : ''}`}
      style={{
        width: '210mm',
        minWidth: '210mm',
        maxWidth: '210mm',
        minHeight: '296.5mm',
        padding: shopSettings.usePadBackground && shopSettings.padImageUrl ? '0' : '12.7mm 12.7mm 5.08mm 12.7mm',
        boxSizing: 'border-box',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }}
    >
      {/* PAD BACKGROUND MODE: full-page background image, content overlaid */}
      {shopSettings.usePadBackground && shopSettings.padImageUrl ? (
        <>
          {/* Full A4 background pad image */}
          <img
            src={shopSettings.padImageUrl}
            alt="Pad Background"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              zIndex: 0,
              display: 'block'
            }}
          />
          {/* Invoice content overlaid on pad — starts 5 inches down, no header */}
          <div
            className="relative z-10 flex flex-col justify-between"
            style={{ paddingTop: '50mm', paddingLeft: '20mm', paddingRight: '20mm', paddingBottom: '20mm', height: '100%', boxSizing: 'border-box' }}
          >
            {/* Skip header — pad already has branding */}
            <div className="space-y-4 flex-1">
              {/* Two Info Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14.5px' }}>
                <div style={{ border: B, padding: '12px', minHeight: '120px' }}>
                  <p style={{ margin: '0 0 4px 0' }}><span style={{ fontWeight: '600' }}>Customer:</span> {invoice.customerName || 'N/A'}</p>
                  {invoice.companyName && invoice.companyName.trim() !== '' && (
                    <p style={{ margin: '0 0 4px 0' }}><span style={{ fontWeight: '600' }}>Company:</span> {invoice.companyName.trim()}</p>
                  )}
                  <p style={{ margin: '0 0 4px 0' }}><span style={{ fontWeight: '600' }}>Address:</span> {invoice.customerAddress || 'N/A'}</p>
                  <p style={{ margin: '0 0 4px 0' }}><span style={{ fontWeight: '600' }}>Mobile No:</span> {invoice.customerPhone || 'N/A'}</p>
                  <p style={{ margin: 0 }}><span style={{ fontWeight: '600' }}>E-mail:</span> {invoice.customerEmail || 'N/A'}</p>
                </div>
                <div style={{ border: B, padding: '12px', minHeight: '120px' }}>
                  <p style={{ margin: '0 0 4px 0' }}><span style={{ fontWeight: '600' }}>Invoice No:</span> {invoice.id || 'INV-000000'}</p>
                  <p style={{ margin: '0 0 4px 0' }}><span style={{ fontWeight: '600' }}>Date:</span> {invoice.date || 'N/A'}</p>
                  <p style={{ margin: '0 0 4px 0' }}><span style={{ fontWeight: '600' }}>Payment Method:</span> {invoice.paymentMethod || 'Cash'}</p>
                  <p style={{ margin: '0 0 4px 0' }}><span style={{ fontWeight: '600' }}>Batch No.</span> {invoice.batchNo || 'N/A'}</p>
                  <p style={{ margin: '0 0 4px 0' }}><span style={{ fontWeight: '600' }}>Mfg Date:</span> {invoice.mfgDate || 'N/A'}</p>
                  <p style={{ margin: '0 0 4px 0' }}><span style={{ fontWeight: '600' }}>Exp Date:</span> {invoice.expiryDate || 'N/A'}</p>
                  <p style={{ margin: 0 }}><span style={{ fontWeight: '600' }}>Delivery Date:</span> {invoice.deliveryDate || 'N/A'}</p>
                </div>
              </div>

              {/* Items Table */}
              <InvoiceTable invoice={invoice} bank={bank} subtotal={subtotal} discountRate={discountRate} discountAmount={discountAmount} vatRate={vatRate} vatAmount={vatAmount} lessAdvance={lessAdvance} grandTotal={grandTotal} formatNumber={formatNumber} formatQty={formatQty} />
            </div>

            {/* Footer */}
            <div className="relative z-10 pt-4 mt-auto flex justify-between items-end gap-6">
              <div className="text-[13px] text-black space-y-0.5 max-w-[65%]">
                <p className="font-bold text-black mb-0.5">Terms & Condition:</p>
                <ol className="space-y-0.5 text-[12px] font-medium leading-tight list-none pl-0">
                  {terms.map((term, idx) => (
                    <li key={idx} className="flex gap-1">
                      <span className="shrink-0">{idx + 1}.</span>
                      <span>{term.replace(/^\d+\.\s*/, '')}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="text-center w-48 shrink-0 pb-1">
                <div className="border-t border-black mb-1"></div>
                <span className="text-[13px] font-bold text-black">Authorized Signature</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
        <div className="watermark-container absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        {shopSettings.watermarkUrl ? (
          <img 
            src={shopSettings.watermarkUrl} 
            alt="Watermark" 
            className="w-[480px] h-[480px] object-contain opacity-[0.07]"
            style={{ opacity: shopSettings.watermarkOpacity ?? 0.07 }}
          />
        ) : (
          <div className="watermark-svg-wrapper opacity-[0.07]" style={{ opacity: shopSettings.watermarkOpacity ?? 0.07 }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 240" className="w-[480px] h-[480px]">
              <g fill="none" stroke="#000000" strokeWidth="12">
                <ellipse cx="105" cy="100" rx="42" ry="62" strokeWidth="13"/>
                <path d="M125 38 L170 38 C205 38 215 72 172 100 C215 128 205 162 125 162 L125 38 Z" strokeWidth="13" strokeLinecap="round"/>
                <line x1="125" y1="38" x2="125" y2="162" strokeWidth="18"/>
              </g>
            </svg>
          </div>
        )}
      </div>

      <div className="relative z-10 space-y-4 flex-1">
        {/* Top Header: Logo on Left, Contact Details on Right */}
        <div className="flex justify-between items-start pb-2 border-b border-black">
          {/* Logo Section */}
          <div className="flex flex-col items-start shrink-0 -mt-1">
            {shopSettings.shopLogoUrl ? (
              <img 
                src={shopSettings.shopLogoUrl} 
                alt="Shop Logo" 
                className="w-48 h-28 object-contain object-left-top"
                style={{ display: 'block', margin: 0 }}
              />
            ) : (
              <span className="text-3xl font-serif font-black tracking-widest uppercase text-black">
                {shopSettings.shopName || 'ORIGO BAKERY'}
              </span>
            )}
          </div>

          {/* Contact Info Section */}
          <div className="flex flex-col items-end space-y-1.5 text-black text-right">
            <h1 className="text-2xl font-black tracking-widest uppercase text-black leading-tight">
              {shopSettings.shopName || 'ORIGO BAKERY'}
            </h1>
            
            {/* 3 Lines Breakdown */}
            <div className="flex flex-col items-end space-y-1 text-black text-[12.5px] font-bold leading-normal">
              
              {/* Line 1: Address Part 1 */}
              {shopSettings.shopAddress && (
                <div className="inline-flex items-center gap-1.5 align-middle">
                  {shopSettings.addressIconUrl ? (
                    <img src={shopSettings.addressIconUrl} alt="Address" width={14} height={14} className="w-3.5 h-3.5 object-contain shrink-0 inline-block align-middle" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                  ) : (
                    <MapPin size={14} width={14} height={14} color="#000000" strokeWidth={2.2} className="w-3.5 h-3.5 text-black shrink-0 inline-block align-middle" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                  )}
                  <span className="inline-block align-middle">
                    {shopSettings.shopAddress.includes('Dhaka-1212') 
                      ? shopSettings.shopAddress.split('Dhaka-1212')[0].replace(/,?\s*$/, ',') 
                      : shopSettings.shopAddress}
                  </span>
                </div>
              )}

              {/* Line 2: Address Part 2 + Phone + Email */}
              {(shopSettings.shopPhone || shopSettings.shopEmail || (shopSettings.shopAddress && shopSettings.shopAddress.includes('Dhaka-1212'))) && (
                <div className="inline-flex items-center justify-end gap-3 align-middle flex-wrap">
                  {shopSettings.shopAddress && shopSettings.shopAddress.includes('Dhaka-1212') && (
                    <span className="inline-block align-middle">
                      Dhaka-1212 {shopSettings.shopAddress.split('Dhaka-1212')[1]?.trim() || ''}
                    </span>
                  )}

                  {shopSettings.shopPhone && (
                    <div className="inline-flex items-center gap-1.5 align-middle">
                      {shopSettings.phoneIconUrl ? (
                        <img src={shopSettings.phoneIconUrl} alt="Phone" width={14} height={14} className="w-3.5 h-3.5 object-contain shrink-0 inline-block align-middle" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                      ) : (
                        <Phone size={14} width={14} height={14} color="#000000" strokeWidth={2.2} className="w-3.5 h-3.5 text-black shrink-0 inline-block align-middle" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                      )}
                      <span className="inline-block align-middle">{shopSettings.shopPhone}</span>
                    </div>
                  )}

                  {shopSettings.shopEmail && (
                    <a 
                      href={formatEmailUrl(shopSettings.shopEmail)} 
                      className="inline-flex items-center gap-1.5 hover:underline text-black align-middle"
                      title="Send Email"
                    >
                      {shopSettings.emailIconUrl ? (
                        <img src={shopSettings.emailIconUrl} alt="Email" width={14} height={14} className="w-3.5 h-3.5 object-contain shrink-0 inline-block align-middle" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                      ) : (
                        <Mail size={14} width={14} height={14} color="#000000" strokeWidth={2.2} className="w-3.5 h-3.5 text-black shrink-0 inline-block align-middle" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                      )}
                      <span className="inline-block align-middle">{shopSettings.shopEmail}</span>
                    </a>
                  )}
                </div>
              )}

              {/* Line 3: Website + Facebook + Custom Links */}
              {(shopSettings.shopWebsite || shopSettings.facebookPageName || shopSettings.facebookUrl || (shopSettings.customLinks && shopSettings.customLinks.length > 0)) && (
                <div className="inline-flex items-center justify-end gap-3 align-middle flex-wrap">
                  {/* Website */}
                  {shopSettings.shopWebsite && (
                    <a 
                      href={formatWebsiteUrl(shopSettings.shopWebsite)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 hover:underline text-black align-middle"
                      title="Visit Website"
                    >
                      {shopSettings.websiteIconUrl ? (
                        <img src={shopSettings.websiteIconUrl} alt="Website" width={14} height={14} className="w-3.5 h-3.5 object-contain shrink-0 inline-block align-middle" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                      ) : (
                        <Globe size={14} width={14} height={14} color="#000000" strokeWidth={2.2} className="w-3.5 h-3.5 text-black shrink-0 inline-block align-middle" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                      )}
                      <span className="inline-block align-middle">{shopSettings.shopWebsite}</span>
                    </a>
                  )}

                  {/* Facebook */}
                  {(shopSettings.facebookPageName || shopSettings.facebookUrl) && (
                    <a 
                      href={formatFacebookUrl(shopSettings.facebookUrl, shopSettings.facebookPageName)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 hover:underline text-black align-middle"
                      title="Open Facebook Page"
                    >
                      {shopSettings.facebookIconUrl ? (
                        <img src={shopSettings.facebookIconUrl} alt="Facebook" width={14} height={14} className="w-3.5 h-3.5 object-contain shrink-0 inline-block align-middle" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                      ) : (
                        <FacebookIcon size={14} className="w-3.5 h-3.5 text-black shrink-0 inline-block align-middle" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                      )}
                      <span className="inline-block align-middle">{getFacebookDisplayName(shopSettings) || 'origobakery'}</span>
                    </a>
                  )}

                  {/* Dynamic Uploaded Custom Links */}
                  {shopSettings.customLinks && shopSettings.customLinks.length > 0 && shopSettings.customLinks.map((cl, idx) => {
                    if (!cl.name && !cl.url && !cl.iconUrl) return null;
                    const href = cl.url ? (cl.url.startsWith('http') ? cl.url : `https://${cl.url}`) : '#';
                    return (
                      <a
                        key={cl.id || idx}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 hover:underline text-black align-middle"
                        title={cl.name || cl.url || 'Custom Link'}
                      >
                        {cl.iconUrl ? (
                          <img src={cl.iconUrl} alt={cl.name || 'icon'} width={14} height={14} className="w-3.5 h-3.5 object-contain shrink-0 inline-block align-middle" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                        ) : (
                          <Globe size={14} width={14} height={14} color="#000000" strokeWidth={2.2} className="w-3.5 h-3.5 text-black shrink-0 inline-block align-middle" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                        )}
                        {cl.name || cl.url ? <span className="inline-block align-middle">{cl.name || cl.url}</span> : null}
                      </a>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Two Info Cards Side-by-Side with 1px black borders */}
        <div className="grid grid-cols-2 gap-4 text-[14.5px] font-sans">
          {/* Customer Box */}
          <div className="border border-black p-3 rounded-none space-y-1 min-h-[120px]">
            <p className="font-medium">
              <span className="font-semibold">Customer:</span> {invoice.customerName || 'N/A'}
            </p>
            {invoice.companyName && invoice.companyName.trim() !== '' && (
              <p className="font-medium">
                <span className="font-semibold">Company:</span> {invoice.companyName.trim()}
              </p>
            )}
            <p className="font-medium leading-tight">
              <span className="font-semibold">Address:</span> {invoice.customerAddress || 'N/A'}
            </p>
            <p className="font-medium">
              <span className="font-semibold">Mobile No:</span> {invoice.customerPhone || 'N/A'}
            </p>
            <p className="font-medium">
              <span className="font-semibold">E-mail:</span> {invoice.customerEmail || 'N/A'}
            </p>
          </div>

          {/* Invoice Meta Box */}
          <div className="border border-black p-3 rounded-none space-y-1 min-h-[120px]">
            <p className="font-medium">
              <span className="font-semibold">Invoice No:</span> {invoice.id || 'INV-000000'}
            </p>
            <p className="font-medium">
              <span className="font-semibold">Date:</span> {invoice.date || 'N/A'}
            </p>
            <p className="font-medium">
              <span className="font-semibold">Payment Method:</span> {invoice.paymentMethod || 'Cash'}
            </p>
            <p className="font-medium">
              <span className="font-semibold">Batch No.</span> {invoice.batchNo || 'N/A'}
            </p>
            <p className="font-medium">
              <span className="font-semibold">Mfg Date:</span> {invoice.mfgDate || 'N/A'}
            </p>
            <p className="font-medium">
              <span className="font-semibold">Exp Date:</span> {invoice.expiryDate || 'N/A'}
            </p>
            <p className="font-medium">
              <span className="font-semibold">Delivery Date:</span> {invoice.deliveryDate || 'N/A'}
            </p>
          </div>
        </div>

        {/* Table + Summary Grid */}
        <InvoiceTable invoice={invoice} bank={bank} subtotal={subtotal} discountRate={discountRate} discountAmount={discountAmount} vatRate={vatRate} vatAmount={vatAmount} lessAdvance={lessAdvance} grandTotal={grandTotal} formatNumber={formatNumber} formatQty={formatQty} />
      </div>

      {/* Footer Section: Terms & Condition + Signature */}
      <div className="relative z-10 pt-4 mt-auto flex justify-between items-end gap-6">
        {/* Terms & Condition (Left) */}
        <div className="text-[13px] text-black space-y-0.5 max-w-[65%]">
          <p className="font-bold text-black mb-0.5">Terms & Condition:</p>
          <ol className="space-y-0.5 text-[12px] font-medium leading-tight list-none pl-0">
            {terms.map((term, idx) => (
              <li key={idx} className="flex gap-1">
                <span className="shrink-0">{idx + 1}.</span>
                <span>{term.replace(/^\d+\.\s*/, '')}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Authorized Signature (Right) */}
        <div className="text-center w-48 shrink-0 pb-1">
          <div className="border-t border-black mb-1"></div>
          <span className="text-[13px] font-bold text-black">Authorized Signature</span>
        </div>
        </div>
        </>
      )}
    </div>
  );
};

