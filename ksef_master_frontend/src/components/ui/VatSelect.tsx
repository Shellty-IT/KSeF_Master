import type { VatRate } from '../../helpers/vat';

interface Props {
    label?: string;
    value: VatRate;
    onChange: (v: VatRate) => void;
    name?: string;
    className?: string;
    compact?: boolean;
}

const OPTIONS: { value: VatRate; label: string }[] = [
    { value: 23, label: '23%' },
    { value: 8, label: '8%' },
    { value: 5, label: '5%' },
    { value: 0, label: '0%' },
    { value: 'ZW', label: 'ZW' },
    { value: 'NP', label: 'NP' },
];

export default function VatSelect({ label, value, onChange, name, className, compact = false }: Props) {
    const selectEl = (
        <select
            name={name}
            value={String(value)}
            className={`${compact ? 'ks-input-sm' : 'ks-input'} ${className || ''}`}
            onChange={(e) => {
                const val = e.target.value;
                const v = val === 'ZW' || val === 'NP' ? (val as VatRate) : (Number(val) as VatRate);
                onChange(v);
            }}
        >
            {OPTIONS.map((o) => (
                <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
            ))}
        </select>
    );

    if (!label) return selectEl;

    return (
        <div className="space-y-1.5">
            <label className="ks-label">{label}</label>
            {selectEl}
        </div>
    );
}
