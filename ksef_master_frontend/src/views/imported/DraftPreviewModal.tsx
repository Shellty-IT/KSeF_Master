// src/views/imported/DraftPreviewModal.tsx
import type { ExternalDraft } from '../../types/externalDraft';
import { formatDate, formatMoney } from './draftUtils';

interface Props {
    draft: ExternalDraft;
    onClose: () => void;
}

export default function DraftPreviewModal({ draft, onClose }: Props) {
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Podgląd szkicu: {draft.offerNumber}</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="preview-grid">
                        <div className="preview-section">
                            <h4>Sprzedawca</h4>
                            <p><strong>{draft.sellerName}</strong></p>
                            <p>NIP: {draft.sellerNip}</p>
                            <p>{draft.sellerAddress}</p>
                            <p>{draft.sellerPostalCode} {draft.sellerCity}</p>
                        </div>
                        <div className="preview-section">
                            <h4>Nabywca</h4>
                            <p><strong>{draft.buyerName}</strong></p>
                            <p>NIP: {draft.buyerNip}</p>
                            <p>{draft.buyerAddress}</p>
                            <p>{draft.buyerPostalCode} {draft.buyerCity}</p>
                        </div>
                    </div>
                    <div className="preview-dates">
                        <span>Data wystawienia: <strong>{formatDate(draft.issueDate)}</strong></span>
                        <span>Termin płatności: <strong>{formatDate(draft.dueDate)}</strong></span>
                    </div>
                    <h4>Pozycje ({draft.items.length})</h4>
                    <table className="preview-items-table">
                        <thead>
                            <tr>
                                <th>Nazwa</th>
                                <th>Ilość</th>
                                <th>Cena netto</th>
                                <th>VAT</th>
                                <th>Brutto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {draft.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.name}</td>
                                    <td>{item.quantity} {item.unit}</td>
                                    <td>{formatMoney(item.unitPrice, draft.currency)}</td>
                                    <td>{item.vatRate}%</td>
                                    <td>{formatMoney(item.totalGross, draft.currency)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="preview-totals">
                        <div className="total-row">
                            <span>Netto:</span>
                            <strong>{formatMoney(draft.totalNet, draft.currency)}</strong>
                        </div>
                        <div className="total-row">
                            <span>VAT:</span>
                            <strong>{formatMoney(draft.totalVat, draft.currency)}</strong>
                        </div>
                        <div className="total-row total-gross">
                            <span>Brutto:</span>
                            <strong>{formatMoney(draft.totalGross, draft.currency)}</strong>
                        </div>
                    </div>
                    {draft.status === 'REJECTED' && draft.rejectionReason && (
                        <div className="rejection-info">
                            <h4>Powód odrzucenia</h4>
                            <p>{draft.rejectionReason}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
