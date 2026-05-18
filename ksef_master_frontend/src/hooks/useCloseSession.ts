import { useState } from 'react';
import { closeSessionAndGetUpo } from '../services/ksefApi';

interface UseCloseSessionResult {
    isClosing: boolean;
    closeInfo: string | null;
    closeSession: () => Promise<void>;
}

export function useCloseSession(): UseCloseSessionResult {
    const [isClosing, setIsClosing] = useState(false);
    const [closeInfo, setCloseInfo] = useState<string | null>(null);

    async function closeSession() {
        setIsClosing(true);
        setCloseInfo(null);

        try {
            const result = await closeSessionAndGetUpo();

            if (result.success) {
                if (result.data?.upoAvailable && result.data?.upoXml) {
                    const blob = new Blob([result.data.upoXml], { type: 'text/xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `UPO_${result.data.sessionReferenceNumber ?? 'sesja'}.xml`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    setCloseInfo('✅ Sesja zamknięta. UPO zbiorcze pobrane i zapisane.');
                } else {
                    setCloseInfo(`✅ ${result.message ?? 'Sesja zamknięta.'}`);
                }
            } else {
                setCloseInfo(`⚠️ ${result.error ?? 'Nie udało się zamknąć sesji.'}`);
            }
        } catch {
            setCloseInfo('⚠️ Błąd połączenia podczas zamykania sesji.');
        } finally {
            setIsClosing(false);
        }
    }

    return {
        isClosing,
        closeInfo,
        closeSession,
    };
}