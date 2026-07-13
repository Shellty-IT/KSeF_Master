import NumberInput from '../../../components/ui/NumberInput';
import CurrencyInput from '../../../components/ui/CurrencyInput';
import VatSelect from '../../../components/ui/VatSelect';
import { formatPLN } from '../../../helpers/money';
import { calcLine } from '../../../helpers/vat';
import type { InvoiceLineDraft, InvoiceTotals } from '../types';
import { X, Plus } from 'lucide-react';

interface Props {
    lines: InvoiceLineDraft[];
    totals: InvoiceTotals;
    onUpdateLine: (index: number, patch: Partial<InvoiceLineDraft>) => void;
    onAddLine: () => void;
    onRemoveLine: (index: number) => void;
}

export default function InvoiceLinesTable({ lines, totals, onUpdateLine, onAddLine, onRemoveLine }: Props) {
    return (
        <div className="ks-card overflow-hidden">
            <div className="border-b border-border px-5 py-3">
                <h3 className="text-sm font-semibold text-foreground">Pozycje faktury</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/40">
                            {[
                                { label: 'Nazwa towaru/usługi', w: '22%' },
                                { label: 'PKWiU', w: '7%' },
                                { label: 'Ilość', w: '6%' },
                                { label: 'J.m.', w: '5%' },
                                { label: 'Cena netto', w: '9%' },
                                { label: 'VAT', w: '7%' },
                                { label: 'Rabat %', w: '7%' },
                                { label: 'Netto', w: '9%', right: true },
                                { label: 'VAT', w: '8%', right: true },
                                { label: 'Brutto', w: '9%', right: true },
                                { label: '', w: '4%' },
                            ].map(({ label, right }) => (
                                <th key={label} className={`px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${right ? 'text-right' : 'text-left'}`}>
                                    {label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {lines.map((l, idx) => {
                            const res = calcLine({ qty: l.qty, priceNet: l.priceNet, discount: l.discount || 0, vatRate: l.vatRate });
                            return (
                                <tr key={idx} className="hover:bg-muted/20">
                                    <td className="px-2 py-1.5">
                                        <input type="text" className="ks-input-sm" value={l.name}
                                            onChange={e => onUpdateLine(idx, { name: e.target.value })}
                                            placeholder="Nazwa towaru/usługi" />
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <input type="text" className="ks-input-sm" value={l.pkwiu || ''}
                                            onChange={e => onUpdateLine(idx, { pkwiu: e.target.value })}
                                            placeholder="opcjonalnie" />
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <NumberInput value={l.qty} onChange={v => onUpdateLine(idx, { qty: v ?? 0 })} min={0} compact />
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <input type="text" className="ks-input-sm" value={l.unit}
                                            onChange={e => onUpdateLine(idx, { unit: e.target.value })} />
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <CurrencyInput value={l.priceNet} onChange={v => onUpdateLine(idx, { priceNet: v ?? 0 })} compact />
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <VatSelect value={l.vatRate} onChange={v => onUpdateLine(idx, { vatRate: v })} compact />
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <NumberInput value={l.discount || 0} onChange={v => onUpdateLine(idx, { discount: v })} min={0} max={100} compact />
                                    </td>
                                    <td className="px-2 py-1.5 text-right font-medium">{formatPLN(res.net)}</td>
                                    <td className="px-2 py-1.5 text-right text-muted-foreground">{formatPLN(res.vat)}</td>
                                    <td className="px-2 py-1.5 text-right font-medium">{formatPLN(res.gross)}</td>
                                    <td className="px-2 py-1.5 text-center">
                                        <button
                                            className="rounded-md p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => onRemoveLine(idx)} title="Usuń pozycję">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between border-t border-border px-5 py-3">
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm transition hover:bg-secondary"
                    onClick={onAddLine}>
                    <Plus className="h-4 w-4" /> Dodaj pozycję
                </button>
                <div className="flex items-center gap-6 text-sm">
                    <span className="text-muted-foreground">Netto: <strong className="text-foreground">{formatPLN(totals.net)}</strong></span>
                    <span className="text-muted-foreground">VAT: <strong className="text-foreground">{formatPLN(totals.vat)}</strong></span>
                    <span className="font-semibold text-foreground">Brutto: {formatPLN(totals.gross)}</span>
                </div>
            </div>
        </div>
    );
}
