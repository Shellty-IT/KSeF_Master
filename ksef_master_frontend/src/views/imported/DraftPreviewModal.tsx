import type { ExternalDraft } from '../../types/externalDraft';
import { formatDate, formatMoney } from './draftUtils';
import { X } from 'lucide-react';

interface Props {
    draft: ExternalDraft;
    onClose: () => void;
}

export default function DraftPreviewModal({ draft, onClose }: Props) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="ks-card w-full max-w-2xl shadow-[var(--shadow-elevated)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <h3 className="text-sm font-semibold text-foreground">Podgląd szkicu: {draft.offerNumber}</h3>
                    <button
                        className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="max-h-[75vh] overflow-y-auto p-5 space-y-5">
                    {/* Seller / Buyer */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg border border-border bg-muted/30 p-3.5">
                            <p className="ks-label mb-2">Sprzedawca</p>
                            <p className="font-semibold text-foreground">{draft.sellerName}</p>
                            <p className="font-mono text-[12px] text-muted-foreground">NIP {draft.sellerNip}</p>
                            <p className="text-sm text-muted-foreground">{draft.sellerAddress}</p>
                            <p className="text-sm text-muted-foreground">{draft.sellerPostalCode} {draft.sellerCity}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/30 p-3.5">
                            <p className="ks-label mb-2">Nabywca</p>
                            <p className="font-semibold text-foreground">{draft.buyerName}</p>
                            <p className="font-mono text-[12px] text-muted-foreground">NIP {draft.buyerNip}</p>
                            <p className="text-sm text-muted-foreground">{draft.buyerAddress}</p>
                            <p className="text-sm text-muted-foreground">{draft.buyerPostalCode} {draft.buyerCity}</p>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="flex gap-6 text-sm">
                        <span className="text-muted-foreground">Data wystawienia: <strong className="text-foreground">{formatDate(draft.issueDate)}</strong></span>
                        <span className="text-muted-foreground">Termin płatności: <strong className="text-foreground">{formatDate(draft.dueDate)}</strong></span>
                    </div>

                    {/* Items */}
                    <div>
                        <p className="ks-label mb-2">Pozycje ({draft.items.length})</p>
                        <div className="ks-card overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40">
                                        {['Nazwa', 'Ilość', 'Cena netto', 'VAT', 'Brutto'].map((h) => (
                                            <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {draft.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-muted/30">
                                            <td className="px-4 py-2.5">{item.name}</td>
                                            <td className="px-4 py-2.5">{item.quantity} {item.unit}</td>
                                            <td className="px-4 py-2.5">{formatMoney(item.unitPrice, draft.currency)}</td>
                                            <td className="px-4 py-2.5">{item.vatRate}%</td>
                                            <td className="px-4 py-2.5 font-medium">{formatMoney(item.totalGross, draft.currency)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="ml-auto w-48 space-y-1.5 text-sm">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span>Netto:</span>
                            <span>{formatMoney(draft.totalNet, draft.currency)}</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span>VAT:</span>
                            <span>{formatMoney(draft.totalVat, draft.currency)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-border pt-1.5 font-semibold text-foreground">
                            <span>Brutto:</span>
                            <span>{formatMoney(draft.totalGross, draft.currency)}</span>
                        </div>
                    </div>

                    {/* Rejection reason */}
                    {draft.status === 'REJECTED' && draft.rejectionReason && (
                        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3.5">
                            <p className="ks-label mb-1 text-destructive">Powód odrzucenia</p>
                            <p className="text-sm text-destructive">{draft.rejectionReason}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
