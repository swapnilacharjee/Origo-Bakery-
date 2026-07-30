import React from 'react';
import { BookOpen, CheckCircle, Copy, ArrowRight, ExternalLink, Database, Key } from 'lucide-react';

export const SetupGuide: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Title */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-8 rounded-3xl shadow-xl border border-indigo-800/50">
        <div className="flex items-center space-x-3 text-indigo-300 mb-2">
          <BookOpen className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-widest">Setup Tutorial</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          How to Connect Google Sheets & Deploy Backend
        </h2>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl">
          Follow these 4 simple steps to connect your own Google Spreadsheet as the database and deploy Google Apps Script as the free REST API.
        </p>
      </div>

      {/* STEP 1 */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
            1
          </span>
          <h3 className="text-lg font-bold text-slate-900">Create & Format Your Google Sheet</h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed pl-11">
          Open <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline inline-flex items-center gap-1">sheets.new <ExternalLink className="w-3 h-3" /></a> and create two tabs with these exact sheet names and column headers:
        </p>

        <div className="pl-11 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* Sheet 1 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              Sheet 1 Name: <span className="text-indigo-600">"Products"</span>
            </div>
            <ul className="space-y-1 text-slate-600">
              <li>• Column A: <strong className="text-slate-900">Product ID</strong></li>
              <li>• Column B: <strong className="text-slate-900">Type</strong></li>
              <li>• Column C: <strong className="text-slate-900">Product Name</strong></li>
              <li>• Column D: <strong className="text-slate-900">Price</strong></li>
              <li>• Column E: <strong className="text-slate-900">Stock Quantity</strong></li>
              <li>• Column F: <strong className="text-slate-900">Description</strong></li>
            </ul>
          </div>

          {/* Sheet 2 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              Sheet 2 Name: <span className="text-emerald-600">"Invoices"</span>
            </div>
            <ul className="space-y-1 text-slate-600">
              <li>• Column A: <strong className="text-slate-900">Invoice ID</strong></li>
              <li>• Column B: <strong className="text-slate-900">Date</strong></li>
              <li>• Column C: <strong className="text-slate-900">Product Name</strong></li>
              <li>• Column D: <strong className="text-slate-900">Price</strong></li>
              <li>• Column E: <strong className="text-slate-900">Quantity</strong></li>
              <li>• Column F: <strong className="text-slate-900">Total Amount</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {/* STEP 2 */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
            2
          </span>
          <h3 className="text-lg font-bold text-slate-900">Paste Code.gs into Apps Script</h3>
        </div>

        <ol className="list-decimal list-inside text-xs text-slate-600 space-y-2 pl-11 leading-relaxed">
          <li>Inside your Google Sheet, click on the top menu: <strong className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded">Extensions</strong> → <strong className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded">Apps Script</strong>.</li>
          <li>Delete any existing code in <code className="text-indigo-600 font-mono font-bold">Code.gs</code>.</li>
          <li>Copy the entire script from the <strong className="text-indigo-600">Code.gs tab</strong> in this application and paste it into Apps Script editor.</li>
          <li>Click the <strong className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded">💾 Save</strong> icon (or press Ctrl + S / Cmd + S).</li>
        </ol>
      </div>

      {/* STEP 3 */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
            3
          </span>
          <h3 className="text-lg font-bold text-slate-900">Deploy as Web App</h3>
        </div>

        <ol className="list-decimal list-inside text-xs text-slate-600 space-y-2 pl-11 leading-relaxed">
          <li>Click top right blue button: <strong className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded">Deploy</strong> → <strong className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded">New deployment</strong>.</li>
          <li>Click the gear icon ⚙️ next to "Select type" and choose <strong className="text-indigo-600">Web app</strong>.</li>
          <li>Set <strong className="text-slate-900">Execute as:</strong> <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">Me (your account)</span>.</li>
          <li>Set <strong className="text-slate-900">Who has access:</strong> <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">Anyone</span> (crucial so the web app can call `doGet` and `doPost`).</li>
          <li>Click <strong className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded">Deploy</strong> and authorize permissions if prompted.</li>
          <li>Copy the generated <strong className="text-indigo-600 font-mono">Web App URL</strong> (looks like <code className="text-slate-800">https://script.google.com/macros/s/.../exec</code>).</li>
        </ol>
      </div>

      {/* STEP 4 */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
            4
          </span>
          <h3 className="text-lg font-bold text-slate-900">Connect Web App URL to App</h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed pl-11">
          Click the <strong className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded">⚙️ Settings</strong> button in the top right header of this app, paste your Web App URL, and click <strong className="text-indigo-600 font-bold">Save & Connect</strong>.
          The app will instantly fetch products from your Google Sheet and save every new invoice directly to Sheet 2 while automatically updating stock in Sheet 1!
        </p>
      </div>

    </div>
  );
};
