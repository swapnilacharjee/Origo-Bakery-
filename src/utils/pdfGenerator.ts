import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { InvoicePrintTemplate } from '../components/InvoicePrintTemplate';
import { Invoice, ShopSettings } from '../types';

/**
 * Sanitizes strings for standard PDF built-in fonts (Helvetica/Courier)
 * to prevent missing glyphs or pdf render crashes on non-ASCII characters.
 */
const cleanPdfText = (text: string, fallback: string = ''): string => {
  if (!text) return fallback;
  const cleaned = text.replace(/[^\x20-\x7E\xA0-\xFF]/g, '').trim();
  return cleaned.length > 0 ? cleaned : fallback;
};

let colorCanvasCtx: CanvasRenderingContext2D | null = null;
const colorCache = new Map<string, string>();

/**
 * Converts modern CSS color strings (oklab, oklch, color-mix, lab, lch, color(), etc.)
 * to standard rgb() / rgba() strings so html2canvas never throws
 * "Attempting to parse an unsupported color function".
 */
export const oklchToRgbString = (str: string): string => {
  if (!str || typeof str !== 'string') {
    return str;
  }

  // Fast path for standard colors
  if (
    !str.includes('oklch') &&
    !str.includes('oklab') &&
    !str.includes('color(') &&
    !str.includes('lab(') &&
    !str.includes('lch(')
  ) {
    return str;
  }

  if (colorCache.has(str)) {
    return colorCache.get(str)!;
  }

  // 1. Try browser canvas 2D pixel conversion (100% accurate for any CSS color function)
  try {
    if (!colorCanvasCtx && typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      colorCanvasCtx = canvas.getContext('2d', { willReadFrequently: true });
    }

    if (colorCanvasCtx) {
      colorCanvasCtx.clearRect(0, 0, 1, 1);
      colorCanvasCtx.fillStyle = str;
      colorCanvasCtx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = colorCanvasCtx.getImageData(0, 0, 1, 1).data;

      let result = '';
      if (a === 255) {
        result = `rgb(${r}, ${g}, ${b})`;
      } else if (a === 0) {
        result = 'rgba(0, 0, 0, 0)';
      } else {
        const alphaFloat = Number((a / 255).toFixed(3));
        result = `rgba(${r}, ${g}, ${b}, ${alphaFloat})`;
      }

      colorCache.set(str, result);
      return result;
    }
  } catch (err) {
    // Fallback if canvas context is restricted or fails
  }

  // 2. Fallback Math Regex for oklab(...)
  let converted = str.replace(
    /oklab\(\s*([0-9.%]+|none)\s+([0-9.-]+|none)\s+([0-9.-]+|none)(?:\s*\/\s*([0-9.%]+|none))?\s*\)/gi,
    (_m, lRaw, aRaw, bRaw, alphaRaw) => {
      let L = parseFloat(lRaw);
      if (lRaw.endsWith('%')) L = L / 100;

      let oklabA = parseFloat(aRaw);
      let oklabB = parseFloat(bRaw);

      let A = 1;
      if (alphaRaw !== undefined && alphaRaw !== 'none') {
        A = parseFloat(alphaRaw);
        if (alphaRaw.endsWith('%')) A = A / 100;
      }

      if (isNaN(L) || isNaN(oklabA) || isNaN(oklabB)) return 'rgb(0, 0, 0)';

      const l_ = L + 0.3963377774 * oklabA + 0.2158037573 * oklabB;
      const m_ = L - 0.1055613458 * oklabA - 0.0638541728 * oklabB;
      const s_ = L - 0.0894841775 * oklabA - 1.2914855480 * oklabB;

      const l3 = l_ * l_ * l_;
      const m3 = m_ * m_ * m_;
      const s3 = s_ * s_ * s_;

      const rLin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
      const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
      const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

      const gamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

      const r = Math.min(255, Math.max(0, Math.round(gamma(rLin) * 255)));
      const g = Math.min(255, Math.max(0, Math.round(gamma(gLin) * 255)));
      const b = Math.min(255, Math.max(0, Math.round(gamma(bLin) * 255)));

      return A < 1 ? `rgba(${r}, ${g}, ${b}, ${Number(A.toFixed(3))})` : `rgb(${r}, ${g}, ${b})`;
    }
  );

  // 3. Fallback Math Regex for oklch(...)
  converted = converted.replace(
    /oklch\(\s*([0-9.%]+|none)\s+([0-9.%]+|none)\s+([0-9.%]+|none)(?:\s*\/\s*([0-9.%]+|none))?\s*\)/gi,
    (_match, lRaw, cRaw, hRaw, aRaw) => {
      if (lRaw === 'none') lRaw = '0';
      if (cRaw === 'none') cRaw = '0';
      if (hRaw === 'none') hRaw = '0';

      let L = parseFloat(lRaw);
      if (lRaw.endsWith('%')) L = L / 100;

      let C = parseFloat(cRaw);
      if (cRaw.endsWith('%')) C = C / 100;

      let H = parseFloat(hRaw);

      let A = 1;
      if (aRaw !== undefined && aRaw !== 'none') {
        A = parseFloat(aRaw);
        if (aRaw.endsWith('%')) A = A / 100;
      }

      if (isNaN(L) || isNaN(C) || isNaN(H)) return 'rgb(0, 0, 0)';

      const hRad = (H * Math.PI) / 180;
      const oklabA = C * Math.cos(hRad);
      const oklabB = C * Math.sin(hRad);

      const l_ = L + 0.3963377774 * oklabA + 0.2158037573 * oklabB;
      const m_ = L - 0.1055613458 * oklabA - 0.0638541728 * oklabB;
      const s_ = L - 0.0894841775 * oklabA - 1.2914855480 * oklabB;

      const l3 = l_ * l_ * l_;
      const m3 = m_ * m_ * m_;
      const s3 = s_ * s_ * s_;

      const rLin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
      const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
      const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

      const gamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

      const r = Math.min(255, Math.max(0, Math.round(gamma(rLin) * 255)));
      const g = Math.min(255, Math.max(0, Math.round(gamma(gLin) * 255)));
      const b = Math.min(255, Math.max(0, Math.round(gamma(bLin) * 255)));

      return A < 1 ? `rgba(${r}, ${g}, ${b}, ${Number(A.toFixed(3))})` : `rgb(${r}, ${g}, ${b})`;
    }
  );

  colorCache.set(str, converted);
  return converted;
};

/**
 * Converts computed colors (including Tailwind v4 oklch/CSS vars) to standard RGB/Hex
 * and inlines computed layout, font, spacing, and opacity styles so html2canvas
 * renders the exact visual layout matching live preview.
 */
const sanitizeElementForHtml2Canvas = (sourceEl: HTMLElement, cloneEl: HTMLElement) => {
  const sourceNodes = [sourceEl, ...Array.from(sourceEl.querySelectorAll('*'))] as HTMLElement[];
  const cloneNodes = [cloneEl, ...Array.from(cloneEl.querySelectorAll('*'))] as HTMLElement[];

  sourceNodes.forEach((srcNode, idx) => {
    const targetNode = cloneNodes[idx];
    if (!targetNode || !srcNode) return;

    try {
      const computed = window.getComputedStyle(srcNode);

      // 1. Layout & Display
      targetNode.style.display = computed.display;
      targetNode.style.position = computed.position;
      if (computed.position !== 'static') {
        targetNode.style.top = computed.top;
        targetNode.style.right = computed.right;
        targetNode.style.bottom = computed.bottom;
        targetNode.style.left = computed.left;
        targetNode.style.zIndex = computed.zIndex;
      }

      // Flex & Grid Properties
      if (computed.display.includes('flex')) {
        targetNode.style.flexDirection = computed.flexDirection;
        targetNode.style.flexWrap = computed.flexWrap;
        targetNode.style.justifyContent = computed.justifyContent;
        targetNode.style.alignItems = computed.alignItems;
        targetNode.style.alignContent = computed.alignContent;
        targetNode.style.gap = computed.gap;
        targetNode.style.columnGap = computed.columnGap;
        targetNode.style.rowGap = computed.rowGap;
      } else if (computed.display.includes('grid')) {
        targetNode.style.gridTemplateColumns = computed.gridTemplateColumns;
        targetNode.style.gridTemplateRows = computed.gridTemplateRows;
        targetNode.style.gap = computed.gap;
      }

      targetNode.style.flexGrow = computed.flexGrow;
      targetNode.style.flexShrink = computed.flexShrink;
      targetNode.style.alignSelf = computed.alignSelf;

      // 2. Box Model & Dimensions
      targetNode.style.boxSizing = 'border-box';
      if (computed.width && computed.width !== 'auto') targetNode.style.width = computed.width;
      if (computed.height && computed.height !== 'auto') targetNode.style.height = computed.height;
      if (computed.minWidth && computed.minWidth !== '0px') targetNode.style.minWidth = computed.minWidth;
      if (computed.minHeight && computed.minHeight !== '0px') targetNode.style.minHeight = computed.minHeight;
      if (computed.maxWidth && computed.maxWidth !== 'none') targetNode.style.maxWidth = computed.maxWidth;
      if (computed.maxHeight && computed.maxHeight !== 'none') targetNode.style.maxHeight = computed.maxHeight;

      targetNode.style.paddingTop = computed.paddingTop;
      targetNode.style.paddingRight = computed.paddingRight;
      targetNode.style.paddingBottom = computed.paddingBottom;
      targetNode.style.paddingLeft = computed.paddingLeft;

      targetNode.style.marginTop = computed.marginTop;
      targetNode.style.marginRight = computed.marginRight;
      targetNode.style.marginBottom = computed.marginBottom;
      targetNode.style.marginLeft = computed.marginLeft;

      // 3. Colors & Background
      if (computed.color) {
        targetNode.style.color = oklchToRgbString(computed.color);
      }
      if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)' && computed.backgroundColor !== 'transparent') {
        targetNode.style.backgroundColor = oklchToRgbString(computed.backgroundColor);
      } else if (targetNode === cloneEl) {
        targetNode.style.backgroundColor = '#ffffff';
      }

      // 4. Typography
      targetNode.style.fontFamily = computed.fontFamily;
      targetNode.style.fontSize = computed.fontSize;
      targetNode.style.fontWeight = computed.fontWeight;
      targetNode.style.lineHeight = computed.lineHeight;
      targetNode.style.letterSpacing = computed.letterSpacing;
      targetNode.style.textAlign = computed.textAlign;
      targetNode.style.textTransform = computed.textTransform;
      targetNode.style.whiteSpace = computed.whiteSpace;
      targetNode.style.verticalAlign = computed.verticalAlign;

      // 5. Borders
      targetNode.style.borderTopColor = oklchToRgbString(computed.borderTopColor);
      targetNode.style.borderRightColor = oklchToRgbString(computed.borderRightColor);
      targetNode.style.borderBottomColor = oklchToRgbString(computed.borderBottomColor);
      targetNode.style.borderLeftColor = oklchToRgbString(computed.borderLeftColor);

      targetNode.style.borderTopStyle = computed.borderTopStyle;
      targetNode.style.borderRightStyle = computed.borderRightStyle;
      targetNode.style.borderBottomStyle = computed.borderBottomStyle;
      targetNode.style.borderLeftStyle = computed.borderLeftStyle;

      targetNode.style.borderTopWidth = computed.borderTopWidth;
      targetNode.style.borderRightWidth = computed.borderRightWidth;
      targetNode.style.borderBottomWidth = computed.borderBottomWidth;
      targetNode.style.borderLeftWidth = computed.borderLeftWidth;

      targetNode.style.borderRadius = computed.borderRadius;

      // 6. Opacity & Rendering
      targetNode.style.opacity = computed.opacity;
      targetNode.style.objectFit = computed.objectFit;

      // Strip filters/shadows
      targetNode.style.filter = 'none';
      targetNode.style.boxShadow = 'none';
      targetNode.style.textShadow = 'none';

      // Check if target node is inside a watermark container
      const isWatermark = targetNode.closest('.watermark-container') !== null || 
                          srcNode.closest('.watermark-container') !== null ||
                          targetNode.classList.contains('watermark-container') ||
                          targetNode.classList.contains('watermark-svg-wrapper');

      if (isWatermark) {
        targetNode.style.opacity = '0.07';
      }

      // 7. Image Elements
      if (targetNode.tagName.toLowerCase() === 'img') {
        const computedImg = window.getComputedStyle(srcNode);
        if (computedImg.display && computedImg.display !== 'none' && computedImg.display !== 'inline') {
          targetNode.style.display = computedImg.display;
        } else {
          targetNode.style.display = 'inline-block';
        }
        targetNode.style.verticalAlign = computedImg.verticalAlign || 'middle';
        targetNode.style.visibility = 'visible';
        if (!isWatermark) {
          targetNode.style.opacity = '1';
        }
      }

      // 8. SVG Elements
      if (targetNode.tagName.toLowerCase() === 'svg') {
        targetNode.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        const computedSvg = window.getComputedStyle(srcNode);
        if (computedSvg.display && computedSvg.display !== 'none' && computedSvg.display !== 'inline') {
          targetNode.style.display = computedSvg.display;
        } else {
          targetNode.style.display = 'inline-block';
        }
        targetNode.style.verticalAlign = computedSvg.verticalAlign || 'middle';
        targetNode.style.visibility = 'visible';
        const parentColor = computedSvg.color || '#000000';

        if (!targetNode.getAttribute('stroke') || targetNode.getAttribute('stroke') === 'currentColor') {
          targetNode.setAttribute('stroke', oklchToRgbString(parentColor));
        }

        const children = targetNode.querySelectorAll('path, circle, line, polyline, polygon, rect');
        children.forEach((child) => {
          const childEl = child as HTMLElement;
          const childComp = window.getComputedStyle(childEl);
          if (childComp.stroke && childComp.stroke !== 'none') {
            childEl.setAttribute('stroke', oklchToRgbString(childComp.stroke));
          } else {
            childEl.setAttribute('stroke', oklchToRgbString(parentColor));
          }
          if (childComp.fill && childComp.fill !== 'none') {
            childEl.setAttribute('fill', oklchToRgbString(childComp.fill));
          }
        });
      }
    } catch (e) {
      // Ignore individual element sanitization error
    }
  });
};

/**
 * Safely converts image URLs inside an element to Base64 to prevent html2canvas CORS hangs
 */
const prepareImagesInElement = async (element: HTMLElement): Promise<void> => {
  const images = Array.from(element.querySelectorAll('img'));
  const promises = images.map((img) => {
    return new Promise<void>((resolve) => {
      if (!img.src || img.src.startsWith('data:')) {
        resolve();
        return;
      }
      const newImg = new Image();
      newImg.crossOrigin = 'Anonymous';
      const timer = setTimeout(() => {
        resolve(); // proceed fast even if image load times out
      }, 400);

      newImg.onload = () => {
        clearTimeout(timer);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = newImg.naturalWidth || newImg.width || 200;
          canvas.height = newImg.naturalHeight || newImg.height || 200;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(newImg, 0, 0);
            img.src = canvas.toDataURL('image/png');
          }
        } catch (e) {
          // If canvas is tainted by CORS, leave original src
        }
        resolve();
      };

      newImg.onerror = () => {
        clearTimeout(timer);
        resolve();
      };

      newImg.src = img.src;
    });
  });

  await Promise.all(promises);
};

/**
 * Safely loads image URL to base64 with timeout to prevent PDF engine hanging
 */
const loadImageAsBase64 = (url: string, timeoutMs = 800): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!url || !url.trim()) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    const timer = setTimeout(() => {
      resolve(null);
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 200;
        canvas.height = img.naturalHeight || img.height || 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } else {
          resolve(null);
        }
      } catch (e) {
        resolve(null);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };

    img.src = url;
  });
};

export const generateAndDownloadPdf = async (
  invoice: Invoice, 
  shopSettings?: ShopSettings
): Promise<{ success: boolean; message: string }> => {
  const invoiceId = invoice.id || 'INV-' + Math.floor(100000 + Math.random() * 900000);
  const fileName = `Invoice-${invoiceId}.pdf`;

  // 1. Try capturing existing on-screen printable element if present
  const existingEl = document.getElementById('printable-invoice-container');

  if (existingEl) {
    try {
      await prepareImagesInElement(existingEl);

      const clone = existingEl.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.margin = '0';
      clone.style.border = 'none';
      clone.style.boxShadow = 'none';
      clone.style.outline = 'none';
      clone.style.transform = 'none';
      clone.style.width = '210mm';
      clone.style.height = 'auto';
      clone.style.minHeight = '296.5mm';
      clone.style.maxHeight = 'none';
      clone.style.overflow = 'visible';
      clone.style.backgroundColor = '#ffffff';
      document.body.appendChild(clone);

      sanitizeElementForHtml2Canvas(existingEl, clone);

      const opt = {
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          windowWidth: 794
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      const pdfPromise = html2pdf().set(opt).from(clone).save();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('html2pdf timeout')), 4500)
      );

      await Promise.race([pdfPromise, timeoutPromise]);

      if (clone.parentNode) {
        document.body.removeChild(clone);
      }

      return { success: true, message: `Invoice PDF downloaded as ${fileName}` };
    } catch (err) {
      console.warn('On-screen html2pdf capture error, trying offscreen render:', err);
    }
  }

  // 2. Try offscreen DOM mount with html2pdf for pixel-perfect template export including all custom icons
  let tempContainer: HTMLDivElement | null = null;
  let root: any = null;

  try {
    tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '210mm';
    tempContainer.style.height = 'auto';
    tempContainer.style.backgroundColor = '#ffffff';
    tempContainer.style.zIndex = '-9999';
    document.body.appendChild(tempContainer);

    root = createRoot(tempContainer);
    root.render(
      React.createElement(InvoicePrintTemplate, {
        invoice,
        shopSettings
      })
    );

    // Allow React time to mount and resolve images
    await new Promise((resolve) => setTimeout(resolve, 200));

    const invoiceEl = (tempContainer.querySelector('#printable-invoice-container') as HTMLElement) || tempContainer;

    await prepareImagesInElement(invoiceEl);

    const clone = invoiceEl.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.margin = '0';
    clone.style.border = 'none';
    clone.style.boxShadow = 'none';
    clone.style.outline = 'none';
    clone.style.transform = 'none';
    clone.style.width = '210mm';
    clone.style.height = 'auto';
    clone.style.minHeight = '296.5mm';
    clone.style.maxHeight = 'none';
    clone.style.overflow = 'visible';
    clone.style.backgroundColor = '#ffffff';
    document.body.appendChild(clone);

    sanitizeElementForHtml2Canvas(invoiceEl, clone);

    const opt = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    const pdfPromise = html2pdf().set(opt).from(clone).save();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('html2pdf offscreen timeout')), 4500)
    );

    await Promise.race([pdfPromise, timeoutPromise]);

    if (clone.parentNode) document.body.removeChild(clone);

    return { success: true, message: `Invoice PDF generated and downloaded as ${fileName}` };
  } catch (html2pdfError) {
    console.warn('html2pdf generation encountered error, falling back to programmatic jsPDF:', html2pdfError);
  } finally {
    if (tempContainer) {
      try {
        if (root) root.unmount();
        if (tempContainer.parentNode) document.body.removeChild(tempContainer);
      } catch (e) {
        // Ignore unmount error
      }
    }
  }

  // 2. Fast, reliable programmatic jsPDF generation (no freezing)
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const rawSym = shopSettings?.currencySymbol || '৳';
    const sym = (rawSym === '৳' || rawSym.charCodeAt(0) > 127) ? 'Tk ' : `${rawSym} `;

    const shopName = cleanPdfText(shopSettings?.shopName || 'ORIGO BAKERY', 'ORIGO BAKERY');
    const shopAddress = cleanPdfText(shopSettings?.shopAddress || 'Gulshan Tower, Plot # 31, Road # 53. Gulshan North C/A, Dhaka-1212 Ground Floor.', '');
    const shopPhone = cleanPdfText(shopSettings?.shopPhone || '+880 18042-56099', '');
    const shopEmail = cleanPdfText(shopSettings?.shopEmail || 'hi@gmail.com', 'hi@gmail.com');
    const shopLogoUrl = shopSettings?.shopLogoUrl || '';

    // Safely load logo and watermark in parallel with strict timeout
    const [logoBase64, watermarkBase64] = await Promise.all([
      shopLogoUrl ? loadImageAsBase64(shopLogoUrl, 600) : Promise.resolve(null),
      shopSettings?.watermarkUrl ? loadImageAsBase64(shopSettings.watermarkUrl, 600) : Promise.resolve(null)
    ]);

    let currentY = 15;

    // --- Background Watermark ---
    if (watermarkBase64) {
      try {
        const watermarkOpacity = shopSettings?.watermarkOpacity ?? 0.07;
        if ((doc as any).GState) {
          doc.setGState(new (doc as any).GState({ opacity: watermarkOpacity }));
          doc.addImage(watermarkBase64, 'PNG', 55, 90, 100, 100);
          doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
        }
      } catch (e) {
        // Fallback silently
      }
    }

    // --- Header Section ---
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 14, currentY, 35, 28);
      } catch (e) {
        // Fallback silently
      }
    }

    const titleX = logoBase64 ? 54 : 14;

    // Shop Name
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(shopName.toUpperCase(), titleX, currentY + 5);

    // Address, Phone, Website, Facebook
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    let infoY = currentY + 9.5;

    const shopWebsite = cleanPdfText(shopSettings?.shopWebsite || 'www.origobd.com', '');
    const facebookUrl = cleanPdfText(shopSettings?.facebookUrl || shopSettings?.facebookPageName || 'Origo Bakery', '');

    if (shopAddress) {
      doc.text(shopAddress, titleX, infoY);
      infoY += 3.8;
    }
    if (shopPhone) {
      doc.text(`${shopPhone}   ${shopWebsite}`, titleX, infoY);
      infoY += 3.8;
    }
    if (shopEmail || facebookUrl) {
      doc.text(`${shopEmail}   ${facebookUrl}`, titleX, infoY);
    }

    currentY += 26;

    // Header dividing line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(14, currentY, 196, currentY);

    currentY += 6;

    // --- Customer Info & Invoice Meta Boxes (Two Side-by-Side Boxes) ---
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(14, currentY, 88, 33);
    doc.rect(108, currentY, 88, 33);

    // Customer Box Left
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);

    const customerName = cleanPdfText(invoice.customerName || 'N/A', 'N/A');
    const companyName = cleanPdfText(invoice.companyName || '', '');
    const customerAddress = cleanPdfText(invoice.customerAddress || 'N/A', 'N/A');
    const customerPhone = cleanPdfText(invoice.customerPhone || 'N/A', 'N/A');
    const customerEmail = cleanPdfText(invoice.customerEmail || 'N/A', 'N/A');

    let cY = currentY + 4.5;
    doc.text(`Customer: ${customerName}`, 17, cY);
    if (companyName) {
      cY += 3.8;
      doc.text(`Company: ${companyName}`, 17, cY);
    }
    cY += 3.8;
    const splitCustAddress = doc.splitTextToSize(`Address: ${customerAddress}`, 82);
    doc.text(splitCustAddress, 17, cY);
    const addrOffset = (splitCustAddress.length - 1) * 3.5;
    cY += 3.8 + addrOffset;
    doc.text(`Mobile No: ${customerPhone}`, 17, cY);
    cY += 3.8;
    doc.text(`E-mail: ${customerEmail}`, 17, cY);

    // Invoice Meta Box Right
    const batchNo = cleanPdfText(invoice.batchNo || 'N/A', 'N/A');
    const mfgDate = cleanPdfText(invoice.mfgDate || 'N/A', 'N/A');
    const deliveryDate = cleanPdfText(invoice.deliveryDate || 'N/A', 'N/A');
    const paymentMethod = cleanPdfText(invoice.paymentMethod || 'Cash', 'Cash');

    doc.text(`Invoice No: ${invoiceId}`, 111, currentY + 5);
    doc.text(`Date: ${invoice.date || 'N/A'}`, 111, currentY + 9);
    doc.text(`Payment Method: ${paymentMethod}`, 111, currentY + 13);
    doc.text(`Batch No. ${batchNo}`, 111, currentY + 17);
    doc.text(`Mfg Date: ${mfgDate}`, 111, currentY + 21);
    doc.text(`Exp Date: ${cleanPdfText(invoice.expiryDate || 'N/A', 'N/A')}`, 111, currentY + 25);
    doc.text(`Delivery Date: ${deliveryDate}`, 111, currentY + 29);

    currentY += 38;

    // --- Items Table ---
    const itemsMeta = (invoice.items && invoice.items.length > 0)
      ? invoice.items.map(item => ({
          type: cleanPdfText(item.itemType || 'Item', 'Item'),
          name: cleanPdfText(item.productName, 'Bakery Product')
        }))
      : [{
          type: 'Item',
          name: cleanPdfText(invoice.productName || 'Bakery Product', 'Bakery Product')
        }];

    const tableBody = itemsMeta.map((meta, idx) => {
      const item = (invoice.items && invoice.items[idx]) ? invoice.items[idx] : invoice;
      const qty = item.quantity || 1;
      const price = item.price || invoice.totalAmount || 0;
      const subtotal = ('subtotal' in item && typeof item.subtotal === 'number') ? item.subtotal : (invoice.totalAmount || 0);

      const qtyStr = qty < 10 ? `0${qty}` : `${qty}`;
      const priceStr = price.toLocaleString('en-US');
      const subtotalStr = subtotal.toLocaleString('en-US');

      return [
        `${idx + 1}.`,
        meta.type,
        meta.name,
        qtyStr,
        priceStr,
        subtotalStr
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['SL', 'TYPE', 'ITEM', 'QTY', 'PRICE', 'TOTAL']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8.5,
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [0, 0, 0],
        lineWidth: 0.2,
        lineColor: [0, 0, 0]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 28, halign: 'center' },
        2: { cellWidth: 80, halign: 'center' },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 24, halign: 'center' },
        5: { cellWidth: 24, halign: 'center', fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 }
    });

    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 6;

    // --- Beneficiary Account & Summary ---
    const bank = shopSettings?.bankDetails;
    const accountName = cleanPdfText(bank?.accountName || 'AYESHA SHABNAM', 'AYESHA SHABNAM');
    const accountNumber = cleanPdfText(bank?.accountNumber || '1077334520001', '1077334520001');
    const bankName = cleanPdfText(bank?.bankName || 'BRAC Bank PLC.', 'BRAC Bank PLC.');
    const branchName = cleanPdfText(bank?.branchName || 'Dhanmondi 27 Branch', 'Dhanmondi 27 Branch');
    const routingNumber = cleanPdfText(bank?.routingNumber || '060261184', '060261184');
    const swiftCode = cleanPdfText(bank?.swiftCode || 'BRAKBDDH', 'BRAKBDDH');

    const subtotalNum = invoice.subtotalAmount ?? (invoice.items && invoice.items.length > 0 
      ? invoice.items.reduce((acc, i) => acc + i.subtotal, 0) 
      : invoice.totalAmount);

    const discountRateNum = invoice.discountRate ?? shopSettings?.discountRate ?? 0;
    const discountAmountNum = invoice.discountAmount ?? (discountRateNum > 0 ? (subtotalNum * discountRateNum) / 100 : 0);

    const vatRateNum = invoice.vatRate ?? shopSettings?.vatRate ?? 0;
    const vatAmountNum = invoice.vatAmount ?? (vatRateNum > 0 ? ((subtotalNum - discountAmountNum) * vatRateNum) / 100 : 0);

    const lessAdvanceNum = invoice.lessAdvance ?? 0;
    const grandTotalNum = Math.max(0, subtotalNum - discountAmountNum + vatAmountNum - lessAdvanceNum);

    // Build summary rows array dynamically
    const summaryRows: { label: string; value: string }[] = [
      { label: 'Sub Total', value: subtotalNum.toLocaleString('en-US') }
    ];

    if (discountAmountNum > 0) {
      const discountLabel = discountRateNum > 0 ? `Discount (${discountRateNum}%)` : 'Discount';
      summaryRows.push({ label: discountLabel, value: `-${discountAmountNum.toLocaleString('en-US')}` });
    }

    if (vatAmountNum > 0) {
      const vatLabel = vatRateNum > 0 ? `VAT / TAX (${vatRateNum}%)` : 'VAT / TAX';
      summaryRows.push({ label: vatLabel, value: `+${vatAmountNum.toLocaleString('en-US')}` });
    }

    if (lessAdvanceNum > 0) {
      summaryRows.push({ label: 'Less Advance', value: `-${lessAdvanceNum.toLocaleString('en-US')}` });
    }

    summaryRows.push({ label: 'Grand Total', value: grandTotalNum.toLocaleString('en-US') });

    const rowHeight = 4.5;
    const boxHeight = Math.max(22, summaryRows.length * rowHeight + 3);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(14, currentY, 118, boxHeight);
    doc.rect(132, currentY, 64, boxHeight);

    // Left Bank Beneficiary Info
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(`Beneficiary account: ${accountName},`, 17, currentY + 4.5);
    doc.text(`A/C: ${accountNumber},`, 17, currentY + 8.5);
    doc.text(`${bankName}, ${branchName}`, 17, currentY + 12.5);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Routing number: ${routingNumber}`, 17, currentY + 16.5);
    doc.text(`SWIFT Code: ${swiftCode}`, 17, currentY + 20.5);

    // Right Summary Grid
    let sY = currentY + 2.5;
    summaryRows.forEach((row, idx) => {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(row.label === 'Grand Total' ? 8.5 : 8);
      if (idx > 0) {
        doc.line(132, sY, 196, sY);
      }
      doc.text(row.label, 135, sY + 3.2);
      doc.text(row.value, 192, sY + 3.2, { align: 'right' });
      sY += rowHeight;
    });

    currentY += boxHeight + 4;

    // --- Footer & Terms (Starts at 240mm from top of page) ---
    const termsStartY = 240;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Terms & Condition:', 14, termsStartY);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    const defaultTerms = [
      '1. Delivery Available: Only in Dhaka City.',
      '2. Delivery Charges: 100-500 TAKA (Area-based).',
      '3. Customized Cake: Order 5 days in advance and extra charges applicable.',
      '4. Regular Cake: Order 3 days in advance.',
      '5. Brownies & Cupcakes: Order 1 day in advance.',
      '6. 40% payment advance on any order.',
      '7. Excluding VAT & AIT.'
    ];
    const termsList = shopSettings?.termsConditions || defaultTerms;
    let tY = termsStartY + 4.5;
    termsList.forEach(term => {
      doc.text(term, 14, tY);
      tY += 3.8;
    });

    // Authorized Signature (Right Positioned)
    const sigY = 265;
    doc.line(148, sigY, 196, sigY);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Authorized Signature', 172, sigY + 4, { align: 'center' });

    doc.save(fileName);
    return { success: true, message: `Invoice PDF generated and downloaded as ${fileName}` };
  } catch (err) {
    console.error('Failed to generate PDF:', err);
    return { success: false, message: 'PDF generation failed.' };
  } finally {
    // Ensure body interaction styles are cleanly restored
    document.body.style.pointerEvents = '';
    document.body.style.overflow = '';
    document.documentElement.style.pointerEvents = '';
    document.documentElement.style.overflow = '';
  }
};

/**
 * Captures the exact high-resolution printable invoice DOM element (including all uploaded custom icons & SVGs)
 * and downloads it directly as a crisp PNG image.
 */
export const generateAndDownloadInvoiceImage = async (
  invoice: Invoice,
  shopSettings?: ShopSettings
): Promise<{ success: boolean; message: string }> => {
  const invoiceId = invoice.id || 'INV-' + Math.floor(100000 + Math.random() * 900000);
  const fileName = `Invoice-${invoiceId}.png`;

  let elementToCapture = document.getElementById('printable-invoice-container');
  let tempContainer: HTMLDivElement | null = null;
  let root: any = null;

  if (!elementToCapture) {
    tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '210mm';
    tempContainer.style.backgroundColor = '#ffffff';
    tempContainer.style.zIndex = '-9999';
    document.body.appendChild(tempContainer);

    root = createRoot(tempContainer);
    root.render(
      React.createElement(InvoicePrintTemplate, {
        invoice,
        shopSettings
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 250));
    elementToCapture = (tempContainer.querySelector('#printable-invoice-container') as HTMLElement) || tempContainer;
  }

  try {
    await prepareImagesInElement(elementToCapture);

    const clone = elementToCapture.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.margin = '0';
    clone.style.transform = 'none';
    clone.style.width = '210mm';
    clone.style.backgroundColor = '#ffffff';
    document.body.appendChild(clone);

    sanitizeElementForHtml2Canvas(elementToCapture, clone);

    const canvas = await html2canvas(clone, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    if (clone.parentNode) {
      document.body.removeChild(clone);
    }

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, message: `Invoice image downloaded as ${fileName}` };
  } catch (err: any) {
    console.error('Image capture error:', err);
    throw new Error('Failed to generate image: ' + (err?.message || err));
  } finally {
    if (tempContainer) {
      try {
        if (root) root.unmount();
        if (tempContainer.parentNode) document.body.removeChild(tempContainer);
      } catch (e) {
        // ignore
      }
    }
    document.body.style.pointerEvents = '';
    document.body.style.overflow = '';
    document.documentElement.style.pointerEvents = '';
  }
};

