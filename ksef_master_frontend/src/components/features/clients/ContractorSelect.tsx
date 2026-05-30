import { useEffect, useMemo, useState, useRef } from 'react';
import { getClients, type Client } from '../../../services/clientService';
import { isValidNip, sanitizeNip } from '../../../helpers/nip';
import BankAccountInput from '../../ui/BankAccountInput';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';

export type PartyValue = {
    nip: string;
    name: string;
    address: string;
    bankAccount?: string;
};

interface Props {
    label?: string;
    value: PartyValue;
    onChange: (v: PartyValue) => void;
    placeholderNip?: string;
    className?: string;
    required?: boolean;
}

export default function ContractorSelect({
    label,
    value,
    onChange,
    placeholderNip = '0000000000',
    className,
    required,
}: Props) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [localClients, setLocalClients] = useState<Client[]>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadClients = () => setLocalClients(getClients());
        loadClients();
        const handleStorage = (e: StorageEvent) => { if (e.key === 'appClients') loadClients(); };
        window.addEventListener('storage', handleStorage);
        const interval = setInterval(loadClients, 2000);
        return () => { window.removeEventListener('storage', handleStorage); clearInterval(interval); };
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredClients = useMemo(() => {
        if (!searchTerm) return localClients;
        const term = searchTerm.toLowerCase();
        return localClients.filter(c =>
            c.name.toLowerCase().includes(term) || c.nip.includes(searchTerm) ||
            (c.address?.toLowerCase().includes(term) ?? false)
        );
    }, [localClients, searchTerm]);

    const nipValue = value?.nip || '';
    const sanitizedNip = sanitizeNip(nipValue);
    const nipValid = sanitizedNip.length === 0 || isValidNip(sanitizedNip);

    function selectLocalClient(client: Client) {
        onChange({ nip: client.nip, name: client.name, address: client.address || '', bankAccount: client.bankAccount || '' });
        setShowDropdown(false); setSearchTerm('');
    }

    function handleFieldChange(field: keyof PartyValue, val: string) {
        if (field === 'nip') onChange({ ...value, nip: sanitizeNip(val) });
        else onChange({ ...value, [field]: val });
    }

    return (
        <div className={`space-y-3 ${className || ''}`} ref={wrapperRef}>
            {label && <p className="ks-label">{label}{required ? ' *' : ''}</p>}

            {localClients.length > 0 && (
                <div className="relative">
                    <button type="button"
                        className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition hover:bg-secondary"
                        onClick={() => setShowDropdown(!showDropdown)}>
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 text-left text-muted-foreground">Wybierz z listy ({localClients.length})</span>
                        {showDropdown ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>

                    {showDropdown && (
                        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-border bg-card shadow-[var(--shadow-elevated)]">
                            <div className="p-2 border-b border-border">
                                <input type="text" placeholder="Szukaj po nazwie lub NIP..."
                                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                    className="ks-input-sm" autoFocus />
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                {filteredClients.length === 0 ? (
                                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                                        {searchTerm ? `Brak wyników dla "${searchTerm}"` : 'Brak zapisanych kontrahentów'}
                                    </div>
                                ) : (
                                    filteredClients.map((client) => (
                                        <button key={client.id} type="button"
                                            className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition hover:bg-muted/40"
                                            onClick={() => selectLocalClient(client)}>
                                            <span className="text-sm font-medium text-foreground">{client.name}</span>
                                            <span className="font-mono text-[11px] text-muted-foreground">NIP {client.nip}{client.address ? ` · ${client.address}` : ''}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                            <div className="border-t border-border px-3 py-2">
                                <a href="/clients" className="text-[12px] text-accent hover:underline">+ Zarządzaj kontrahentami</a>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {localClients.length === 0 && (
                <p className="text-[12px] text-muted-foreground">
                    Brak zapisanych kontrahentów.{' '}
                    <a href="/clients" className="text-accent hover:underline">Dodaj pierwszego kontrahenta →</a>
                </p>
            )}

            {localClients.length > 0 && (
                <div className="relative flex items-center gap-3 text-[11px] text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    <span>lub wprowadź ręcznie</span>
                    <div className="h-px flex-1 bg-border" />
                </div>
            )}

            <div className="space-y-3">
                <div className="space-y-1.5">
                    <label className="ks-label" htmlFor="cs-nip">NIP *</label>
                    <input id="cs-nip" type="text" inputMode="numeric" maxLength={10}
                        className={`ks-input font-mono ${nipValue && !nipValid ? 'border-destructive focus:ring-destructive/40' : ''}`}
                        value={nipValue} onChange={(e) => handleFieldChange('nip', e.target.value)}
                        placeholder={placeholderNip} />
                    {nipValue && !nipValid && <p className="text-[12px] text-destructive">Nieprawidłowy NIP (wymagane 10 cyfr)</p>}
                </div>
                <div className="space-y-1.5">
                    <label className="ks-label" htmlFor="cs-name">Nazwa *</label>
                    <input id="cs-name" type="text" className="ks-input" placeholder="Nazwa kontrahenta"
                        value={value?.name || ''} onChange={(e) => handleFieldChange('name', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <label className="ks-label" htmlFor="cs-address">Adres *</label>
                    <input id="cs-address" type="text" className="ks-input" placeholder="Ulica, nr, kod pocztowy, miejscowość"
                        value={value?.address || ''} onChange={(e) => handleFieldChange('address', e.target.value)} />
                </div>
                <BankAccountInput label="Rachunek bankowy (opcjonalnie)" value={value?.bankAccount || ''}
                    onChange={(v) => handleFieldChange('bankAccount', v)} />
            </div>
        </div>
    );
}
