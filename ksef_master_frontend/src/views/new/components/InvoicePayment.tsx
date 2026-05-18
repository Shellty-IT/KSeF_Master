// src/views/new/components/InvoicePayment.tsx
import NumberInput from '../../../components/ui/NumberInput';
import BankAccountInput from '../../../components/ui/BankAccountInput';
import type { InvoiceDraft } from '../types';

interface Props {
    payment: InvoiceDraft['payment'];
    onChange: (patch: Partial<InvoiceDraft['payment']>) => void;
}

export default function InvoicePayment({ payment, onChange }: Props) {
    return (
        <div className="card">
            <h3>Płatność</h3>
            <div className="field-row">
                <label>
                    Metoda płatności
                    <select
                        value={payment.method}
                        onChange={e => onChange({ method: e.target.value as 'przelew' | 'gotówka' })}
                    >
                        <option value="przelew">przelew</option>
                        <option value="gotówka">gotówka</option>
                    </select>
                </label>
                <label>
                    Termin (dni)
                    <NumberInput
                        value={payment.dueDays}
                        onChange={v => onChange({ dueDays: v ?? 0 })}
                        min={0}
                    />
                </label>
                <label>
                    Termin płatności
                    <input
                        type="date"
                        value={payment.dueDate}
                        onChange={e => onChange({ dueDate: e.target.value })}
                    />
                </label>
            </div>
            {payment.method === 'przelew' && (
                <div className="bank-account-section">
                    <BankAccountInput
                        label="Rachunek bankowy do płatności"
                        value={payment.bankAccount || ''}
                        onChange={v => onChange({ bankAccount: v })}
                        required
                    />
                </div>
            )}
        </div>
    );
}