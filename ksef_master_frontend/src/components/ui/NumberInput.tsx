import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { parseNumberLike } from '../../helpers/money';

interface Props {
    label?: string;
    value?: number;
    onChange: (v: number | undefined) => void;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    name?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    suffix?: string;
    compact?: boolean;
}

export default function NumberInput({
    label,
    value,
    onChange,
    placeholder,
    min,
    max,
    step: _step = 0.01,
    name,
    disabled,
    required,
    className,
    suffix,
    compact = false,
}: Props) {
    void _step;

    const [text, setText] = useState<string>(value === undefined ? '' : String(value));

    useEffect(() => {
        const v = value === undefined ? '' : String(value).replace('.', ',');
        if (v !== text) setText(v);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        const t = e.target.value;
        setText(t);
        const num = parseNumberLike(t);
        if (num === undefined) { onChange(undefined); return; }
        if (min !== undefined && num < min) return;
        if (max !== undefined && num > max) return;
        onChange(num);
    }

    const inputClass = compact ? 'ks-input-sm' : 'ks-input';

    const input = (
        <div className={suffix ? 'flex' : ''}>
            <input
                name={name}
                inputMode="decimal"
                className={`${inputClass} ${suffix ? 'rounded-r-none' : ''} ${className || ''}`}
                placeholder={placeholder}
                value={text}
                onChange={handleChange}
                disabled={disabled}
            />
            {suffix && (
                <span className="flex items-center rounded-r-md border border-l-0 border-input bg-muted px-2.5 text-[12px] text-muted-foreground">
                    {suffix}
                </span>
            )}
        </div>
    );

    if (!label) return input;

    return (
        <div className="space-y-1.5">
            <label className="ks-label">{label}{required ? ' *' : ''}</label>
            {input}
        </div>
    );
}
