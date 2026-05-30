import { Pencil, Loader2, Save } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';

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

export default function KsefEnvironmentCard({
    ksefEnvironment, selectedEnvironment, setSelectedEnvironment,
    isEditing, setIsEditing, isSubmitting, onSave, onCancel,
}: Props) {
    return (
        <div className="ks-card p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">Środowisko KSeF</h3>
                    <Badge variant={ksefEnvironment === 'Production' ? 'danger' : 'warning'} dot>
                        {ksefEnvironment === 'Production' ? 'PRODUKCJA' : 'TEST'}
                    </Badge>
                </div>
                {!isEditing && (
                    <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] transition hover:bg-secondary"
                        onClick={() => setIsEditing(true)}>
                        <Pencil className="h-3.5 w-3.5" /> Zmień
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-3">
                    {(['Test', 'Production'] as const).map((env) => (
                        <label key={env}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${selectedEnvironment === env ? 'border-accent bg-accent/5' : 'border-border hover:bg-muted/40'}`}>
                            <input type="radio" name="environment" value={env}
                                checked={selectedEnvironment === env}
                                onChange={() => setSelectedEnvironment(env)}
                                className="sr-only" />
                            <div className={`h-2.5 w-2.5 rounded-full ${env === 'Production' ? 'bg-destructive' : 'bg-warning'}`} />
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    {env === 'Test' ? 'Środowisko testowe' : 'Środowisko produkcyjne'}
                                </p>
                                <p className={`text-[12px] ${env === 'Production' ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}>
                                    {env === 'Test' ? 'Dane fikcyjne, brak skutków prawnych' : 'Faktury o pełnej mocy prawnej'}
                                </p>
                            </div>
                        </label>
                    ))}
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
                <p className="text-sm text-muted-foreground">
                    {ksefEnvironment === 'Production'
                        ? 'Połączenie z systemem produkcyjnym. Wszystkie faktury mają pełną moc prawną.'
                        : 'Połączenie z systemem testowym. Dane są fikcyjne i służą wyłącznie celom rozwojowym.'}
                </p>
            )}
        </div>
    );
}
