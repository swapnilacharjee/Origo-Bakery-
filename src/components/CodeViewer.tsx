import React, { useState } from 'react';
import { CODE_GS, STANDALONE_INDEX_HTML } from '../data/codeSnippets';
import { Code, Copy, Check, FileText, Globe, Download } from 'lucide-react';

interface CodeViewerProps {
  initialTab?: 'codegs' | 'indexhtml';
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ initialTab = 'codegs' }) => {
  const [tab, setTab] = useState<'codegs' | 'indexhtml'>(initialTab);
  const [copiedGs, setCopiedGs] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const handleCopyGs = () => {
    navigator.clipboard.writeText(CODE_GS);
    setCopiedGs(true);
    setTimeout(() => setCopiedGs(false), 2000);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(STANDALONE_INDEX_HTML);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([STANDALONE_INDEX_HTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Code Header Controls */}
      <div className="bg-slate-900 text-white p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-indigo-400 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Source Code Artifacts</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete, ready-to-deploy Google Apps Script (`Code.gs`) and standalone frontend (`Index.html`).
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-xl border border-slate-700 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setTab('codegs')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              tab === 'codegs'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>1. Code.gs</span>
          </button>

          <button
            onClick={() => setTab('indexhtml')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              tab === 'indexhtml'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>2. Index.html</span>
          </button>
        </div>
      </div>

      {/* CODE.GS DISPLAY */}
      {tab === 'codegs' && (
        <div className="bg-slate-950 text-slate-200 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-300">
              <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span>
              <span>Code.gs</span>
              <span className="text-[10px] text-slate-500 font-normal">(Google Apps Script Backend)</span>
            </div>

            <button
              onClick={handleCopyGs}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 shadow-md"
            >
              {copiedGs ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Code.gs</span>
                </>
              )}
            </button>
          </div>

          <div className="p-6 overflow-x-auto max-h-[600px] overflow-y-auto font-mono text-xs text-indigo-200 leading-relaxed">
            <pre><code>{CODE_GS}</code></pre>
          </div>
        </div>
      )}

      {/* INDEX.HTML DISPLAY */}
      {tab === 'indexhtml' && (
        <div className="bg-slate-950 text-slate-200 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-300">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span>Index.html</span>
              <span className="text-[10px] text-slate-500 font-normal">(HTML + Tailwind CSS + JS Embedded)</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadHtml}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center space-x-1 border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>

              <button
                onClick={handleCopyHtml}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 shadow-md"
              >
                {copiedHtml ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Index.html</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-6 overflow-x-auto max-h-[600px] overflow-y-auto font-mono text-xs text-emerald-300 leading-relaxed">
            <pre><code>{STANDALONE_INDEX_HTML}</code></pre>
          </div>
        </div>
      )}

    </div>
  );
};
