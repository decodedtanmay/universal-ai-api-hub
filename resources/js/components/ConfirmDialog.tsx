import { AlertTriangle } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';

type Props = {
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    processing?: boolean;
    processingLabel?: string;
    onConfirm: () => void;
    onClose: () => void;
};

export function ConfirmDialog({ open, title, description, confirmLabel, processing = false, processingLabel = 'Deleting…', onConfirm, onClose }: Props) {
    const dialog = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const element = dialog.current;
        if (!element) return;
        if (open && !element.open) element.showModal();
        if (!open && element.open) element.close();
    }, [open]);

    return <dialog ref={dialog} className="dialog" aria-labelledby={titleId} onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <div className="dialog-body">
            <span className="dialog-icon"><AlertTriangle size={19} /></span>
            <div><h2 id={titleId}>{title}</h2><p>{description}</p></div>
        </div>
        <div className="dialog-actions">
            <button type="button" className="button button-secondary" onClick={onClose} autoFocus>Cancel</button>
            <button type="button" className="button button-danger" onClick={onConfirm} disabled={processing}>{processing ? processingLabel : confirmLabel}</button>
        </div>
    </dialog>;
}
