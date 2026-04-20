// src/views/settings/tabs/TabDangerZone.tsx
import { useState, type ChangeEvent } from 'react';

export default function TabDangerZone() {
    const [info, setInfo] = useState<string | null>(null);

    function showInfo(msg: string) {
        setInfo(msg);
        setTimeout(() => setInfo(null), 2500);
    }

    function exportBackup() {
        const snapshot: Record<string, string | null> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            snapshot[key] = localStorage.getItem(key);
        }
        const blob = new Blob(
            [JSON.stringify(snapshot, null, 2)],
            { type: 'application/json' },
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ksef-master-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function importBackup(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        file.text().then((txt) => {
            let parsed: unknown;
            try {
                parsed = JSON.parse(txt);
            } catch {
                alert('Nieprawidłowy plik backupu.');
                e.target.value = '';
                return;
            }

            if (typeof parsed !== 'object' || parsed === null) {
                alert('Nieprawidłowy plik backupu.');
                e.target.value = '';
                return;
            }

            const obj = parsed as Record<string, unknown>;
            for (const [k, v] of Object.entries(obj)) {
                if (typeof v === 'string') {
                    localStorage.setItem(k, v);
                } else if (v === null) {
                    localStorage.removeItem(k);
                }
            }
            showInfo('Zaimportowano kopię ustawień. Odśwież stronę, aby zastosować zmiany.');
        });

        e.target.value = '';
    }

    function clearAll() {
        if (!confirm('Wyczyścić wszystkie dane aplikacji (localStorage)? Tej operacji nie można cofnąć.')) return;
        localStorage.clear();
        showInfo('Wyczyszczono dane. Odśwież stronę.');
    }

    return (
        <div>
            {info && <div className="info-banner">{info}</div>}

            <div className="card">
                <h3>💾 Kopia zapasowa ustawień</h3>
                <p className="hint" style={{ marginBottom: '16px' }}>
                    Eksportuj i importuj wszystkie ustawienia aplikacji przechowywane lokalnie
                    w przeglądarce. Kopia zawiera dane sprzedawcy, ustawienia faktur, alerty
                    i konfigurację druku.
                </p>

                <div style={{
                    padding: '14px',
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#93c5fd',
                    marginBottom: '16px',
                }}>
                    ℹ️ Kopia <strong>nie zawiera</strong> tokenów KSeF ani certyfikatów —
                    są one przechowywane bezpiecznie na serwerze.
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button className="btn-light" onClick={exportBackup}>
                        📥 Eksportuj kopię
                    </button>
                    <label className="btn-light file-btn">
                        📤 Importuj kopię
                        <input type="file" accept="application/json" onChange={importBackup} />
                    </label>
                </div>
            </div>

            <div className="card danger-zone">
                <h3>⚠️ Strefa ryzyka</h3>
                <p className="hint" style={{ marginBottom: '16px' }}>
                    Operacje poniżej są{' '}
                    <strong style={{ color: '#fca5a5' }}>nieodwracalne</strong>.
                    Wykonaj kopię zapasową przed czyszczeniem danych.
                </p>

                <div style={{
                    padding: '14px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#fca5a5',
                    marginBottom: '16px',
                }}>
                    🗑️ Wyczyszczenie danych usuwa wszystkie ustawienia lokalne, dane sprzedawcy,
                    zapisane faktury i konfigurację alertów.{' '}
                    <strong>Konto i dane KSeF pozostają nienaruszone.</strong>
                </div>

                <div className="danger-actions">
                    <button className="btn-danger" onClick={clearAll}>
                        🗑️ Wyczyść wszystkie dane lokalne
                    </button>
                </div>
            </div>
        </div>
    );
}