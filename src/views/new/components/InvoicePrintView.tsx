// src/views/new/components/InvoicePrintView.tsx
import { formatPLN } from '../../../helpers/money';
import { calcLine } from '../../../helpers/vat';
import type { InvoiceDraft, InvoiceTotals } from '../types';

interface Props {
    draft: InvoiceDraft;
    totals: InvoiceTotals;
}

export default function InvoicePrintView({ draft, totals }: Props) {
    const { perRate } = totals;

    return (
        <section className="print-only">
            <div className="print-invoice">
                <div className="print-content">
                    <div className="print-header">
                        <div className="print-header-left">
                            <h2>Krajowy System e-Faktur</h2>
                            <div className="ksef-label">KSeF</div>
                        </div>
                        <div className="print-header-right">
                            <div className="invoice-number-label">Numer faktury</div>
                            <div className="invoice-number">{draft.number}</div>
                            <div className="invoice-type">Faktura VAT</div>
                        </div>
                    </div>

                    <hr className="print-hr" />

                    <div className="print-parties">
                        <div className="print-party">
                            <h3>Sprzedawca</h3>
                            <p>NIP: {draft.seller.nip}</p>
                            <p>Nazwa: {draft.seller.name}</p>
                            <p className="label">Adres</p>
                            <p>{draft.seller.address}</p>
                            <p>Polska</p>
                        </div>
                        <div className="print-party">
                            <h3>Nabywca</h3>
                            <p>NIP: {draft.buyer.nip}</p>
                            <p>Nazwa: {draft.buyer.name}</p>
                            <p className="label">Adres</p>
                            <p>{draft.buyer.address}</p>
                            <p>Polska</p>
                        </div>
                    </div>

                    <hr className="print-hr" />

                    <div className="print-details">
                        <h3>Szczegóły</h3>
                        <div className="print-details-row">
                            <span><span className="label">Data wystawienia: </span>{draft.issueDate}</span>
                            <span><span className="label">Miejsce wystawienia: </span>{draft.place}</span>
                        </div>
                        <div className="print-details-row">
                            <span><span className="label">Data sprzedaży: </span>{draft.sellDate}</span>
                        </div>
                    </div>

                    <hr className="print-hr" />

                    <div className="print-items">
                        <h3>Pozycje</h3>
                        <p className="subtitle">Faktura wystawiona w cenach netto w walucie PLN</p>
                        <table className="print-table">
                            <thead>
                            <tr>
                                <th>Lp.</th>
                                <th>Nazwa towaru lub usługi</th>
                                <th className="text-right">Cena netto</th>
                                <th className="text-right">Ilość</th>
                                <th>J.m.</th>
                                <th>Stawka</th>
                                <th className="text-right">Wartość netto</th>
                            </tr>
                            </thead>
                            <tbody>
                            {draft.lines.map((l, i) => {
                                const r = calcLine({
                                    qty: l.qty,
                                    priceNet: l.priceNet,
                                    discount: l.discount || 0,
                                    vatRate: l.vatRate,
                                });
                                return (
                                    <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td>{l.name}</td>
                                        <td className="text-right">{formatPLN(l.priceNet)}</td>
                                        <td className="text-right">{l.qty}</td>
                                        <td>{l.unit}</td>
                                        <td>{typeof l.vatRate === 'number' ? `${l.vatRate}%` : l.vatRate}</td>
                                        <td className="text-right">{formatPLN(r.net)}</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>

                    <div className="print-total">
                        Kwota należności ogółem: {formatPLN(totals.gross)} PLN
                    </div>

                    <hr className="print-hr" />

                    <div className="print-vat-summary">
                        <h3>Podsumowanie stawek podatku</h3>
                        <table className="print-vat-table">
                            <thead>
                            <tr>
                                <th>Lp.</th>
                                <th>Stawka podatku</th>
                                <th className="text-right">Kwota netto</th>
                                <th className="text-right">Kwota podatku</th>
                                <th className="text-right">Kwota brutto</th>
                            </tr>
                            </thead>
                            <tbody>
                            {Object.keys(perRate).map((rate, i) => (
                                <tr key={rate}>
                                    <td>{i + 1}</td>
                                    <td>{rate}</td>
                                    <td className="text-right">{formatPLN(perRate[rate].net)}</td>
                                    <td className="text-right">{formatPLN(perRate[rate].vat)}</td>
                                    <td className="text-right">{formatPLN(perRate[rate].gross)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <hr className="print-hr" />

                    <div className="print-payment">
                        <h3>Płatność</h3>
                        <div className="print-payment-row">
                            <span><span className="label">Metoda płatności: </span>{draft.payment.method}</span>
                            <span><span className="label">Termin płatności: </span>{draft.payment.dueDate}</span>
                        </div>
                        {draft.payment.bankAccount && (
                            <p><span className="label">Rachunek bankowy: </span>{draft.payment.bankAccount}</p>
                        )}
                    </div>
                </div>

                <div className="print-footer">
                    <p>Wytworzona w <a href="https://ksef-master.netlify.app/"><strong>KSeF Master</strong></a></p>
                    <p className="note">To jest podgląd faktury. Po wysłaniu do KSeF dokument otrzyma oficjalny numer i kod QR.</p>
                </div>
            </div>
        </section>
    );
}