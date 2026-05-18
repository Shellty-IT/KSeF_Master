// src/views/new/components/InvoiceLinesTable.tsx
import NumberInput from '../../../components/ui/NumberInput';
import CurrencyInput from '../../../components/ui/CurrencyInput';
import VatSelect from '../../../components/ui/VatSelect';
import { formatPLN } from '../../../helpers/money';
import { calcLine } from '../../../helpers/vat';
import type { InvoiceLineDraft, InvoiceTotals } from '../types';

interface Props {
    lines: InvoiceLineDraft[];
    totals: InvoiceTotals;
    onUpdateLine: (index: number, patch: Partial<InvoiceLineDraft>) => void;
    onAddLine: () => void;
    onRemoveLine: (index: number) => void;
}

export default function InvoiceLinesTable({ lines, totals, onUpdateLine, onAddLine, onRemoveLine }: Props) {
    return (
        <div className="card">
            <h3>Pozycje faktury</h3>
            <div className="table-wrap">
                <table className="invoice-lines-table">
                    <thead>
                    <tr>
                        <th style={{ width: '25%' }}>Nazwa towaru/usługi</th>
                        <th style={{ width: '8%' }}>PKWiU</th>
                        <th style={{ width: '6%' }}>Ilość</th>
                        <th style={{ width: '6%' }}>J.m.</th>
                        <th style={{ width: '10%' }}>Cena netto</th>
                        <th style={{ width: '8%' }}>VAT</th>
                        <th style={{ width: '7%' }}>Rabat %</th>
                        <th className="text-right" style={{ width: '10%' }}>Netto</th>
                        <th className="text-right" style={{ width: '10%' }}>VAT</th>
                        <th className="text-right" style={{ width: '10%' }}>Brutto</th>
                        <th style={{ width: '5%' }}></th>
                    </tr>
                    </thead>
                    <tbody>
                    {lines.map((l, idx) => {
                        const res = calcLine({
                            qty: l.qty,
                            priceNet: l.priceNet,
                            discount: l.discount || 0,
                            vatRate: l.vatRate,
                        });
                        return (
                            <tr key={idx}>
                                <td>
                                    <input
                                        type="text"
                                        value={l.name}
                                        onChange={e => onUpdateLine(idx, { name: e.target.value })}
                                        placeholder="Nazwa towaru/usługi"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={l.pkwiu || ''}
                                        onChange={e => onUpdateLine(idx, { pkwiu: e.target.value })}
                                        placeholder="opcjonalnie"
                                    />
                                </td>
                                <td>
                                    <NumberInput
                                        value={l.qty}
                                        onChange={v => onUpdateLine(idx, { qty: v ?? 0 })}
                                        min={0}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={l.unit}
                                        onChange={e => onUpdateLine(idx, { unit: e.target.value })}
                                    />
                                </td>
                                <td>
                                    <CurrencyInput
                                        value={l.priceNet}
                                        onChange={v => onUpdateLine(idx, { priceNet: v ?? 0 })}
                                    />
                                </td>
                                <td>
                                    <VatSelect
                                        value={l.vatRate}
                                        onChange={v => onUpdateLine(idx, { vatRate: v })}
                                    />
                                </td>
                                <td>
                                    <NumberInput
                                        value={l.discount || 0}
                                        onChange={v => onUpdateLine(idx, { discount: v })}
                                        min={0}
                                    />
                                </td>
                                <td className="text-right">{formatPLN(res.net)}</td>
                                <td className="text-right">{formatPLN(res.vat)}</td>
                                <td className="text-right">{formatPLN(res.gross)}</td>
                                <td>
                                    <button
                                        className="btn-light small danger"
                                        onClick={() => onRemoveLine(idx)}
                                        title="Usuń pozycję"
                                    >
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                    <tfoot>
                    <tr>
                        <td colSpan={11}>
                            <button className="btn-light" onClick={onAddLine}>
                                + Dodaj pozycję
                            </button>
                        </td>
                    </tr>
                    </tfoot>
                </table>
            </div>

            <div className="summary-bar">
                <span>Netto: <strong>{formatPLN(totals.net)}</strong></span>
                <span>VAT: <strong>{formatPLN(totals.vat)}</strong></span>
                <span>Brutto: <strong>{formatPLN(totals.gross)}</strong></span>
            </div>
        </div>
    );
}