import ContractorSelect, { type PartyValue } from '../../../components/features/clients/ContractorSelect';
import type { InvoiceDraft } from '../types';

interface Props {
    draft: InvoiceDraft;
    onSellerChange: (patch: Partial<InvoiceDraft['seller']>) => void;
    onBuyerChange: (value: PartyValue) => void;
}

export default function InvoiceParties({ draft, onSellerChange, onBuyerChange }: Props) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="ks-card p-5 space-y-4">
                <h3 className="border-b border-border pb-3 text-sm font-semibold text-foreground">Sprzedawca</h3>
                <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
                    <span className="ks-label">NIP (z sesji KSeF)</span>
                    <span className="font-mono text-sm font-medium text-foreground ml-auto">
                        {draft.seller.nip || 'Zaloguj się do KSeF'}
                    </span>
                </div>
                <div className="space-y-1.5">
                    <label className="ks-label" htmlFor="seller-name">Nazwa firmy *</label>
                    <input id="seller-name" type="text" className="ks-input" placeholder="Nazwa sprzedawcy"
                        value={draft.seller.name} onChange={e => onSellerChange({ name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                    <label className="ks-label" htmlFor="seller-address">Adres *</label>
                    <input id="seller-address" type="text" className="ks-input" placeholder="Ulica, numer, kod pocztowy, miasto"
                        value={draft.seller.address} onChange={e => onSellerChange({ address: e.target.value })} />
                </div>
            </div>

            <div className="ks-card p-5 space-y-4">
                <h3 className="border-b border-border pb-3 text-sm font-semibold text-foreground">Nabywca</h3>
                <ContractorSelect value={draft.buyer} onChange={onBuyerChange} />
            </div>
        </div>
    );
}
