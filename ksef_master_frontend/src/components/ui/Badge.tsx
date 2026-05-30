import type { ReactNode } from 'react';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const styles: Record<Variant, string> = {
    success: 'bg-accent/10 text-accent border-accent/20',
    warning: 'bg-warning/15 text-[oklch(0.45_0.12_75)] border-warning/30',
    danger: 'bg-destructive/10 text-destructive border-destructive/20',
    info: 'bg-primary/10 text-primary border-primary/15',
    neutral: 'bg-secondary text-secondary-foreground border-border',
};

const dotStyles: Record<Variant, string> = {
    success: 'bg-accent',
    warning: 'bg-warning',
    danger: 'bg-destructive',
    info: 'bg-primary',
    neutral: 'bg-muted-foreground',
};

export function Badge({
    variant = 'neutral',
    children,
    dot = false,
}: {
    variant?: Variant;
    children: ReactNode;
    dot?: boolean;
}) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-tight ${styles[variant]}`}
        >
            {dot && (
                <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[variant]}`} />
            )}
            {children}
        </span>
    );
}
