import { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const SECTIONS = [
    {
        heading: '§1. Administrator danych osobowych',
        body: 'Administratorem Twoich danych osobowych jest Shellty IT Tomasz Skorupski, os. Bursztynowe 78/78, 72-005 Warzymice, NIP: 8513307050, e-mail: shellty@zohomail.eu.',
    },
    {
        heading: '§2. Zakres przetwarzanych danych',
        body: 'Przetwarzamy następujące dane:\n• Dane konta – adres e-mail i imię podane przy rejestracji\n• Dane firmy – nazwa, NIP, REGON, adres siedziby podane w profilu\n• Dane faktur – treść faktur wystawionych i odebranych przez Ciebie za pośrednictwem systemu KSeF, w tym dane kontrahentów, kwoty i numery referencyjne\n• Dane uwierzytelniające KSeF – tokeny i certyfikaty autoryzacyjne do systemu Ministerstwa Finansów (przechowywane wyłącznie po stronie serwera, zaszyfrowane)\n• Dane techniczne – adresy IP, daty logowania, logi aktywności',
    },
    {
        heading: '§3. Cel i podstawa prawna przetwarzania',
        body: 'Dane przetwarzamy w następujących celach:\n• Świadczenie usługi pośrednictwa w wymianie e-faktur z systemem KSeF (art. 6 ust. 1 lit. b RODO – wykonanie umowy)\n• Bezpieczeństwo i zapobieganie nadużyciom (art. 6 ust. 1 lit. f RODO – prawnie uzasadniony interes)\n• Wywiązanie się z obowiązków prawnych (art. 6 ust. 1 lit. c RODO)',
    },
    {
        heading: '§4. Przekazywanie danych do systemu KSeF (MF)',
        body: 'KSeF Master jest interfejsem do Krajowego Systemu e-Faktur prowadzonego przez Ministerstwo Finansów RP. Dane faktur, które przesyłasz za pośrednictwem aplikacji, trafiają bezpośrednio do systemu KSeF i są tam przetwarzane przez Ministerstwo Finansów na zasadach określonych przepisami prawa podatkowego. KSeF Master nie ponosi odpowiedzialności za przetwarzanie danych przez Ministerstwo Finansów.',
    },
    {
        heading: '§5. Pozostali odbiorcy danych',
        body: 'Twoje dane mogą być przekazywane następującym podmiotom przetwarzającym:\n• Neon Inc. – hostowanie bazy danych PostgreSQL (USA; Neon stosuje standardowe klauzule umowne)\n• Render Services, Inc. – hosting serwera aplikacji (USA; Render stosuje standardowe klauzule umowne)\n• Netlify, Inc. – hosting interfejsu aplikacji (USA; Netlify stosuje standardowe klauzule umowne)\n\nNie sprzedajemy Twoich danych osobom trzecim.',
    },
    {
        heading: '§6. Okres przechowywania danych',
        body: 'Dane konta i dane firmy przechowujemy przez czas trwania konta. Po usunięciu konta dane są kasowane w ciągu 30 dni, z wyjątkiem danych wymaganych do zachowania przez przepisy prawa (np. dokumentacja faktur zgodnie z przepisami podatkowymi).',
    },
    {
        heading: '§7. Twoje prawa',
        body: 'Na podstawie RODO przysługują Ci prawa do:\n• Dostępu do danych i uzyskania ich kopii\n• Sprostowania nieprawidłowych danych\n• Usunięcia danych (prawo do bycia zapomnianym)\n• Ograniczenia przetwarzania\n• Przeniesienia danych\n• Wniesienia sprzeciwu wobec przetwarzania\n• Wniesienia skargi do Prezesa UODO (ul. Stawki 2, 00-193 Warszawa)\n\nAby skorzystać z praw, skontaktuj się z nami: shellty@zohomail.eu',
    },
    {
        heading: '§8. Pliki cookie i pamięć lokalna',
        body: 'Aplikacja korzysta wyłącznie z pamięci lokalnej przeglądarki (localStorage) w następujących celach:\n• Przechowywanie tokenu sesji (JWT) na czas zalogowania\n• Zapamiętanie wybranych ustawień środowiska (testowe / produkcyjne)\n\nNie korzystamy z plików cookie śledzących ani reklamowych.',
    },
    {
        heading: '§9. Bezpieczeństwo danych',
        body: 'Stosujemy techniczne i organizacyjne środki ochrony danych: szyfrowanie połączeń (HTTPS/TLS), haszowanie haseł (bcrypt) oraz szyfrowanie tokenów i certyfikatów KSeF przechowywanych w bazie danych.',
    },
    {
        heading: '§10. Zmiany polityki prywatności',
        body: 'O istotnych zmianach polityki prywatności będziemy informować e-mailem lub komunikatem w aplikacji.',
    },
    {
        heading: '§11. Kontakt',
        body: 'W sprawach prywatności i ochrony danych: shellty@zohomail.eu',
    },
] as const;

export default function PrivacyPolicyModal({ isOpen, onClose }: Props) {
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            aria-modal="true"
            role="dialog"
            aria-labelledby="privacy-modal-title"
        >
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            <div className="relative flex w-full max-w-2xl max-h-[85vh] flex-col ks-card shadow-[var(--shadow-elevated)]">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 shrink-0">
                    <div>
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-accent mb-0.5">
                            KSeF Master
                        </div>
                        <h2 id="privacy-modal-title" className="text-base font-semibold text-foreground">
                            Polityka prywatności
                        </h2>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">Aktualizacja: 31 maja 2026 r.</p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Zamknij"
                        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto px-5 py-4 space-y-5">
                    {SECTIONS.map((section) => (
                        <div key={section.heading}>
                            <h3 className="mb-1.5 text-sm font-semibold text-foreground">
                                {section.heading}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                {section.body}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t border-border px-5 py-3">
                    <button
                        onClick={onClose}
                        className="flex w-full items-center justify-center rounded-xl bg-accent py-2.5 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-cta)] transition hover:brightness-110"
                    >
                        Zamknij
                    </button>
                </div>
            </div>
        </div>
    );
}
