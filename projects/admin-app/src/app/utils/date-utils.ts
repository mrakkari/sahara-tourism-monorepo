export function isToday(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

export function isTomorrow(dateString: string): boolean {
    const date = new Date(dateString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.getDate() === tomorrow.getDate() &&
        date.getMonth() === tomorrow.getMonth() &&
        date.getFullYear() === tomorrow.getFullYear();
}

export function isInDateRange(dateString: string, startDate?: Date | null, endDate?: Date | null): boolean {
    if (!startDate && !endDate) return true;

    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);

    const start = startDate ? new Date(startDate) : null;
    if (start) start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    if (start && date < start) return false;
    if (end && date > end) return false;

    return true;
}

export function formatDate(dateString: string, locale: string = 'en-US'): string {
    return new Date(dateString).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

export function getDateRangeForDays(days: number): { start: Date, end: Date } {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return { start, end };
}
