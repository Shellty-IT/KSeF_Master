import { useState, type ChangeEvent } from 'react';
import { Download, Upload, Trash2, AlertTriangle, Info } from 'lucide-react';

export default function TabDangerZone() {
    const [info, setInfo] = useState<string | null>(null);

    function showInfo(msg: string) { setInfo(msg); setTimeout(() => setInfo(null), 2500); }

    function exportBackup() {
        const snapshot: Record<string, string | null> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            snapshot[key] = localStorage.getItem(key);
        }
        const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
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
            try { parsed = JSON.parse(txt); } catch { alert('Nieprawidłowy plik backupu.'); e.target.value = ''; return; }
            if (typeof parsed !== 'object' || parsed === null) { alert('Nieprawidłowy plik backupu.'); e.target.value = ''; return; }
            const obj = parsed as Record<string, unknown>;
            for (const [k, v] of Object.entries(obj)) {
                if (typeof v === 'string') localStorage.setItem(k, v);
                else if (v === null) localStorage.removeItem(k);
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
        <div className="space-y-4">
            {info && <div className="rounded-lg border border-accent/20 bg-accent/10 px-4 py-2.5 text-sm text-accent">{info}</div>}

            <div className="ks-card p-5 space-y-4">
                <h3 className="ks-card-title">Kopia zapasowa ustawień</h3>
                <p className="text-[12px] text-muted-foreground">Eksportuj i importuj wszystkie ustawienia aplikacji przechowywane lokalnie w przeglądarce. Kopia zawiera dane sprzedawcy, ustawienia faktur, alerty i konfigurację druku.</p>

                <div className="flex items-start gap-2.5 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-[12px] text-primary">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Kopia <strong>nie zawiera</strong> tokenów KSeF ani certyfikatów — są one przechowywane bezpiecznie na serwerze.</span>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm transition hover:bg-secondary"
                        onClick={exportBackup}>
                        <Download className="h-4 w-4" /> Eksportuj kopię
                    </button>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm transition hover:bg-secondary">
                        <Upload className="h-4 w-4" /> Importuj kopię
                        <input type="file" accept="application/json" onChange={importBackup} className="sr-only" />
                    </label>
                </div>
            </div>

            <div className="ks-card border-destructive/20 p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <h3 className="ks-card-title">Strefa ryzyka</h3>
                </div>
                <p className="text-[12px] text-muted-foreground">
                    Operacje poniżej są <strong className="text-destructive">nieodwracalne</strong>. Wykonaj kopię zapasową przed czyszczeniem danych.
                </p>
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-[12px] text-destructive">
                    <Trash2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Wyczyszczenie danych usuwa wszystkie ustawienia lokalne, dane sprzedawcy, zapisane faktury i konfigurację alertów. <strong>Konto i dane KSeF pozostają nienaruszone.</strong></span>
                </div>
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition hover:brightness-110"
                    onClick={clearAll}>
                    <Trash2 className="h-4 w-4" /> Wyczyść wszystkie dane lokalne
                </button>
            </div>
        </div>
    );
}
