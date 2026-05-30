import { useState } from 'react';
import SideNav from '../../components/layout/SideNav';
import TopBar from '../../components/layout/TopBar';
import PrimaryButton from '../../components/ui/PrimaryButton';
import BankAccountInput from '../../components/ui/BankAccountInput';
import { getClients, saveClient, deleteClient, type Client } from '../../services/clientService';
import { isValidNip, sanitizeNip } from '../../helpers/nip';
import { UserPlus, Users, Search, Pencil, Trash2, X, AlertCircle } from 'lucide-react';

interface ClientFormData {
    name: string;
    nip: string;
    address: string;
    bankAccount: string;
    email: string;
    phone: string;
}

const emptyForm: ClientFormData = { name: '', nip: '', address: '', bankAccount: '', email: '', phone: '' };

export default function ClientsView() {
    const [clients, setClients] = useState<Client[]>(() => getClients());
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState<ClientFormData>(emptyForm);
    const [errors, setErrors] = useState<string[]>([]);
    const [info, setInfo] = useState<string | null>(null);

    function loadClients() { setClients(getClients()); }

    const filteredClients = clients.filter(client => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            client.name.toLowerCase().includes(term) ||
            client.nip.includes(searchTerm) ||
            (client.address?.toLowerCase().includes(term) ?? false) ||
            (client.email?.toLowerCase().includes(term) ?? false)
        );
    });

    function showInfo(msg: string) {
        setInfo(msg);
        setTimeout(() => setInfo(null), 2000);
    }

    function openAddModal() {
        setEditingClient(null); setFormData(emptyForm); setErrors([]); setIsModalOpen(true);
    }

    function openEditModal(client: Client) {
        setEditingClient(client);
        setFormData({ name: client.name, nip: client.nip, address: client.address || '',
            bankAccount: client.bankAccount || '', email: client.email || '', phone: client.phone || '' });
        setErrors([]); setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false); setEditingClient(null); setFormData(emptyForm); setErrors([]);
    }

    function validateForm(): string[] {
        const errs: string[] = [];
        if (!formData.name.trim()) errs.push('Nazwa firmy jest wymagana.');
        if (!formData.nip.trim()) { errs.push('NIP jest wymagany.'); }
        else if (!isValidNip(sanitizeNip(formData.nip))) { errs.push('NIP jest nieprawidłowy (wymagane 10 cyfr + poprawna suma kontrolna).'); }
        if (!formData.address.trim()) errs.push('Adres jest wymagany.');
        if (formData.bankAccount) {
            const digits = formData.bankAccount.replace(/[^0-9]/g, '');
            if (digits.length > 0 && digits.length !== 26) errs.push('Numer konta bankowego musi mieć 26 cyfr.');
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.push('Nieprawidłowy format adresu email.');
        return errs;
    }

    function handleSave() {
        const validationErrors = validateForm();
        setErrors(validationErrors);
        if (validationErrors.length > 0) return;
        const clientData = { name: formData.name.trim(), nip: sanitizeNip(formData.nip),
            address: formData.address.trim(), bankAccount: formData.bankAccount || undefined,
            email: formData.email.trim() || undefined, phone: formData.phone.trim() || undefined };
        if (editingClient) { saveClient({ ...clientData, id: editingClient.id }); showInfo('Kontrahent został zaktualizowany.'); }
        else { saveClient(clientData); showInfo('Kontrahent został dodany.'); }
        loadClients(); closeModal();
    }

    function handleDelete(client: Client) {
        if (window.confirm(`Czy na pewno chcesz usunąć kontrahenta "${client.name}"?`)) {
            deleteClient(client.id); loadClients(); showInfo('Kontrahent został usunięty.');
        }
    }

    function updateField(field: keyof ClientFormData, value: string) {
        if (field === 'nip') setFormData(prev => ({ ...prev, nip: sanitizeNip(value) }));
        else setFormData(prev => ({ ...prev, [field]: value }));
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <SideNav />
            <main className="flex flex-1 flex-col overflow-hidden">
                <TopBar />
                <div className="flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-7xl space-y-6 p-8">
                        <header>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Kontrahenci</h1>
                            <p className="mt-1 text-sm text-muted-foreground">Zarządzaj listą kontrahentów (nabywców)</p>
                        </header>

                        {/* toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Szukaj po nazwie, NIP..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="ks-input pl-9 w-64"
                                />
                            </div>
                            <PrimaryButton onClick={openAddModal}>
                                <UserPlus className="h-4 w-4" />
                                Dodaj kontrahenta
                            </PrimaryButton>
                        </div>

                        {info && (
                            <div className="rounded-lg border border-accent/20 bg-accent/10 px-4 py-2.5 text-sm text-accent">
                                {info}
                            </div>
                        )}

                        {/* empty states */}
                        {clients.length === 0 ? (
                            <div className="ks-card flex flex-col items-center gap-4 py-16 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                                    <Users className="h-7 w-7 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Brak kontrahentów</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Dodaj pierwszego kontrahenta, aby móc go szybko wybierać podczas wystawiania faktur.
                                    </p>
                                </div>
                                <PrimaryButton onClick={openAddModal}>
                                    <UserPlus className="h-4 w-4" />
                                    Dodaj kontrahenta
                                </PrimaryButton>
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="ks-card flex flex-col items-center gap-3 py-12 text-center">
                                <Search className="h-8 w-8 text-muted-foreground/50" />
                                <div>
                                    <h3 className="font-semibold text-foreground">Brak wyników</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Nie znaleziono kontrahentów pasujących do „{searchTerm}"
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredClients.map((client) => (
                                    <div key={client.id} className="ks-card p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h3 className="truncate font-semibold text-foreground">{client.name}</h3>
                                                <p className="font-mono text-[12px] text-muted-foreground">NIP {client.nip}</p>
                                            </div>
                                            <div className="flex shrink-0 gap-1">
                                                <button
                                                    className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                                                    onClick={() => openEditModal(client)}
                                                    title="Edytuj"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => handleDelete(client)}
                                                    title="Usuń"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-2 space-y-0.5 text-[12px] text-muted-foreground">
                                            {client.address && <p className="truncate">{client.address}</p>}
                                            {client.bankAccount && <p className="font-mono truncate">{client.bankAccount}</p>}
                                            {client.email && <p className="truncate">{client.email}</p>}
                                            {client.phone && <p>{client.phone}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
                    onClick={closeModal}
                >
                    <div
                        className="ks-card w-full max-w-md shadow-[var(--shadow-elevated)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-border px-5 py-4">
                            <h2 className="text-sm font-semibold text-foreground">
                                {editingClient ? 'Edytuj kontrahenta' : 'Dodaj kontrahenta'}
                            </h2>
                            <button
                                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary"
                                onClick={closeModal}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto p-5 space-y-4">
                            {errors.length > 0 && (
                                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <ul className="space-y-0.5">
                                        {errors.map((err, i) => <li key={i}>{err}</li>)}
                                    </ul>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="ks-label" htmlFor="cl-name">Nazwa firmy *</label>
                                <input id="cl-name" type="text" className="ks-input" placeholder="Nazwa kontrahenta"
                                    value={formData.name} onChange={(e) => updateField('name', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="ks-label" htmlFor="cl-nip">NIP *</label>
                                <input id="cl-nip" type="text" className="ks-input font-mono" placeholder="0000000000"
                                    value={formData.nip} onChange={(e) => updateField('nip', e.target.value)}
                                    maxLength={10} inputMode="numeric" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="ks-label" htmlFor="cl-address">Adres *</label>
                                <input id="cl-address" type="text" className="ks-input" placeholder="Ulica, numer, kod pocztowy, miasto"
                                    value={formData.address} onChange={(e) => updateField('address', e.target.value)} />
                            </div>
                            <BankAccountInput
                                label="Rachunek bankowy"
                                value={formData.bankAccount}
                                onChange={(v) => updateField('bankAccount', v)}
                            />
                            <div className="space-y-1.5">
                                <label className="ks-label" htmlFor="cl-email">Email</label>
                                <input id="cl-email" type="email" className="ks-input" placeholder="kontakt@firma.pl"
                                    value={formData.email} onChange={(e) => updateField('email', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="ks-label" htmlFor="cl-phone">Telefon</label>
                                <input id="cl-phone" type="tel" className="ks-input" placeholder="+48 000 000 000"
                                    value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
                            <button
                                className="rounded-lg border border-border bg-card px-4 py-2 text-sm transition hover:bg-secondary"
                                onClick={closeModal}
                            >
                                Anuluj
                            </button>
                            <PrimaryButton onClick={handleSave}>
                                {editingClient ? 'Zapisz zmiany' : 'Dodaj kontrahenta'}
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
