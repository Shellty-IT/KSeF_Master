import { useState, useEffect } from 'react';

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    label?: string;
    showLabel?: boolean;
}

function formatIBAN(raw: string): string {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const hasCountryCode = /^[A-Z]{2}/.test(clean);
    let result = '';
    let digits = clean;

    if (hasCountryCode) {
        const countryCode = clean.slice(0, 2);
        digits = clean.slice(2).replace(/[^0-9]/g, '');
        result = countryCode;
        if (digits.length > 0) {
            result += digits.slice(0, 2);
            digits = digits.slice(2);
        }
        for (let i = 0; i < digits.length && i < 24; i++) {
            if (i % 4 === 0) result += ' ';
            result += digits[i];
        }
    } else {
        const onlyDigits = clean.replace(/[^0-9]/g, '');
        for (let i = 0; i < onlyDigits.length && i < 26; i++) {
            if (i > 0 && i % 4 === 0) result += ' ';
            result += onlyDigits[i];
        }
    }

    return result.trim();
}

function extractDigits(formatted: string): string {
    return formatted.replace(/[^0-9]/g, '');
}

function validatePolishIBAN(value: string): { valid: boolean; error?: string } {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!clean) return { valid: true };
    const startsWithPL = clean.startsWith('PL');
    const digits = startsWithPL ? clean.slice(2) : clean;
    const onlyDigits = digits.replace(/[^0-9]/g, '');
    if (onlyDigits.length > 0 && onlyDigits.length < 26)
        return { valid: false, error: `Wprowadź 26 cyfr (obecnie: ${onlyDigits.length})` };
    if (onlyDigits.length > 26) return { valid: false, error: 'Za dużo cyfr' };
    return { valid: true };
}

export default function BankAccountInput({
    value,
    onChange,
    placeholder,
    required,
    label,
    showLabel = true,
}: Props) {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [validation, setValidation] = useState<{ valid: boolean; error?: string }>({ valid: true });

    useEffect(() => {
        if (!isFocused) setDisplayValue(formatIBAN(value || ''));
    }, [value, isFocused]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const rawInput = e.target.value;
        const formatted = formatIBAN(rawInput);
        setDisplayValue(formatted);
        const digits = extractDigits(formatted);
        const hasCountryCode = rawInput.toUpperCase().startsWith('PL');
        onChange(hasCountryCode ? 'PL' + digits : digits);
        setValidation(validatePolishIBAN(formatted));
    }

    function handleBlur() {
        setIsFocused(false);
        setValidation(validatePolishIBAN(displayValue));
    }

    const digits = extractDigits(displayValue);
    const showError = !validation.valid && !isFocused && digits.length > 0;
    const showValid = validation.valid && digits.length === 26;

    return (
        <div className="space-y-1.5">
            {showLabel && label && (
                <label className="ks-label">{label}{required && ' *'}</label>
            )}
            <div className="relative">
                <input
                    type="text"
                    value={displayValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={() => setIsFocused(true)}
                    placeholder={placeholder || 'PL00 0000 0000 0000 0000 0000 0000'}
                    className={`ks-input font-mono pr-14 ${showError ? 'border-destructive focus:ring-destructive/40' : ''} ${showValid ? 'border-accent focus:ring-ring/40' : ''}`}
                    autoComplete="off"
                    spellCheck={false}
                />
                {digits.length > 0 && (
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium ${digits.length === 26 ? 'text-accent' : 'text-muted-foreground'}`}>
                        {digits.length}/26
                    </span>
                )}
            </div>
            {showError && <p className="text-[12px] text-destructive">{validation.error}</p>}
            {showValid && <p className="text-[12px] text-accent">✓ Poprawny numer konta</p>}
        </div>
    );
}
