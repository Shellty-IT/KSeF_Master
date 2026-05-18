// src/services/ksefApi.ts
// Barrel re-export — wszystkie istniejące importy z tego pliku działają bez zmian.
// Nowy kod powinien importować bezpośrednio z services/ksef/*.

export type { Invoice, UpoStatus, ListInvoicesParams } from '../types/ksef';
export type { CreateInvoiceRequest, GeneratePdfRequest } from '../types/invoice';

export type {
    LoginRequest,
    LoginResponse,
    SessionStatus,
    OpenSessionResponse,
    CloseSessionAndUpoResponse,
} from './ksef/sessionApi';

export {
    getStatus,
    login,
    logout,
    openSession,
    closeSession,
    closeSessionAndGetUpo,
} from './ksef/sessionApi';

export type {
    KsefDateType,
    InvoiceQueryRequest,
    InvoiceMetadata,
    InvoiceQueryResponse,
    SendInvoiceResponse,
    SyncInvoicesResponse,
    CachedInvoice,
    CachedInvoicesResponse,
} from './ksef/invoiceApi';

export {
    getInvoices,
    getCachedInvoices,
    syncInvoices,
    sendInvoice,
    listIssued,
    listReceived,
    getReceivedInvoices,
} from './ksef/invoiceApi';

export { downloadInvoicePdf } from './ksef/pdfApi';

export type {
    Contractor,
    ContractorQueryParams,
} from './ksef/contractorApi';

export {
    listContractors,
    upsertContractor,
} from './ksef/contractorApi';
