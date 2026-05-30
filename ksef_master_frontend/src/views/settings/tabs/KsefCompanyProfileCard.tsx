import type { UserInfo } from '../../../types/auth';
import { Pencil, Loader2, Save } from 'lucide-react';

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
        <div className="ks-card p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Dane firmy</h3>
                {!isEditing && (
                    <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] transition hover:bg-secondary"
                        onClick={() => setIsEditing(true)}>
                        <Pencil className="h-3.5 w-3.5" /> Edytuj
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <label className="ks-label" htmlFor="kcp-name">Nazwa firmy *</label>
                        <input id="kcp-name" type="text" className="ks-input" placeholder="Twoja Firma Sp. z o.o."
                            value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="ks-label" htmlFor="kcp-nip">NIP *</label>
                        <input id="kcp-nip" type="text" inputMode="numeric" className="ks-input font-mono"
                            placeholder="np. 5252161248"
                            value={nip} onChange={(e) => setNip(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                        <p className="text-[11px] text-muted-foreground">10-cyfrowy NIP firmy</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-cta)] transition hover:brightness-110 disabled:opacity-40"
                            onClick={onSave} disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Zapisywanie...</> : <><Save className="h-4 w-4" />Zapisz zmiany</>}
                        </button>
                        <button className="rounded-lg border border-border bg-card px-4 py-2 text-sm transition hover:bg-secondary"
                            onClick={onCancel}>Anuluj</button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-8">
                    <div>
                        <p className="ks-label mb-1">Nazwa firmy</p>
                        <p className="text-sm font-medium text-foreground">{user?.company?.companyName ?? '—'}</p>
                    </div>
                    <div>
                        <p className="ks-label mb-1">NIP</p>
                        <p className="font-mono text-sm font-medium text-foreground">{user?.company?.nip ?? '—'}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
