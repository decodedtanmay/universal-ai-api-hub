const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
];

const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

/**
 * Parse ISO-8601 strings as well as raw database timestamps ("2026-09-18 22:31:52").
 */
export function parseDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const date = new Date(/^\d{4}-\d{2}-\d{2} \d/.test(value) ? value.replace(' ', 'T') : value);

    return Number.isNaN(date.getTime()) ? null : date;
}

export function relativeTime(value: string | null | undefined): string | null {
    const date = parseDate(value);
    if (!date) return null;
    const seconds = Math.round((date.getTime() - Date.now()) / 1000);

    for (const [unit, size] of units) {
        if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
    }

    return 'just now';
}

export function RelativeTime({ value, fallback = 'Never' }: { value: string | null | undefined; fallback?: string }) {
    const date = parseDate(value);
    if (!date) return <span className="muted">{fallback}</span>;

    return <time dateTime={date.toISOString()} title={date.toLocaleString()}>{relativeTime(value)}</time>;
}
