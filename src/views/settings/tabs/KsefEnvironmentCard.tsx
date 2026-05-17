// src/views/settings/tabs/KsefEnvironmentCard.tsx

interface Props {
    ksefEnvironment: string;
    selectedEnvironment: 'Test' | 'Production';
    setSelectedEnvironment: (v: 'Test' | 'Production') => void;
    isEditing: boolean;
    setIsEditing: (v: boolean) => void;
    isSubmitting: boolean;
    onSave: () => Promise<void>;
    onCancel: () => void;
}

function EnvironmentBadge({ env }: { env: string }) {
    if (env === 'Production') {
        return <span className="env-badge env-badge--production">🔴 PRODUKCJA</span>;
    }
    return <span className="env-badge env-badge--test">🟡 TEST</span>;
}

export default function KsefEnvironmentCard({
    ksefEnvironment, selectedEnvironment, setSelectedEnvironment,
    isEditing, setIsEditing, isSubmitting, onSave, onCancel,
}: Props) {
    return (
        <div className="card">
            <div className="ksef-card-header">
                <h3 className="ksef-card-title">
                    ⚙️ Środowisko KSeF
                    <EnvironmentBadge env={ksefEnvironment} />
                </h3>
                {!isEditing && (
                    <button className="btn-light" onClick={() => setIsEditing(true)}>
                        ✏️ Zmień
                    </button>
                )}
            </div>

            {isEditing ? (
                <>
                    <div className="auth-method-selector ksef-env-selector">
                        <label className="auth-method-option">
                            <input
                                type="radio"
                                name="environment"
                                value="Test"
                                checked={selectedEnvironment === 'Test'}
                                onChange={() => setSelectedEnvironment('Test')}
                            />
                            <div className="auth-method-content">
                                <div className="auth-method-icon">🟡</div>
                                <div className="auth-method-text">
                                    <div className="auth-method-title">Środowisko testowe</div>
                                    <div className="auth-method-description">Dane fikcyjne, brak skutków prawnych</div>
                                </div>
                            </div>
                        </label>

                        <label className="auth-method-option">
                            <input
                                type="radio"
                                name="environment"
                                value="Production"
                                checked={selectedEnvironment === 'Production'}
                                onChange={() => setSelectedEnvironment('Production')}
                            />
                            <div className="auth-method-content">
                                <div className="auth-method-icon">🔴</div>
                                <div className="auth-method-text">
                                    <div className="auth-method-title">Środowisko produkcyjne</div>
                                    <div className="auth-method-description auth-method-description--danger">
                                        <strong>Faktury o pełnej mocy prawnej</strong>
                                    </div>
                                </div>
                            </div>
                        </label>
                    </div>

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
                <p className="hint ksef-env-description">
                    {ksefEnvironment === 'Production'
                        ? '🔴 Połączenie z systemem produkcyjnym. Wszystkie faktury mają pełną moc prawną.'
                        : '🟡 Połączenie z systemem testowym. Dane są fikcyjne i służą wyłącznie celom rozwojowym.'}
                </p>
            )}
        </div>
    );
}
