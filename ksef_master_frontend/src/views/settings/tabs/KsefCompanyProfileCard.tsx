// src/views/settings/tabs/KsefCompanyProfileCard.tsx
import type { UserInfo } from '../../../types/auth';

interface Props {
    user: UserInfo | null;
    companyName: string;
    setCompanyName: (v: string) => void;
    nip: string;
    setNip: (v: string) => void;
    isEditing: boolean;
    setIsEditing: (v: boolean) => void;
    isSubmitting: boolean;
    onSave: () => Promise<void>;
    onCancel: () => void;
}

export default function KsefCompanyProfileCard({
    user, companyName, setCompanyName, nip, setNip,
    isEditing, setIsEditing, isSubmitting, onSave, onCancel,
}: Props) {
    return (
        <div className="card">
            <div className={`ksef-card-header${isEditing ? ' ksef-card-header--editing' : ''}`}>
                <h3 className="ksef-card-title">🏢 Dane firmy</h3>
                {!isEditing && (
                    <button className="btn-light" onClick={() => setIsEditing(true)}>
                        ✏️ Edytuj
                    </button>
                )}
            </div>

            {isEditing ? (
                <>
                    <label className="ksef-edit-label">Nazwa firmy *
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Twoja Firma Sp. z o.o."
                        />
                    </label>
                    <label>NIP *
                        <input
                            type="text"
                            inputMode="numeric"
                            value={nip}
                            onChange={(e) => setNip(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="np. 5252161248"
                            className="input-mono"
                        />
                        <span className="input-hint">10-cyfrowy NIP firmy</span>
                    </label>
                    <div className="ksef-action-row">
                        <button
                            className="btn-light btn-save"
                            onClick={onSave}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? '⏳ Zapisywanie...' : '💾 Zapisz zmiany'}
                        </button>
                        <button className="btn-light" onClick={onCancel}>Anuluj</button>
                    </div>
                </>
            ) : (
                <div className="ksef-meta-row">
                    <div>
                        <span className="ksef-meta-label">Nazwa firmy</span>
                        <div className="ksef-meta-value">{user?.company?.companyName ?? '—'}</div>
                    </div>
                    <div>
                        <span className="ksef-meta-label">NIP</span>
                        <div className="ksef-meta-value ksef-meta-value--mono">{user?.company?.nip ?? '—'}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
