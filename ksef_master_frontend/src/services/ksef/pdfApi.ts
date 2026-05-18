// src/services/ksef/pdfApi.ts
import { API_BASE_URL } from '../../constants/api';
import { tokenStorage } from '../tokenStorage';
import type { GeneratePdfRequest } from '../../types/invoice';

export type { GeneratePdfRequest };

export async function downloadInvoicePdf(request: GeneratePdfRequest): Promise<void> {
    const token = tokenStorage.get();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/ksef/invoice/pdf`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        if (response.status === 401) {
            tokenStorage.clear();
            window.location.hash = '#/login';
            throw new Error('Sesja wygasła. Zaloguj się ponownie.');
        }
        const error = await response.json().catch(() => ({ error: 'Błąd pobierania PDF' }));
        throw new Error(error.error || 'Nie udało się wygenerować PDF');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const contentDisposition = response.headers.get('Content-Disposition');
    let fileName = 'faktura.pdf';
    if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
            fileName = match[1].replace(/['"]/g, '');
        }
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
