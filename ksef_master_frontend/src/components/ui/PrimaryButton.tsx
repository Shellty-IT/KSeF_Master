import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: string;
}

export default function PrimaryButton({
    children,
    icon,
    className = '',
    ...rest
}: PropsWithChildren<Props>) {
    return (
        <button
            className={`inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-cta)] transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
            {...rest}
        >
            {icon && <span aria-hidden>{icon}</span>}
            {children}
        </button>
    );
}
