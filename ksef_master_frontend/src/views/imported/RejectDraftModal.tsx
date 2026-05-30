import { X, Loader2 } from 'lucide-react';

interface Props {
    rejectReason: string;
    setRejectReason: (v: string) => void;
    onConfirm: () => void;
    onClose: () => void;
    isPending: boolean;
}

export default function RejectDraftModal({
    rejectReason, setRejectReason, onConfirm, onClose, isPending,
}: Props) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="ks-card w-full max-w-sm shadow-[var(--shadow-elevated)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <h3 className="text-sm font-semibold text-foreground">Odrzuć szkic</h3>
                    <button
                        className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-5 space-y-3">
                    <label className="ks-label" htmlFor="reject-reason">Podaj powód odrzucenia</label>
                    <textarea
                        id="reject-reason"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="np. Brak poprawnego NIP nabywcy..."
                        rows={3}
                        className="w-full rounded-md border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition resize-none"
                    />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
                    <button
                        className="rounded-lg border border-border bg-card px-4 py-2 text-sm transition hover:bg-secondary"
                        onClick={onClose}
                    >
                        Anuluj
                    </button>
                    <button
                        className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={onConfirm}
                        disabled={!rejectReason.trim() || isPending}
                    >
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isPending ? 'Odrzucanie...' : 'Odrzuć'}
                    </button>
                </div>
            </div>
        </div>
    );
}
