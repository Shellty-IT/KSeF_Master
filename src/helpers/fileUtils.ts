// src/helpers/fileUtils.ts

export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const text = reader.result as string;
            resolve(text);
        };
        reader.onerror = () => {
            reject(new Error('Błąd odczytu pliku: ' + file.name));
        };
        reader.readAsText(file, 'UTF-8');
    });
}

export function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as ArrayBuffer;
            const bytes = new Uint8Array(result);

            let binary = '';
            const chunkSize = 8192;
            for (let i = 0; i < bytes.length; i += chunkSize) {
                const chunk = bytes.subarray(i, i + chunkSize);
                binary += String.fromCharCode(...chunk);
            }

            resolve(btoa(binary));
        };
        reader.onerror = () => {
            reject(new Error('Błąd odczytu pliku: ' + file.name));
        };
        reader.readAsArrayBuffer(file);
    });
}

export async function pemFileToBase64(file: File): Promise<string> {
    const text = await readFileAsText(file);

    const lines = text
        .split('\n')
        .map(line => line.trimEnd())
        .filter(line => line.length > 0)
        .join('\n');

    const encoder = new TextEncoder();
    const bytes = encoder.encode(lines);

    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
    }

    return btoa(binary);
}