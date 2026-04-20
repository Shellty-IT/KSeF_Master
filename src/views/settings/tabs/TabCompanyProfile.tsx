// src/views/settings/tabs/TabCompanyProfile.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import BankAccountInput from '../../../components/form/BankAccountInput';
import KsefSetupModal from '../../../components/modal/KsefSetupModal';
import { getSeller, saveSeller, type SellerProfile } from '../../../services/settings';

export default function TabCompanyProfile() {
    const { user, needsCompanySetup } = useAuth();

    const [seller, setSeller] = useState<SellerProfile>(getSeller());
    const [info, setInfo] = useState<string | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [showSetupModal, setShowSetupModal] = useState(false);

    useEffect(() => {
        setSeller(getSeller());
    }, []);

    function showInfo(msg: string) {
        setInfo(msg);
        setTimeout(() => setInfo(null), 1800);
    }

    function validate(): string[] {
        const errs: string[] = [];
        if (!seller.name.trim()) errs.push('Nazwa firmy jest wymagana.');
        if (!seller.address.trim()) errs.push('Adres jest wymagany.');
        if (seller.bankAccount) {
            const digits = seller.bankAccount.replace(/[^0-9]/g, '');
            if (digits.length > 0 && digits.length !== 26) {
                errs.push('Numer konta bankowego musi mieć 26 cyfr.');
            }
        }
        return errs;
    }

    function handleSave() {
        const errs = validate();
        setErrors(errs);
        if (errs.length) return;
        saveSeller(seller);
        showInfo('Dane firmy zostały zapisane.');
    }

    return (
        <div>
            {info && <div className="info-banner">{info}</div>}

            {errors.length > 0 && (
                <div className="error-message" style={{ marginBottom: 12 }}>
                    <strong>Popraw błędy:</strong>
                    <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
            )}

            <div className="card">
                <h3>🏢 Dane rejestrowe firmy</h3>

                {user?.company ? (
                    <div style={{
                        display: 'flex',
                        gap: '24px',
                        flexWrap: 'wrap',
                        padding: '14px',
                        background: 'rgba(34, 211, 238, 0.05)',
                        border: '1px solid rgba(34, 211, 238, 0.15)',
                        borderRadius: '8px',
                        marginBottom: '20px',
                    }}>
                        <div>
                            <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Nazwa w KSeF
                            </span>
                            <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 600, marginTop: '4px' }}>
                                {user.company.companyName}
                            </div>
                        </div>
                        <div>
                            <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                NIP
                            </span>
                            <div style={{
                                fontSize: '14px',
                                color: 'var(--text)',
                                fontWeight: 600,
                                marginTop: '4px',
                                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                            }}>
                                {user.company.nip}
                            </div>
                        </div>
                    </div>
                ) : needsCompanySetup ? (
                    <div style={{ marginBottom: '20px' }}>
                        <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '0 0 12px' }}>
                            Firma nie jest jeszcze skonfigurowana w systemie KSeF.
                        </p>
                        <button
                            className="btn-light"
                            onClick={() => setShowSetupModal(true)}
                            style={{ background: 'var(--accent)', color: '#001018', border: 'none', fontWeight: 700 }}
                        >
                            🏢 Skonfiguruj firmę
                        </button>
                    </div>
                ) : null}

                <p className="hint" style={{ marginBottom: '16px' }}>
                    💡 Poniższe dane sprzedawcy są używane na fakturach. NIP i nazwa firmy pobierane są z konfiguracji KSeF — zmień je w zakładce <strong>Połączenie KSeF</strong>.
                </p>

                <label>Nazwa firmy (na fakturach) *
                    <input
                        type="text"
                        value={seller.name}
                        onChange={(e) => setSeller((s) => ({ ...s, name: e.target.value }))}
                        placeholder="Nazwa Twojej firmy"
                    />
                </label>

                <label>Adres *
                    <input
                        type="text"
                        value={seller.address}
                        onChange={(e) => setSeller((s) => ({ ...s, address: e.target.value }))}
                        placeholder="Ulica, numer, kod pocztowy, miasto"
                    />
                </label>

                <div style={{ marginTop: '12px' }}>
                    <BankAccountInput
                        label="Rachunek bankowy"
                        value={seller.bankAccount || ''}
                        onChange={(v) => setSeller((s) => ({ ...s, bankAccount: v }))}
                    />
                    <p className="hint" style={{ marginTop: '6px', fontSize: '12px' }}>
                        Ten numer będzie domyślnie używany na fakturach jako rachunek do płatności.
                    </p>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <PrimaryButton onClick={handleSave} icon="💾">Zapisz dane firmy</PrimaryButton>
                </div>
            </div>

            {showSetupModal && (
                <KsefSetupModal
                    mode="setup"
                    onClose={() => setShowSetupModal(false)}
                    onSuccess={() => setShowSetupModal(false)}
                />
            )}
        </div>
    );
}