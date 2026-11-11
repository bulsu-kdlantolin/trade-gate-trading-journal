import React, { useState } from 'react';
import { useModalA11y } from '../../hooks/useModalA11y';
import { playDangerAction, playModalClose } from '../../utils/audioTelemetry';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
  itemName?: string;
  confirmButtonText?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Trade Record?',
  description = 'Are you sure you want to permanently delete this trade record? This will remove it from your journal ledger and recalculate all cumulative statistics.',
  itemName,
  confirmButtonText = 'Delete Trade',
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const modalRef = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    playDangerAction();
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    playModalClose();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-modal-backdrop"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        className="w-full max-w-md bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-2xl relative animate-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          disabled={isDeleting}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-card-hover transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 id="confirm-delete-title" className="text-base font-bold text-text-primary text-balance">
              {title}
            </h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed text-pretty">
              {description}
            </p>
          </div>
        </div>

        {itemName && (
          <div className="p-3 bg-canvas border border-border rounded-xl flex items-center justify-between mb-4">
            <span className="text-xs text-text-muted">Target Entry</span>
            <span className="font-mono font-bold text-xs text-text-primary">{itemName}</span>
          </div>
        )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-card-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? 'Deleting...' : confirmButtonText}
            </button>
          </div>
        </div>
      </div>
      );
};
