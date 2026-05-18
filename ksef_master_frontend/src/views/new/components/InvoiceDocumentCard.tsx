// src/views/new/components/InvoiceDocumentCard.tsx
import type { InvoiceDraft } from '../types';

interface Props {
    draft: InvoiceDraft;
    onChange: (patch: Partial<InvoiceDraft>) => void;
}

export default function InvoiceDocumentCard({ draft, onChange }: Props) {
    return (
        <div className="card">
            <div className="field-row">
                <label>
                    Typ dokumentu
                    <input type="text" value="Faktura sprzedaży" readOnly />
                </label>
                <label>
                    Numer
                    <input
                        type="text"
                        value={draft.number}
                        onChange={e => onChange({ number: e.target.value })}
                    />
                </label>
                <label>
                    Miejsce wystawienia
                    <input
                        type="text"
                        value={draft.place}
                        onChange={e => onChange({ place: e.target.value })}
                    />
                </label>
            </div>
            <div className="field-row">
                <label>
                    Data wystawienia
                    <input
                        type="date"
                        value={draft.issueDate}
                        onChange={e => onChange({ issueDate: e.target.value })}
                    />
                </label>
                <label>
                    Data sprzedaży
                    <input
                        type="date"
                        value={draft.sellDate}
                        onChange={e => onChange({ sellDate: e.target.value })}
                    />
                </label>
                <label>
                    Waluta
                    <select
                        value={draft.currency}
                        onChange={e => onChange({ currency: e.target.value as 'PLN' })}
                    >
                        <option value="PLN">PLN</option>
                    </select>
                </label>
            </div>
        </div>
    );
}