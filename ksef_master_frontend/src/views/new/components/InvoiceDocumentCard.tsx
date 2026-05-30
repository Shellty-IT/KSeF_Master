import type { InvoiceDraft } from '../types';

interface Props {
    draft: InvoiceDraft;
    onChange: (patch: Partial<InvoiceDraft>) => void;
}

export default function InvoiceDocumentCard({ draft, onChange }: Props) {
    return (
        <div className="ks-card p-5 space-y-4">
            <h3 className="border-b border-border pb-3 text-sm font-semibold text-foreground">Dokument</h3>
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <label className="ks-label" htmlFor="doc-type">Typ dokumentu</label>
                    <input id="doc-type" type="text" className="ks-input" value="Faktura sprzedaży" readOnly />
                </div>
                <div className="space-y-1.5">
                    <label className="ks-label" htmlFor="doc-number">Numer</label>
                    <input id="doc-number" type="text" className="ks-input"
                        value={draft.number} onChange={e => onChange({ number: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                    <label className="ks-label" htmlFor="doc-place">Miejsce wystawienia</label>
                    <input id="doc-place" type="text" className="ks-input"
                        value={draft.place} onChange={e => onChange({ place: e.target.value })} />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <label className="ks-label" htmlFor="doc-issue">Data wystawienia</label>
                    <input id="doc-issue" type="date" className="ks-input"
                        value={draft.issueDate} onChange={e => onChange({ issueDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                    <label className="ks-label" htmlFor="doc-sale">Data sprzedaży</label>
                    <input id="doc-sale" type="date" className="ks-input"
                        value={draft.sellDate} onChange={e => onChange({ sellDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                    <label className="ks-label" htmlFor="doc-currency">Waluta</label>
                    <select id="doc-currency" className="ks-input"
                        value={draft.currency} onChange={e => onChange({ currency: e.target.value as 'PLN' })}>
                        <option value="PLN">PLN</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
