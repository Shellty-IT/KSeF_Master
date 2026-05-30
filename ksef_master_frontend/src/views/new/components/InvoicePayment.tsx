import NumberInput from '../../../components/ui/NumberInput';
import BankAccountInput from '../../../components/ui/BankAccountInput';
import type { InvoiceDraft } from '../types';

interface Props {
    payment: InvoiceDraft['payment'];
    onChange: (patch: Partial<InvoiceDraft['payment']>) => void;
}

export default function InvoicePayment({ payment, onChange }: Props) {
    return (
        <div className="ks-card p-5 space-y-4">
            <h3 className="border-b border-border pb-3 text-sm font-semibold text-foreground">Płatność</h3>
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <label className="ks-label" htmlFor="pay-method">Metoda płatności</label>
                    <select id="pay-method" className="ks-input"
                        value={payment.method}
                        onChange={e => onChange({ method: e.target.value as 'przelew' | 'gotówka' })}>
                        <option value="przelew">Przelew bankowy</option>
                        <option value="gotówka">Gotówka</option>
                    </select>
                </div>
                <NumberInput label="Termin (dni)" value={payment.dueDays}
                    onChange={v => onChange({ dueDays: v ?? 0 })} min={0} />
                <div className="space-y-1.5">
                    <label className="ks-label" htmlFor="pay-due">Termin płatności</label>
                    <input id="pay-due" type="date" className="ks-input"
                        value={payment.dueDate}
                        onChange={e => onChange({ dueDate: e.target.value })} />
                </div>
            </div>
            {payment.method === 'przelew' && (
                <BankAccountInput label="Rachunek bankowy do płatności"
                    value={payment.bankAccount || ''}
                    onChange={v => onChange({ bankAccount: v })} required />
            )}
        </div>
    );
}
