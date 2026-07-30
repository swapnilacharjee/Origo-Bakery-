export const CODE_GS = `/**
 * Google Apps Script Backend API for Invoice & Billing System
 * Google Sheets Database:
 *   - Sheet 1: "Products" (A: Product ID, B: Type, C: Product Name, D: Price, E: Stock Quantity, F: Description)
 *   - Sheet 2: "Invoices" (A: Invoice ID, B: Date, C: Product Name, D: Price, E: Quantity, F: Total Amount)
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getProducts';
  
  try {
    if (action === 'getProducts') {
      return responseJSON(getProductsData());
    } else if (action === 'getInvoices') {
      return responseJSON(getInvoicesData());
    } else if (action === 'ping') {
      return responseJSON({ status: 'success', message: 'Backend connected successfully!' });
    } else {
      return responseJSON(getProductsData());
    }
  } catch (error) {
    return responseJSON({ status: 'error', message: error.toString() });
  }
}

function doPost(e) {
  try {
    var data = {};
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    }

    var action = data.action || 'saveInvoice';

    if (action === 'saveInvoice') {
      var result = saveInvoiceAndDeductStock(data.invoice || data);
      return responseJSON(result);
    } else if (action === 'addProduct') {
      var result = addProductToSheet(data.product);
      return responseJSON(result);
    } else {
      return responseJSON({ status: 'error', message: 'Invalid action requested' });
    }
  } catch (error) {
    return responseJSON({ status: 'error', message: error.toString() });
  }
}

/**
 * Helper function to safely parse numeric values from strings containing symbols (e.g., '৳500', '500 tk', '10 pcs')
 */
function parseNum(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  var str = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
  var num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Fetch all products from "Products" sheet with smart column auto-detection
 */
function getProductsData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Products") || ss.getSheets()[0];
  
  if (!sheet) {
    sheet = initializeProductsSheet(ss);
  }

  var data = sheet.getDataRange().getValues();
  if (!data || data.length <= 1) {
    return { status: 'success', products: [] };
  }

  // 1. Smart Header Column Mapping from Row 1
  var headerRow = data[0].map(function(cell) { return String(cell || '').toLowerCase().trim(); });
  
  var idIdx = -1;
  var typeIdx = -1;
  var nameIdx = -1;
  var priceIdx = -1;
  var stockIdx = -1;
  var descIdx = -1;

  for (var h = 0; h < headerRow.length; h++) {
    var hText = headerRow[h];
    if (!hText) continue;

    if (hText.indexOf('id') !== -1 || hText.indexOf('code') !== -1) {
      if (idIdx === -1 && hText.indexOf('name') === -1) idIdx = h;
    }
    if (hText.indexOf('type') !== -1 || hText.indexOf('cat') !== -1 || hText.indexOf('category') !== -1) {
      if (typeIdx === -1) typeIdx = h;
    }
    if (hText.indexOf('name') !== -1 || hText.indexOf('product') !== -1 || hText.indexOf('title') !== -1 || hText.indexOf('item') !== -1) {
      if (nameIdx === -1 && hText.indexOf('id') === -1 && hText.indexOf('type') === -1) nameIdx = h;
    }
    if (hText.indexOf('price') !== -1 || hText.indexOf('rate') !== -1 || hText.indexOf('mrp') !== -1 || hText.indexOf('cost') !== -1 || hText.indexOf('amount') !== -1) {
      if (priceIdx === -1) priceIdx = h;
    }
    if (hText.indexOf('stock') !== -1 || hText.indexOf('qty') !== -1 || hText.indexOf('quantity') !== -1 || hText.indexOf('count') !== -1) {
      if (stockIdx === -1) stockIdx = h;
    }
    if (hText.indexOf('desc') !== -1 || hText.indexOf('details') !== -1 || hText.indexOf('note') !== -1) {
      if (descIdx === -1) descIdx = h;
    }
  }

  var products = [];
  var hasValidHeaderMap = (nameIdx !== -1 && priceIdx !== -1);

  // 2. Parse Rows
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row || row.length === 0) continue;

    var idVal = '';
    var productName = '';
    var itemType = 'General';
    var price = 0;
    var stock = 0;
    var desc = '';

    if (hasValidHeaderMap) {
      idVal = String(idIdx !== -1 ? row[idIdx] : row[0] || '').trim();
      productName = String(row[nameIdx] || '').trim();
      itemType = typeIdx !== -1 ? String(row[typeIdx] || 'General').trim() : 'General';
      price = parseNum(row[priceIdx]);
      stock = stockIdx !== -1 ? parseNum(row[stockIdx]) : 0;
      desc = descIdx !== -1 ? String(row[descIdx] || '').trim() : '';
    } else {
      // Intelligent fallback matching when header labels aren't recognized
      idVal = String(row[0] || '').trim();
      
      if (row.length >= 6) {
        // Standard 6 column: Product ID (0) | Type (1) | Product Name (2) | Price (3) | Stock Quantity (4) | Description (5)
        itemType = String(row[1] || 'General').trim();
        productName = String(row[2] || row[1] || '').trim();
        price = parseNum(row[3]);
        stock = parseNum(row[4]);
        desc = String(row[5] || '').trim();
      } else if (row.length === 5) {
        // 5 column: Product ID | Type | Product Name | Price | Stock Quantity
        itemType = String(row[1] || 'General').trim();
        productName = String(row[2] || row[1] || '').trim();
        price = parseNum(row[3]);
        stock = parseNum(row[4]);
      } else if (row.length === 4) {
        // 4 column legacy: Product ID | Product Name | Price | Stock Quantity
        productName = String(row[1] || '').trim();
        price = parseNum(row[2]);
        stock = parseNum(row[3]);
      }
    }

    if (idVal || productName) {
      products.push({
        id: idVal || ('PRD-' + (i + 100)),
        name: productName || 'Unnamed Item',
        itemType: itemType || 'General',
        price: price,
        stock: stock,
        description: desc
      });
    }
  }

  return { status: 'success', products: products };
}

/**
 * Fetch all saved invoices from "Invoices" sheet
 */
function getInvoicesData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Invoices");
  
  if (!sheet) {
    sheet = initializeInvoicesSheet(ss);
  }

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { status: 'success', invoices: [] };
  }

  var invoices = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[0]) {
      var dateVal = row[1];
      if (dateVal instanceof Date) {
        dateVal = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
      }
      invoices.push({
        id: String(row[0]),
        date: String(dateVal || ''),
        productName: String(row[2] || ''),
        price: Number(row[3]) || 0,
        quantity: Number(row[4]) || 0,
        totalAmount: Number(row[5]) || 0
      });
    }
  }

  return { status: 'success', invoices: invoices };
}

/**
 * Save Invoice details to "Invoices" sheet & deduct stock in "Products" sheet
 */
function saveInvoiceAndDeductStock(invoice) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var invoicesSheet = ss.getSheetByName("Invoices");
  var productsSheet = ss.getSheetByName("Products");

  if (!invoicesSheet) invoicesSheet = initializeInvoicesSheet(ss);
  if (!productsSheet) productsSheet = initializeProductsSheet(ss);

  var invoiceId = invoice.id || ('INV-' + Math.floor(1000 + Math.random() * 9000));
  var dateStr = invoice.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  
  var items = invoice.items || [];
  if (items.length === 0 && invoice.productName) {
    items = [{
      productId: invoice.productId || '',
      productName: invoice.productName,
      price: Number(invoice.price) || 0,
      quantity: Number(invoice.quantity) || 1,
      subtotal: Number(invoice.totalAmount) || (Number(invoice.price) * Number(invoice.quantity))
    }];
  }

  // 1. Process Stock Reduction in "Products" sheet
  var productData = productsSheet.getDataRange().getValues();
  
  for (var k = 0; k < items.length; k++) {
    var item = items[k];
    var qtyToDeduct = Number(item.quantity) || 0;
    
    for (var i = 1; i < productData.length; i++) {
      var rowId = String(productData[i][0]).trim();
      var rowCol1 = String(productData[i][1]).trim();
      var rowCol2 = String(productData[i][2]).trim();
      
      // Match by Product ID or Product Name (either col 1 or col 2)
      var isMatch = (item.productId && rowId === String(item.productId).trim()) || 
                    (rowCol2.toLowerCase() === String(item.productName).toLowerCase().trim()) ||
                    (rowCol1.toLowerCase() === String(item.productName).toLowerCase().trim());

      if (isMatch) {
        // In 6-col sheet [Product ID, Type, Product Name, Price, Stock Quantity, Description]:
        // Stock Quantity is Column E (index 4, 1-based column 5)
        var stockColIndex = (productData[i].length >= 5) ? 4 : 3;
        var currentStock = Number(productData[i][stockColIndex]) || 0;
        var newStock = Math.max(0, currentStock - qtyToDeduct);
        
        // Update stock in Google Sheet
        productsSheet.getRange(i + 1, stockColIndex + 1).setValue(newStock);
        break;
      }
    }
  }

  // 2. Append Invoice records to "Invoices" sheet
  // If invoice has multiple items, append main summary line or itemized lines
  var summaryProductName = invoice.productName || items.map(function(it) { return it.productName; }).join(", ");
  var summaryPrice = Number(invoice.price) || (items.length > 0 ? items[0].price : 0);
  var summaryQty = Number(invoice.quantity) || items.reduce(function(acc, it) { return acc + Number(it.quantity); }, 0);
  var grandTotal = Number(invoice.totalAmount) || items.reduce(function(acc, it) { return acc + Number(it.subtotal); }, 0);

  invoicesSheet.appendRow([
    invoiceId,
    dateStr,
    summaryProductName,
    summaryPrice,
    summaryQty,
    grandTotal
  ]);

  return {
    status: 'success',
    message: 'Invoice ' + invoiceId + ' saved successfully and stock updated!',
    invoiceId: invoiceId,
    totalAmount: grandTotal
  };
}

/**
 * Add a new product to "Products" sheet
 */
function addProductToSheet(product) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Products");
  if (!sheet) sheet = initializeProductsSheet(ss);

  sheet.appendRow([
    product.id,
    product.itemType || 'General',
    product.name,
    Number(product.price),
    Number(product.stock),
    product.description || ''
  ]);

  return { status: 'success', message: 'Product added successfully!' };
}

/**
 * Initialize "Products" sheet headers if missing
 */
function initializeProductsSheet(ss) {
  var sheet = ss.insertSheet("Products");
  sheet.appendRow(["Product ID", "Type", "Product Name", "Price", "Stock Quantity", "Description"]);
  sheet.getRange("A1:F1").setFontWeight("bold").setBackground("#e0f2fe");
  return sheet;
}

/**
 * Initialize "Invoices" sheet headers if missing
 */
function initializeInvoicesSheet(ss) {
  var sheet = ss.insertSheet("Invoices");
  sheet.appendRow(["Invoice ID", "Date", "Product Name", "Price", "Quantity", "Total Amount"]);
  sheet.getRange("A1:F1").setFontWeight("bold").setBackground("#f0fdf4");
  return sheet;
}

/**
 * Helper to return JSON output with CORS headers
 */
function responseJSON(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const STANDALONE_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice & Billing System</title>
  <!-- Tailwind CSS CDN (for production, self-host or use a locked version with SRI hash) -->
  <script src="https://cdn.tailwindcss.com" crossorigin="anonymous"></script>
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    
    @media print {
      .no-print { display: none !important; }
      body { background: #ffffff !important; color: #000000 !important; }
      .printable-invoice {
        display: block !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
      }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen">

  <!-- Top Navigation Header -->
  <header class="no-print bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="bg-indigo-600 text-white p-2 rounded-lg font-bold text-xl">⚡</div>
        <div>
          <h1 class="font-bold text-lg leading-tight">QuickBill Pro</h1>
          <p class="text-xs text-slate-400">Google Sheets Powered Invoice & Billing</p>
        </div>
      </div>
      <div class="flex items-center space-x-3 text-xs">
        <span id="api-status-badge" class="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-medium flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> Demo Mode
        </span>
        <button onclick="toggleConfigModal()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md font-medium text-slate-200 transition">
          ⚙️ Settings / Web App URL
        </button>
      </div>
    </div>
  </header>

  <!-- Main Content Area -->
  <main class="max-w-6xl mx-auto px-4 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <!-- Billing Form Panel (Col 7) -->
      <div class="no-print lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div class="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <div>
            <h2 class="text-xl font-bold text-slate-900">New Sale & Billing</h2>
            <p class="text-sm text-slate-500">Select product, enter quantity, and generate invoice bill.</p>
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded">
            INV ID: <span id="display-inv-id" class="text-indigo-600">INV-1001</span>
          </span>
        </div>

        <form id="billing-form" onsubmit="handleSaveAndPrint(event)" class="space-y-5">
          
          <!-- Product Autocomplete Dropdown -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Select Product *</label>
            <select id="product-select" onchange="onProductSelected()" required class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              <option value="">-- Choose a Product --</option>
            </select>
          </div>

          <!-- Product Auto-Filled Information -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span class="block text-xs text-slate-500 font-medium">Product ID</span>
              <input type="text" id="auto-product-id" readonly placeholder="--" class="w-full bg-transparent font-semibold text-sm text-slate-800 focus:outline-none">
            </div>
            <div>
              <span class="block text-xs text-slate-500 font-medium">Unit Price ($)</span>
              <input type="text" id="auto-price" readonly placeholder="$0.00" class="w-full bg-transparent font-semibold text-sm text-indigo-600 focus:outline-none">
            </div>
            <div>
              <span class="block text-xs text-slate-500 font-medium">Current Stock</span>
              <span id="auto-stock-badge" class="inline-block mt-0.5 text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">--</span>
            </div>
            <div class="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200">
              <span class="block text-xs text-slate-500 font-medium">Description</span>
              <p id="auto-description" class="text-xs text-slate-600 italic mt-0.5">Select a product above to preview details.</p>
            </div>
          </div>

          <!-- Quantity Input & Calculation -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Billing Quantity *</label>
              <input type="number" id="input-quantity" min="1" value="1" oninput="calculateSubtotal()" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              <!-- Error Validation Message -->
              <p id="stock-error-msg" class="hidden text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                ⚠️ Requested quantity exceeds available stock!
              </p>
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Calculated Subtotal</label>
              <div class="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 text-right">
                <span id="subtotal-display" class="text-lg font-bold text-indigo-700">$0.00</span>
              </div>
            </div>
          </div>

          <!-- Customer Info (Optional) -->
          <div class="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Customer / Client Name</label>
              <input type="text" id="input-customer-name" placeholder="Walk-in Customer" class="w-full border border-slate-300 rounded-md px-3 py-1.5 text-xs">
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Payment Method</label>
              <select id="input-payment-method" class="w-full border border-slate-300 rounded-md px-3 py-1.5 text-xs">
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="UPI / QR">UPI / Bank Transfer</option>
              </select>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="pt-4">
            <button type="submit" id="save-print-btn" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow transition flex items-center justify-center gap-2">
              <span>💾 Save & Print Invoice</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Live Printable Preview Panel (Col 5) -->
      <div class="lg:col-span-5">
        <div class="bg-white rounded-xl shadow-md border border-slate-200 p-6 printable-invoice">
          
          <!-- Invoice Header -->
          <div class="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
            <div>
              <h2 class="text-xl font-bold text-slate-900">TAX INVOICE</h2>
              <p class="text-xs text-slate-500 font-semibold mt-0.5">Store & Electronics Hub</p>
              <p class="text-xs text-slate-400">123 Tech Avenue, City Plaza</p>
            </div>
            <div class="text-right">
              <span id="inv-preview-id" class="text-sm font-bold text-indigo-600">INV-1001</span>
              <p id="inv-preview-date" class="text-xs text-slate-500 mt-1">Date: 2026-07-27</p>
            </div>
          </div>

          <!-- Bill To Section -->
          <div class="mb-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded">
            <span class="font-bold text-slate-700 block mb-0.5">Bill To:</span>
            <span id="inv-preview-customer" class="font-medium text-slate-800">Walk-in Customer</span>
            <span id="inv-preview-payment" class="float-right text-slate-500">Method: Cash</span>
          </div>

          <!-- Items Table -->
          <table class="w-full text-xs text-left mb-4">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th class="p-2">Item Description</th>
                <th class="p-2 text-center">Qty</th>
                <th class="p-2 text-right">Price</th>
                <th class="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody id="inv-table-body">
              <tr class="border-b border-slate-100">
                <td class="p-2">
                  <span id="preview-item-name" class="font-medium text-slate-800">Select product above</span>
                  <span id="preview-item-id" class="block text-[10px] text-slate-400">PRD-000</span>
                </td>
                <td id="preview-item-qty" class="p-2 text-center">1</td>
                <td id="preview-item-price" class="p-2 text-right">$0.00</td>
                <td id="preview-item-total" class="p-2 text-right font-bold text-slate-800">$0.00</td>
              </tr>
            </tbody>
          </table>

          <!-- Invoice Totals -->
          <div class="border-t border-slate-200 pt-3 space-y-1.5 text-xs text-slate-700">
            <div class="flex justify-between">
              <span>Subtotal:</span>
              <span id="preview-subtotal-val" class="font-semibold">$0.00</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>Tax (0%):</span>
              <span>$0.00</span>
            </div>
            <div class="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2 mt-2">
              <span>Grand Total:</span>
              <span id="preview-grandtotal-val" class="text-indigo-600">$0.00</span>
            </div>
          </div>

          <!-- Footer Note -->
          <div class="mt-8 pt-4 border-t border-dashed border-slate-200 text-center text-[11px] text-slate-400">
            <p>Thank you for your business!</p>
            <p class="mt-0.5">Software generated invoice via Google Sheets API</p>
          </div>

        </div>
      </div>

    </div>
  </main>

  <!-- Settings Modal for Web App URL -->
  <div id="config-modal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
      <h3 class="text-lg font-bold text-slate-900 mb-2">Google Apps Script Connection</h3>
      <p class="text-xs text-slate-500 mb-4">Paste your deployed Apps Script Web App URL to read and save data directly to your Google Sheet.</p>
      
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Web App Deployment URL</label>
          <input type="text" id="web-app-url-input" placeholder="https://script.google.com/macros/s/.../exec" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800">
        </div>
        <div id="modal-status-alert" class="hidden text-xs p-2.5 rounded-lg"></div>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <button onclick="toggleConfigModal()" class="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">Cancel</button>
        <button onclick="saveAppsScriptUrl()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700">Save & Connect</button>
      </div>
    </div>
  </div>

  <script>
    // Sample Products Data
    let products = [
      { id: 'PRD-101', name: 'Wireless Ergonomic Mouse', price: 29.99, stock: 45, description: '2.4GHz Wireless Mouse with Dual Side Buttons' },
      { id: 'PRD-102', name: 'Mechanical RGB Keyboard', price: 89.50, stock: 20, description: 'Tactile blue switches keyboard with customizable lighting' },
      { id: 'PRD-103', name: '27" 4K IPS Monitor', price: 349.00, stock: 12, description: 'Ultra-HD monitor with 99% sRGB color accuracy' },
      { id: 'PRD-104', name: 'Noise-Canceling Headphones', price: 159.99, stock: 18, description: 'Active noise canceling Bluetooth headphones' },
      { id: 'PRD-105', name: 'USB-C Multi-Port Hub', price: 45.00, stock: 60, description: '7-in-1 Hub with 4K HDMI & 100W PD' }
    ];

    let currentSelectedProduct = null;
    let appsScriptUrl = localStorage.getItem('apps_script_url') || '';

    document.addEventListener('DOMContentLoaded', () => {
      initProductDropdown();
      updateInvId();
      if (appsScriptUrl) {
        document.getElementById('web-app-url-input').value = appsScriptUrl;
        fetchProductsFromBackend();
      }
    });

    function initProductDropdown() {
      const select = document.getElementById('product-select');
      select.innerHTML = '<option value="">-- Choose a Product --</option>';
      products.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = \`\${p.name} (\$\${p.price.toFixed(2)}) - Stock: \${p.stock}\`;
        select.appendChild(opt);
      });
    }

    function onProductSelected() {
      const selectVal = document.getElementById('product-select').value;
      currentSelectedProduct = products.find(p => p.id === selectVal);

      if (currentSelectedProduct) {
        document.getElementById('auto-product-id').value = currentSelectedProduct.id;
        document.getElementById('auto-price').value = '$' + currentSelectedProduct.price.toFixed(2);
        
        const stockBadge = document.getElementById('auto-stock-badge');
        stockBadge.textContent = currentSelectedProduct.stock + ' left';
        if (currentSelectedProduct.stock < 5) {
          stockBadge.className = 'inline-block mt-0.5 text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700';
        } else {
          stockBadge.className = 'inline-block mt-0.5 text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700';
        }

        document.getElementById('auto-description').textContent = currentSelectedProduct.description || 'No description available.';
      } else {
        document.getElementById('auto-product-id').value = '--';
        document.getElementById('auto-price').value = '$0.00';
        document.getElementById('auto-stock-badge').textContent = '--';
        document.getElementById('auto-stock-badge').className = 'inline-block mt-0.5 text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700';
        document.getElementById('auto-description').textContent = 'Select a product above to preview details.';
      }

      calculateSubtotal();
    }

    function calculateSubtotal() {
      const qtyInput = document.getElementById('input-quantity');
      const qty = parseInt(qtyInput.value) || 0;
      const errorMsg = document.getElementById('stock-error-msg');
      const saveBtn = document.getElementById('save-print-btn');

      if (!currentSelectedProduct) {
        document.getElementById('subtotal-display').textContent = '$0.00';
        updateInvoicePreview(0, 0);
        return;
      }

      const subtotal = currentSelectedProduct.price * qty;
      document.getElementById('subtotal-display').textContent = '$' + subtotal.toFixed(2);

      // Validation
      if (qty > currentSelectedProduct.stock) {
        errorMsg.classList.remove('hidden');
        saveBtn.disabled = true;
        saveBtn.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        errorMsg.classList.add('hidden');
        saveBtn.disabled = false;
        saveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }

      updateInvoicePreview(qty, subtotal);
    }

    function updateInvoicePreview(qty, subtotal) {
      if (currentSelectedProduct) {
        document.getElementById('preview-item-name').textContent = currentSelectedProduct.name;
        document.getElementById('preview-item-id').textContent = currentSelectedProduct.id;
        document.getElementById('preview-item-qty').textContent = qty;
        document.getElementById('preview-item-price').textContent = '$' + currentSelectedProduct.price.toFixed(2);
        document.getElementById('preview-item-total').textContent = '$' + subtotal.toFixed(2);
        document.getElementById('preview-subtotal-val').textContent = '$' + subtotal.toFixed(2);
        document.getElementById('preview-grandtotal-val').textContent = '$' + subtotal.toFixed(2);
      } else {
        document.getElementById('preview-item-name').textContent = 'Select product above';
        document.getElementById('preview-item-id').textContent = 'PRD-000';
        document.getElementById('preview-item-qty').textContent = '0';
        document.getElementById('preview-item-price').textContent = '$0.00';
        document.getElementById('preview-item-total').textContent = '$0.00';
        document.getElementById('preview-subtotal-val').textContent = '$0.00';
        document.getElementById('preview-grandtotal-val').textContent = '$0.00';
      }

      const custName = document.getElementById('input-customer-name').value || 'Walk-in Customer';
      const payMethod = document.getElementById('input-payment-method').value;
      document.getElementById('inv-preview-customer').textContent = custName;
      document.getElementById('inv-preview-payment').textContent = 'Method: ' + payMethod;
    }

    async function handleSaveAndPrint(e) {
      e.preventDefault();
      if (!currentSelectedProduct) {
        alert('Please select a product first.');
        return;
      }

      const qty = parseInt(document.getElementById('input-quantity').value) || 1;
      if (qty > currentSelectedProduct.stock) {
        alert('Requested quantity exceeds current available stock.');
        return;
      }

      const invId = document.getElementById('display-inv-id').textContent;
      const totalAmount = currentSelectedProduct.price * qty;

      const invoiceData = {
        id: invId,
        date: new Date().toISOString().split('T')[0],
        productName: currentSelectedProduct.name,
        price: currentSelectedProduct.price,
        quantity: qty,
        totalAmount: totalAmount
      };

      // 1. Deduct Stock Locally
      currentSelectedProduct.stock -= qty;
      initProductDropdown();

      // 2. Post to Google Apps Script if connected
      if (appsScriptUrl) {
        try {
          await fetch(appsScriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'saveInvoice', invoice: invoiceData })
          });
        } catch (err) {
          console.error('Error saving to Google Sheets:', err);
        }
      }

      // 3. Trigger Print
      window.print();

      // 4. Reset & Advance Invoice ID
      updateInvId();
      document.getElementById('billing-form').reset();
      onProductSelected();
    }

    function updateInvId() {
      const nextId = 'INV-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('display-inv-id').textContent = nextId;
      document.getElementById('inv-preview-id').textContent = nextId;
      document.getElementById('inv-preview-date').textContent = 'Date: ' + new Date().toISOString().split('T')[0];
    }

    function toggleConfigModal() {
      document.getElementById('config-modal').classList.toggle('hidden');
    }

    function saveAppsScriptUrl() {
      const url = document.getElementById('web-app-url-input').value.trim();
      appsScriptUrl = url;
      localStorage.setItem('apps_script_url', url);
      
      const badge = document.getElementById('api-status-badge');
      if (url) {
        badge.className = 'px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-medium flex items-center gap-1.5';
        badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Google Sheets Active';
      } else {
        badge.className = 'px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-medium flex items-center gap-1.5';
        badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-400"></span> Demo Mode';
      }

      toggleConfigModal();
    }

    async function fetchProductsFromBackend() {
      if (!appsScriptUrl) return;
      try {
        const res = await fetch(appsScriptUrl + '?action=getProducts');
        const data = await res.json();
        if (data.status === 'success' && data.products && data.products.length > 0) {
          products = data.products;
          initProductDropdown();
        }
      } catch (err) {
        console.log('Unable to load Google Sheets products live, using local inventory.');
      }
    }
  </script>
</body>
</html>
`;
