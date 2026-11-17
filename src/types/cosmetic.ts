import type { Timestamp } from 'firebase/firestore';

export type RegistrationStatus = 'valid' | 'expired' | 'suspended';

export interface CosmeticProduct {
  id: string;
  productName: string;
  registrationNumber: string;
  snbNumber: string;
  processNumber: string;
  registrationDate: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD
  manufacturerName: string;
  originCountry: string;
  status: RegistrationStatus;
  description: string;
  imageUrl: string;
  hasUploadedImage: boolean;
  verifiedByAdmin: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface CosmeticProductInput {
  productName: string;
  registrationNumber: string;
  snbNumber: string;
  processNumber: string;
  registrationDate: string;
  expirationDate: string;
  manufacturerName: string;
  originCountry: string;
  status: RegistrationStatus;
  description: string;
  imageUrl: string;
}

export interface SearchCriteria {
  productName: string;
  registrationNumber: string;
  snbNumber: string;
  manufacturerName: string;
  processNumber: string;
  expirationFrom: string;
  expirationTo: string;
  statusFilter: 'all' | RegistrationStatus | 'expiring_soon';
}

export const EMPTY_SEARCH_CRITERIA: SearchCriteria = {
  productName: '',
  registrationNumber: '',
  snbNumber: '',
  manufacturerName: '',
  processNumber: '',
  expirationFrom: '',
  expirationTo: '',
  statusFilter: 'all',
};

export const FIELD_BOUNDS = {
  productName: { min: 2, max: 200 },
  registrationNumber: { min: 3, max: 64 },
  snbNumber: { min: 3, max: 64 },
  processNumber: { min: 3, max: 64 },
  manufacturerName: { min: 2, max: 200 },
  originCountry: { min: 2, max: 100 },
  description: { min: 0, max: 2000 },
  imageUrl: { min: 0, max: 500 },
  dateRegex: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
} as const;

export function getStatusLabel(status: RegistrationStatus): string {
  switch (status) {
    case 'valid':
      return 'Registro válido';
    case 'expired':
      return 'Registro expirado';
    case 'suspended':
      return 'Registro suspenso';
  }
}

export function normalizeTextForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export type StrictSearchField =
  | 'productName'
  | 'registrationNumber'
  | 'snbNumber'
  | 'manufacturerName'
  | 'processNumber'
  | 'expirationFrom'
  | 'expirationTo';

export interface StrictSearchValidation {
  isValid: boolean;
  errors: Partial<Record<StrictSearchField, string>>;
  summary: string | null;
}

export function validateStrictSearchCriteria(
  criteria: SearchCriteria
): StrictSearchValidation {
  const errors: Partial<Record<StrictSearchField, string>> = {};

  if (!normalizeTextForSearch(criteria.productName)) {
    errors.productName = 'Informe o nome completo do produto.';
  }
  if (!normalizeCodeForSearch(criteria.registrationNumber)) {
    errors.registrationNumber = 'Informe o número completo do registro.';
  }
  if (!normalizeCodeForSearch(criteria.snbNumber)) {
    errors.snbNumber = 'Informe o número SNB / CNPJ completo.';
  }
  if (!normalizeTextForSearch(criteria.manufacturerName)) {
    errors.manufacturerName = 'Informe o nome completo da empresa fabricante.';
  }
  if (!normalizeCodeForSearch(criteria.processNumber)) {
    errors.processNumber = 'Informe o número completo do processo.';
  }

  const expFrom = normalizeDateInput(criteria.expirationFrom);
  const expTo = normalizeDateInput(criteria.expirationTo);

  if (!expFrom || !FIELD_BOUNDS.dateRegex.test(expFrom)) {
    errors.expirationFrom = 'Informe a data inicial válida.';
  }
  if (!expTo || !FIELD_BOUNDS.dateRegex.test(expTo)) {
    errors.expirationTo = 'Informe a data final válida.';
  }
  if (
    !errors.expirationFrom &&
    !errors.expirationTo &&
    expFrom > expTo
  ) {
    errors.expirationTo = 'A data final deve ser igual ou posterior à data inicial.';
  }

  const isValid = Object.keys(errors).length === 0;
  return {
    isValid,
    errors,
    summary: isValid
      ? null
      : 'Para consultar um produto, preencha todos os campos obrigatórios com os dados completos.',
  };
}

export function normalizeCodeForSearch(value: string): string {
  return value
    .replace(/[\.\-\/\s_]/g, '')
    .toLowerCase()
    .trim();
}

export function normalizeDateInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (FIELD_BOUNDS.dateRegex.test(trimmed)) return trimmed;
  const brMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month}-${day}`;
  }
  return trimmed;
}

export function formatDateBR(isoDate: string): string {
  const normalized = normalizeDateInput(isoDate);
  if (!normalized || !FIELD_BOUNDS.dateRegex.test(normalized)) return isoDate || '—';
  const [year, month, day] = normalized.split('-');
  return `${day}/${month}/${year}`;
}

export function getDaysUntilExpiration(expirationDate: string): number | null {
  const normalized = normalizeDateInput(expirationDate);
  if (!normalized || !FIELD_BOUNDS.dateRegex.test(normalized)) return null;
  const target = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = target.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function isExpiringSoon(product: CosmeticProduct, thresholdDays = 60): boolean {
  if (product.status !== 'valid') return false;
  const days = getDaysUntilExpiration(product.expirationDate);
  return days !== null && days <= thresholdDays;
}

export function validateCosmeticInput(input: CosmeticProductInput): Record<string, string> {
  const errors: Record<string, string> = {};

  const pName = input.productName.trim();
  if (pName.length < FIELD_BOUNDS.productName.min || pName.length > FIELD_BOUNDS.productName.max) {
    errors.productName = `O nome do produto deve ter entre ${FIELD_BOUNDS.productName.min} e ${FIELD_BOUNDS.productName.max} caracteres.`;
  }

  const reg = input.registrationNumber.trim();
  if (reg.length < FIELD_BOUNDS.registrationNumber.min || reg.length > FIELD_BOUNDS.registrationNumber.max) {
    errors.registrationNumber = `O número de registro deve ter entre ${FIELD_BOUNDS.registrationNumber.min} e ${FIELD_BOUNDS.registrationNumber.max} caracteres.`;
  }

  const snb = input.snbNumber.trim();
  if (snb.length < FIELD_BOUNDS.snbNumber.min || snb.length > FIELD_BOUNDS.snbNumber.max) {
    errors.snbNumber = `O número SNB / CNPJ deve ter entre ${FIELD_BOUNDS.snbNumber.min} e ${FIELD_BOUNDS.snbNumber.max} caracteres.`;
  }

  const proc = input.processNumber.trim();
  if (proc.length < FIELD_BOUNDS.processNumber.min || proc.length > FIELD_BOUNDS.processNumber.max) {
    errors.processNumber = `O número do processo deve ter entre ${FIELD_BOUNDS.processNumber.min} e ${FIELD_BOUNDS.processNumber.max} caracteres.`;
  }

  const regDate = normalizeDateInput(input.registrationDate);
  if (!FIELD_BOUNDS.dateRegex.test(regDate)) {
    errors.registrationDate = 'Informe a data de registro válida (DD/MM/AAAA ou AAAA-MM-DD).';
  }

  const expDate = normalizeDateInput(input.expirationDate);
  if (!FIELD_BOUNDS.dateRegex.test(expDate)) {
    errors.expirationDate = 'Informe a data de vencimento válida (DD/MM/AAAA ou AAAA-MM-DD).';
  }

  const mfg = input.manufacturerName.trim();
  if (mfg.length < FIELD_BOUNDS.manufacturerName.min || mfg.length > FIELD_BOUNDS.manufacturerName.max) {
    errors.manufacturerName = `O nome do fabricante deve ter entre ${FIELD_BOUNDS.manufacturerName.min} e ${FIELD_BOUNDS.manufacturerName.max} caracteres.`;
  }

  const country = input.originCountry.trim();
  if (country.length < FIELD_BOUNDS.originCountry.min || country.length > FIELD_BOUNDS.originCountry.max) {
    errors.originCountry = `O país de origem deve ter entre ${FIELD_BOUNDS.originCountry.min} e ${FIELD_BOUNDS.originCountry.max} caracteres.`;
  }

  if (!['valid', 'expired', 'suspended'].includes(input.status)) {
    errors.status = 'Selecione uma situação de registro válida.';
  }

  if (input.description.trim().length > FIELD_BOUNDS.description.max) {
    errors.description = `A descrição não pode ultrapassar ${FIELD_BOUNDS.description.max} caracteres.`;
  }

  if (input.imageUrl.trim().length > FIELD_BOUNDS.imageUrl.max) {
    errors.imageUrl = `A URL da imagem não pode ultrapassar ${FIELD_BOUNDS.imageUrl.max} caracteres.`;
  }

  return errors;
}
