import React, { useRef, useState } from 'react';
import { StrategyProfile } from '../../types/strategy';
import { useToast } from '../../context/ToastContext';
import { useModalA11y } from '../../hooks/useModalA11y';
import { Download, Copy, X, Check, ShieldCheck, FileText, Sparkles, Layers } from 'lucide-react';
import { TradeGateLogo } from '../common/TradeGateLogo';

interface ShareStrategyModalProps {
  strategy: StrategyProfile | null;
  onClose: () => void;
}

export const ShareStrategyModal: React.FC<ShareStrategyModalProps> = ({ strategy, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [hasCopiedMd, setHasCopiedMd] = useState(false);
  const toast = useToast();
  const modalRef = useModalA11y(!!strategy, onClose);

  if (!strategy) return null;

  const modeBadge =
    strategy.executionMode === 'futures'
      ? 'Crypto Futures (Perps)'
      : 'Crypto Spot & Holdings';

const mandatoryRules = strategy.rules.filter((r) => r.type === 'Mandatory');
const confluenceRules = strategy.rules.filter((r) => r.type === 'Confluence');

const handleCopyMarkdown = () => {
  let md = `# Strategy Playbook: ${strategy.name}\n\n`;
  md += `**Execution Mode:** ${modeBadge}\n`;
  md += `**Base Asset / Currency:** ${strategy.baseCurrency}\n`;
  md += `**Default Risk:** ${strategy.defaultRiskValue}% (${strategy.riskModel})\n`;
  md += `**Timeframes:** ${strategy.timeframes.join(', ')}\n`;
  md += `**Active Sessions:** ${strategy.sessions.join(', ')}\n\n`;

  md += `### Mandatory Discipline Gate Rules (Required for All Trades)\n`;
  mandatoryRules.forEach((r, idx) => {
    md += `${idx + 1}. [x] **${r.label}** ${r.category ? `*(${r.category})*` : ''}\n`;
  });

  md += `\n### Confluence Criteria\n`;
  confluenceRules.forEach((r, idx) => {
    md += `${idx + 1}. [ ] ${r.label} *(Weight: +${r.weight})*\n`;
  });

  md += `\n*Exported from TradeGate Crypto Institutional Journal*`;

  navigator.clipboard.writeText(md);
  setHasCopiedMd(true);
  toast.success('Markdown Copied', 'Strategy playbook formatted in Markdown.');
  setTimeout(() => setHasCopiedMd(false), 2500);
};

const handleCopyImage = async () => {
  if (!cardRef.current) return;
  setIsCopying(true);
  try {
    const { toBlob } = await import('html-to-image');
    const blob = await toBlob(cardRef.current, { quality: 0.95 });
    if (!blob) throw new Error('Blob creation failed');
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    toast.success('Playbook Image Copied', 'PNG copied to clipboard.');
  } catch (err: any) {
    toast.error('Copy Failed', err.message);
  } finally {
    setIsCopying(false);
  }
};

const handleDownloadPng = async () => {
  if (!cardRef.current) return;
  setIsDownloading(true);
  try {
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(cardRef.current, { quality: 0.95 });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Playbook_${strategy.name.replace(/\s+/g, '_')}.png`;
    a.click();
    toast.success('PNG Downloaded', 'Playbook image saved to disk.');
  } catch (err: any) {
    toast.error('Download Failed', err.message);
  } finally {
    setIsDownloading(false);
  }
};

const handleDownloadPdf = async () => {
  if (!cardRef.current) return;
  setIsPdfExporting(true);
  try {
    const [{ toPng }, { jsPDF }] = await Promise.all([
      import('html-to-image'),
      import('jspdf'),
    ]);
    const dataUrl = await toPng(cardRef.current, { quality: 0.95 });
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });
    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(dataUrl, 'PNG', 0, 20, pdfWidth, pdfHeight);
    pdf.save(`Playbook_${strategy.name.replace(/\s+/g, '_')}.pdf`);
    toast.success('PDF Exported', 'Playbook PDF document saved.');
  } catch (err: any) {
    toast.error('PDF Failed', err.message);
  } finally {
    setIsPdfExporting(false);
  }
};

return (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-modal-backdrop"
    onClick={onClose}
  >
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-strategy-modal-title"
      className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-modal-content"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        aria-label="Close strategy playbook modal"
        className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-card-hover transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <h3 id="share-strategy-modal-title" className="text-base font-bold text-text-primary mb-1 text-balance">Strategy Playbook</h3>
      <p className="text-xs text-text-secondary mb-5">Institutional Execution & Discipline Standard</p>

      {/* The Card Component */}
      <div
        ref={cardRef}
        className="bg-[#090A0F] border border-[#1F2430] rounded-2xl p-6 text-white shadow-2xl space-y-5"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1F2430]">
          <div className="flex items-center gap-2.5">
            <TradeGateLogo size="md" variant="mark-only" />
            <div>
              <span className="font-extrabold text-sm tracking-wide text-white">TRADEGATE</span>
              <span className="text-[11px] text-amber-400 font-mono ml-1 font-bold">CRYPTO PLAYBOOK</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/15 text-amber-400">
            {modeBadge}
          </span>
        </div>

        {/* Strategy Title & Stats */}
        <div>
          <h4 className="text-xl font-black text-white text-balance">{strategy.name}</h4>
          {strategy.description && (
            <p className="text-xs text-slate-400 mt-1 leading-relaxed text-pretty">{strategy.description}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-xs">
            <div className="bg-[#11131A] border border-[#1F2430] p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block uppercase">Base Currency</span>
              <span className="font-mono font-bold text-white mt-0.5 block">{strategy.baseCurrency}</span>
            </div>
            <div className="bg-[#11131A] border border-[#1F2430] p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block uppercase">Risk Model</span>
              <span className="font-mono font-bold tabular-nums text-white mt-0.5 block">
                {strategy.defaultRiskValue}% ({strategy.riskModel})
              </span>
            </div>
            <div className="bg-[#11131A] border border-[#1F2430] p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block uppercase">Timeframes</span>
              <span className="font-mono font-bold text-white mt-0.5 block">{strategy.timeframes.join(', ')}</span>
            </div>
            <div className="bg-[#11131A] border border-[#1F2430] p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 block uppercase">Sessions</span>
              <span className="font-mono font-bold text-white mt-0.5 block">{strategy.sessions.join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Mandatory Rules Section */}
        <div className="bg-[#11131A] border border-[#1F2430] rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">
              Mandatory Discipline Gate Rules
            </h5>
            <span className="text-[10px] text-rose-400 font-mono">(Must Pass All for Valid Entry)</span>
          </div>

          <div className="space-y-1.5 pt-1">
            {mandatoryRules.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-2 rounded-lg bg-[#181B24] border border-[#1F2430] text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded flex items-center justify-center bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span className="font-medium text-slate-200">{r.label}</span>
                </div>
                {r.category && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-slate-400">
                    {r.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Confluence Criteria Section */}
        {confluenceRules.length > 0 && (
          <div className="bg-[#11131A] border border-[#1F2430] rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                  Confluence Criteria
                </h5>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Grade A+: {strategy.minConfluenceForGradeA}+ pts • Grade A: {strategy.minConfluenceForGradeB}+ pts
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              {confluenceRules.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#181B24] border border-[#1F2430] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="font-medium text-slate-200">{r.label}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-400">
                    +{r.weight} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-[#1F2430] flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>TradeGate Institutional Playbook Standard</span>
          <span>app.tradegate.crypto</span>
        </div>
      </div>

      {/* Action Buttons Strip */}
      <div className="flex flex-wrap items-center justify-end gap-2.5 mt-5">
        <button
          type="button"
          onClick={handleCopyMarkdown}
          className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-card-hover border border-border text-text-primary hover:bg-card-hover/80 flex items-center gap-1.5 transition-colors"
        >
          {hasCopiedMd ? <Check className="w-3.5 h-3.5 text-trade-green" /> : <FileText className="w-3.5 h-3.5" />}
          {hasCopiedMd ? 'Copied MD!' : 'Copy Markdown'}
        </button>
        <button
          type="button"
          onClick={handleCopyImage}
          disabled={isCopying}
          className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-card-hover border border-border text-text-primary hover:bg-card-hover/80 flex items-center gap-1.5 transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          {isCopying ? 'Copying...' : 'Copy PNG'}
        </button>
        <button
          type="button"
          onClick={handleDownloadPng}
          disabled={isDownloading}
          className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-card-hover border border-border text-text-primary hover:bg-card-hover/80 flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          {isDownloading ? 'Saving...' : 'Download PNG'}
        </button>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isPdfExporting}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-brand text-black hover:bg-brand-hover flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          {isPdfExporting ? 'Generating...' : 'Download PDF'}
        </button>
      </div>
    </div>
  </div>
);
};

