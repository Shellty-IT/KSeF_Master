// src/views/new/components/InvoiceParties.tsx
import ContractorSelect, { type PartyValue } from '../../../components/features/clients/ContractorSelect';
import type { InvoiceDraft } from '../types';

interface Props {
    draft: InvoiceDraft;
    onSellerChange: (patch: Partial<InvoiceDraft['seller']>) => void;
    onBuyerChange: (value: PartyValue) => void;
}

export default function InvoiceParties({ draft, onSellerChange, onBuyerChange }: Props) {
    return (
        <div className="two-col">
            <div className="card">
                <h3>Sprzedawca</h3>
                <div className="seller-nip-box">
                    <span className="seller-nip-label">NIP Sprzedawcy (z sesji KSeF)</span>
                    <span className="seller-nip-value">
                        {draft.seller.nip || 'Zaloguj się do KSeF'}
                    </span>
                </div>
                <label>
                    Nazwa firmy *
                    <input
                        type="text"
                        value={draft.seller.name}
                        onChange={e => onSellerChange({ name: e.target.value })}
                        placeholder="Nazwa sprzedawcy"
                    />
                </label>
                <label>
                    Adres *
                    <input
                        type="text"
                        value={draft.seller.address}
                        onChange={e => onSellerChange({ address: e.target.value })}
                        placeholder="Ulica, numer, kod pocztowy, miasto"
                    />
                </label>
            </div>

            <div className="card">
                <h3>Nabywca</h3>
                <ContractorSelect value={draft.buyer} onChange={onBuyerChange} />
            </div>
        </div>
    );
}