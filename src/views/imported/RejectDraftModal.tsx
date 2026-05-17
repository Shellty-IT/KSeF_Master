// src/views/imported/RejectDraftModal.tsx

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
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content reject-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Odrzuć szkic</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <label className="reject-label">
                        Podaj powód odrzucenia:
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="np. Brak poprawnego NIP nabywcy..."
                            rows={3}
                            className="reject-textarea"
                        />
                    </label>
                </div>
                <div className="modal-footer">
                    <button className="btn-light" onClick={onClose}>
                        Anuluj
                    </button>
                    <button
                        className="btn-danger"
                        onClick={onConfirm}
                        disabled={!rejectReason.trim() || isPending}
                    >
                        {isPending ? 'Odrzucanie...' : 'Odrzuć'}
                    </button>
                </div>
            </div>
        </div>
    );
}
