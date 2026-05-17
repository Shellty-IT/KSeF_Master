// src/components/features/clients/ContractorSelect.tsx
import { useEffect, useMemo, useState, useRef } from 'react';
import { getClients, type Client } from '../../../services/clientService';
import { isValidNip, sanitizeNip } from '../../../helpers/nip';
import BankAccountInput from '../../ui/BankAccountInput';
import './ContractorSelect.css';

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

    // Pobierz klientów z localStorage
    useEffect(() => {
        const loadClients = () => {
            const clients = getClients();
            setLocalClients(clients);
        };

        loadClients();

        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'appClients') {
                loadClients();
            }
        };

        window.addEventListener('storage', handleStorage);
        const interval = setInterval(loadClients, 2000);

        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(interval);
        };
    }, []);

    // Zamknij dropdown przy kliknięciu na zewnątrz
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filtruj lokalnych klientów
    const filteredClients = useMemo(() => {
        if (!searchTerm) return localClients;
        const term = searchTerm.toLowerCase();
        return localClients.filter(client =>
            client.name.toLowerCase().includes(term) ||
            client.nip.includes(searchTerm) ||
            (client.address?.toLowerCase().includes(term) ?? false)
        );
    }, [localClients, searchTerm]);

    // Walidacja NIP
    const nipValue = value?.nip || '';
    const sanitizedNip = sanitizeNip(nipValue);
    const nipValid = sanitizedNip.length === 0 || isValidNip(sanitizedNip);

    function selectLocalClient(client: Client) {
        onChange({
            nip: client.nip,
            name: client.name,
            address: client.address || '',
            bankAccount: client.bankAccount || '',
        });
        setShowDropdown(false);
        setSearchTerm('');
    }

    function handleFieldChange(field: keyof PartyValue, val: string) {
        if (field === 'nip') {
            onChange({ ...value, nip: sanitizeNip(val) });
        } else {
            onChange({ ...value, [field]: val });
        }
    }

    return (
        <div className={`contractor-select ${className || ''}`} ref={wrapperRef}>
            {label && <span className="contractor-label">{label}{required ? ' *' : ''}</span>}

            {/* Przycisk wyboru z listy kontrahentów */}
            {localClients.length > 0 && (
                <div className="client-selector">
                    <button
                        type="button"
                        className="btn-select-client"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <span className="btn-icon">📋</span>
                        <span>Wybierz z listy ({localClients.length})</span>
                        <span className="dropdown-arrow">{showDropdown ? '▲' : '▼'}</span>
                    </button>

                    {showDropdown && (
                        <div className="client-dropdown">
                            <div className="dropdown-search">
                                <input
                                    type="text"
                                    placeholder="Szukaj po nazwie lub NIP..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="dropdown-list">
                                {filteredClients.length === 0 ? (
                                    <div className="dropdown-empty">
                                        {searchTerm ? `Brak wyników dla "${searchTerm}"` : 'Brak zapisanych kontrahentów'}
                                    </div>
                                ) : (
                                    filteredClients.map((client) => (
                                        <button
                                            key={client.id}
                                            type="button"
                                            className="dropdown-item"
                                            onClick={() => selectLocalClient(client)}
                                        >
                                            <div className="item-name">{client.name}</div>
                                            <div className="item-details">
                                                <span className="item-nip">NIP: {client.nip}</span>
                                                {client.address && (
                                                    <span className="item-address">{client.address}</span>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>

                            <div className="dropdown-footer">
                                <a href="/clients" className="add-client-link">
                                    + Zarządzaj kontrahentami
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {localClients.length === 0 && (
                <div className="no-clients-hint">
                    <span>Brak zapisanych kontrahentów. </span>
                    <a href="/clients">Dodaj pierwszego kontrahenta →</a>
                </div>
            )}

            {localClients.length > 0 && (
                <div className="divider">
                    <span>lub wprowadź ręcznie</span>
                </div>
            )}

            {/* Pola formularza */}
            <div className="contractor-fields">
                <label className="field">
                    <span className="label small">NIP *</span>
                    <input
                        className={`input ${nipValue && !nipValid ? 'input--error' : ''}`}
                        value={nipValue}
                        onChange={(e) => handleFieldChange('nip', e.target.value)}
                        placeholder={placeholderNip}
                        inputMode="numeric"
                        maxLength={10}
                    />
                    {nipValue && !nipValid && (
                        <div className="field-error">Nieprawidłowy NIP (wymagane 10 cyfr)</div>
                    )}
                </label>

                <label className="field">
                    <span className="label small">Nazwa *</span>
                    <input
                        className="input"
                        value={value?.name || ''}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        placeholder="Nazwa kontrahenta"
                    />
                </label>

                <label className="field">
                    <span className="label small">Adres *</span>
                    <input
                        className="input"
                        value={value?.address || ''}
                        onChange={(e) => handleFieldChange('address', e.target.value)}
                        placeholder="Ulica, nr, kod pocztowy, miejscowość"
                    />
                </label>

                <BankAccountInput
                    label="Rachunek bankowy (opcjonalnie)"
                    value={value?.bankAccount || ''}
                    onChange={(v) => handleFieldChange('bankAccount', v)}
                />
            </div>
        </div>
    );
}
