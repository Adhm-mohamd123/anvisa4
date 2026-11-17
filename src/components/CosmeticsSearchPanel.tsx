import React, { useRef, useState } from 'react';
import { Search, Calendar, X, AlertCircle } from 'lucide-react';
import {
  normalizeCodeForSearch,
  validateStrictSearchCriteria,
  type CosmeticProduct,
  type SearchCriteria,
  type StrictSearchField,
} from '../types/cosmetic';

interface CosmeticsSearchPanelProps {
  criteria: SearchCriteria;
  onChangeCriteria: (next: SearchCriteria) => void;
  onSubmitSearch: (next?: SearchCriteria) => void;
  onResetSearch: () => void;
  onClearResults?: () => void;
  searchNotFound?: boolean;
  loadingProducts?: boolean;
  allProducts: CosmeticProduct[];
  focusField?: 'productName' | 'registrationNumber' | 'snbNumber' | 'processNumber' | null;
}

export const CosmeticsSearchPanel: React.FC<CosmeticsSearchPanelProps> = ({
  criteria,
  onChangeCriteria,
  onSubmitSearch,
  onResetSearch,
  onClearResults,
  searchNotFound = false,
  loadingProducts = false,
  allProducts,
  focusField,
}) => {
  const [snbFeedback, setSnbFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<StrictSearchField, string>>
  >({});
  const [fromInputType, setFromInputType] = useState<'text' | 'date'>('text');
  const [toInputType, setToInputType] = useState<'text' | 'date'>('text');
  const expFromRef = useRef<HTMLInputElement | null>(null);
  const expToRef = useRef<HTMLInputElement | null>(null);

  const clearFieldError = (field: StrictSearchField) => {
    setFormError(null);
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSnbLookup = () => {
    const queryNorm = normalizeCodeForSearch(criteria.snbNumber);
    if (!queryNorm) {
      setSnbFeedback('Informe o código SNB / CNPJ completo para localizar a empresa fabricante.');
      return;
    }

    const match = allProducts.find((p) => {
      const snbNorm = normalizeCodeForSearch(p.snbNumber);
      return Boolean(snbNorm) && snbNorm === queryNorm;
    });

    if (match) {
      setSnbFeedback(null);
      clearFieldError('manufacturerName');
      onChangeCriteria({
        ...criteria,
        manufacturerName: match.manufacturerName,
      });
    } else {
      setSnbFeedback('Nenhuma empresa encontrada para este código SNB / CNPJ exato na base verificada.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSnbFeedback(null);

    const validation = validateStrictSearchCriteria(criteria);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setFormError(validation.summary);
      onClearResults?.();
      return;
    }

    setFieldErrors({});
    setFormError(null);
    onSubmitSearch();
  };

  const handleClear = () => {
    setSnbFeedback(null);
    setFormError(null);
    setFieldErrors({});
    setFromInputType('text');
    setToInputType('text');
    onResetSearch();
  };

  const openDatePicker = (
    setter: React.Dispatch<React.SetStateAction<'text' | 'date'>>,
    ref: React.RefObject<HTMLInputElement | null>
  ) => {
    setter('date');
    setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      if (typeof el.showPicker === 'function') {
        try {
          el.showPicker();
        } catch {
          // ignore if browser blocks programmatic picker
        }
      }
    }, 0);
  };

  const statusBadgeLabel =
    criteria.statusFilter === 'valid'
      ? 'Registros Válidos'
      : criteria.statusFilter === 'expired'
        ? 'Registros Expirados'
        : criteria.statusFilter === 'suspended'
          ? 'Registros Suspensos'
          : criteria.statusFilter === 'expiring_soon'
            ? 'Próximos do Vencimento'
            : null;

  return (
    <section
      aria-labelledby="criterios-consulta-heading"
      className="border border-[#d8dde3] rounded-[3px] bg-white overflow-hidden hc-surface"
    >
      {/* Header bar matching reference screenshot: "Critérios para Consulta" */}
      <div className="bg-[#f2f4f7] border-b border-[#d8dde3] py-2.5 px-4 text-center hc-header-bar">
        <h2
          id="criterios-consulta-heading"
          className="text-[14px] font-medium text-[#333333]"
        >
          Critérios para Consulta
        </h2>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="p-4 sm:p-5 space-y-4">
          <p className="text-[12px] text-[#555555]">
            Todos os campos marcados com{' '}
            <span className="text-[#c92a2a] font-semibold">*</span> são obrigatórios e devem ser
            preenchidos com os dados completos do produto.
          </p>

          {statusBadgeLabel && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#f5f8fc] border border-[#c5d6f3] rounded-[3px] px-3 py-2 text-[12px] text-[#1351b4]">
              <span>
                Filtro de situação ativo: <strong>{statusBadgeLabel}</strong>
              </span>
              <button
                type="button"
                onClick={() =>
                  onChangeCriteria({ ...criteria, statusFilter: 'all' })
                }
                className="text-[#1351b4] hover:underline font-medium cursor-pointer"
              >
                Remover filtro de situação
              </button>
            </div>
          )}

          {(formError || searchNotFound) && (
            <div
              role="alert"
              className="flex items-start gap-2 bg-[#fef2f2] border border-[#fecaca] rounded-[3px] px-3 py-2.5 text-[12px] text-[#991b1b]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                {formError ||
                  'Nenhum produto encontrado para os critérios informados. Todos os dados completos devem corresponder exatamente a um registro válido na base.'}
              </span>
            </div>
          )}

          {/* Row 1: Nome do Produto | Número do Registro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label
                htmlFor="search-product-name"
                className="block text-[13px] font-bold text-[#333333] mb-1.5"
              >
                Nome do Produto
                <span className="text-[#c92a2a] ml-0.5" aria-hidden="true">*</span>
              </label>
              <input
                id="search-product-name"
                type="text"
                required
                autoFocus={focusField === 'productName'}
                value={criteria.productName}
                onChange={(e) => {
                  clearFieldError('productName');
                  onChangeCriteria({ ...criteria, productName: e.target.value });
                }}
                aria-invalid={Boolean(fieldErrors.productName)}
                className={`w-full h-[38px] px-3 text-[13px] text-[#333333] bg-white border rounded-[3px] focus:outline-none focus:ring-1 ${
                  fieldErrors.productName
                    ? 'border-[#c92a2a] focus:border-[#c92a2a] focus:ring-[#c92a2a]'
                    : 'border-[#ced4da] focus:border-[#1956b4] focus:ring-[#1956b4]'
                }`}
              />
              {fieldErrors.productName && (
                <p className="text-[11px] text-[#c92a2a] mt-1">{fieldErrors.productName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="search-registration-number"
                className="block text-[13px] font-bold text-[#333333] mb-1.5"
              >
                Número do Registro
                <span className="text-[#c92a2a] ml-0.5" aria-hidden="true">*</span>
              </label>
              <input
                id="search-registration-number"
                type="text"
                required
                autoFocus={focusField === 'registrationNumber'}
                value={criteria.registrationNumber}
                onChange={(e) => {
                  clearFieldError('registrationNumber');
                  onChangeCriteria({ ...criteria, registrationNumber: e.target.value });
                }}
                aria-invalid={Boolean(fieldErrors.registrationNumber)}
                className={`w-full h-[38px] px-3 text-[13px] font-mono tabular-nums text-[#333333] bg-white border rounded-[3px] focus:outline-none focus:ring-1 ${
                  fieldErrors.registrationNumber
                    ? 'border-[#c92a2a] focus:border-[#c92a2a] focus:ring-[#c92a2a]'
                    : 'border-[#ced4da] focus:border-[#1956b4] focus:ring-[#1956b4]'
                }`}
              />
              {fieldErrors.registrationNumber && (
                <p className="text-[11px] text-[#c92a2a] mt-1">
                  {fieldErrors.registrationNumber}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Número SNB da Empresa + Magnifier | Gray Manufacturer box */}
          <div>
            <label
              htmlFor="search-snb-number"
              className="block text-[13px] font-bold text-[#333333] mb-1.5"
            >
              Número SNB / CNPJ da Empresa
              <span className="text-[#c92a2a] ml-0.5" aria-hidden="true">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 items-start">
              <div>
                <div className="flex">
                  <input
                    id="search-snb-number"
                    type="text"
                    required
                    autoFocus={focusField === 'snbNumber'}
                    value={criteria.snbNumber}
                    onChange={(e) => {
                      setSnbFeedback(null);
                      clearFieldError('snbNumber');
                      onChangeCriteria({ ...criteria, snbNumber: e.target.value });
                    }}
                    aria-invalid={Boolean(fieldErrors.snbNumber)}
                    className={`w-full h-[38px] px-3 text-[13px] font-mono tabular-nums text-[#333333] bg-white border rounded-l-[3px] focus:outline-none focus:ring-1 ${
                      fieldErrors.snbNumber
                        ? 'border-[#c92a2a] focus:border-[#c92a2a] focus:ring-[#c92a2a]'
                        : 'border-[#ced4da] focus:border-[#1956b4] focus:ring-[#1956b4]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleSnbLookup}
                    title="Localizar fabricante por SNB"
                    aria-label="Localizar fabricante por SNB"
                    className="w-[42px] h-[38px] bg-[#e9ecef] hover:bg-[#dde2e6] border border-l-0 border-[#ced4da] rounded-r-[3px] flex items-center justify-center text-[#333333] transition-colors cursor-pointer shrink-0"
                  >
                    <Search className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                {fieldErrors.snbNumber && (
                  <p className="text-[11px] text-[#c92a2a] mt-1">{fieldErrors.snbNumber}</p>
                )}
              </div>

              <div>
                <div className="relative">
                  <input
                    id="search-manufacturer-name"
                    type="text"
                    required
                    aria-label="Empresa Fabricante"
                    value={criteria.manufacturerName}
                    onChange={(e) => {
                      clearFieldError('manufacturerName');
                      onChangeCriteria({ ...criteria, manufacturerName: e.target.value });
                    }}
                    placeholder="Empresa Fabricante *"
                    aria-invalid={Boolean(fieldErrors.manufacturerName)}
                    className={`w-full h-[38px] px-3 pr-8 text-[13px] text-[#333333] placeholder:text-[#666666] bg-[#e9ecef] focus:bg-white border rounded-[3px] focus:outline-none focus:ring-1 transition-colors ${
                      fieldErrors.manufacturerName
                        ? 'border-[#c92a2a] focus:border-[#c92a2a] focus:ring-[#c92a2a]'
                        : 'border-[#ced4da] focus:border-[#1956b4] focus:ring-[#1956b4]'
                    }`}
                  />
                  {criteria.manufacturerName && (
                    <button
                      type="button"
                      onClick={() => {
                        clearFieldError('manufacturerName');
                        onChangeCriteria({ ...criteria, manufacturerName: '' });
                      }}
                      aria-label="Limpar empresa fabricante"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#111111] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
                {fieldErrors.manufacturerName && (
                  <p className="text-[11px] text-[#c92a2a] mt-1">
                    {fieldErrors.manufacturerName}
                  </p>
                )}
              </div>
            </div>
            {snbFeedback && (
              <p className="text-[11px] text-[#b45309] mt-1">{snbFeedback}</p>
            )}
          </div>

          {/* Row 3: Número do Processo | Período de Vencimento do Registro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label
                htmlFor="search-process-number"
                className="block text-[13px] font-bold text-[#333333] mb-1.5"
              >
                Número do Processo
                <span className="text-[#c92a2a] ml-0.5" aria-hidden="true">*</span>
              </label>
              <input
                id="search-process-number"
                type="text"
                required
                autoFocus={focusField === 'processNumber'}
                value={criteria.processNumber}
                onChange={(e) => {
                  clearFieldError('processNumber');
                  onChangeCriteria({ ...criteria, processNumber: e.target.value });
                }}
                aria-invalid={Boolean(fieldErrors.processNumber)}
                className={`w-full h-[38px] px-3 text-[13px] font-mono tabular-nums text-[#333333] bg-white border rounded-[3px] focus:outline-none focus:ring-1 ${
                  fieldErrors.processNumber
                    ? 'border-[#c92a2a] focus:border-[#c92a2a] focus:ring-[#c92a2a]'
                    : 'border-[#ced4da] focus:border-[#1956b4] focus:ring-[#1956b4]'
                }`}
              />
              {fieldErrors.processNumber && (
                <p className="text-[11px] text-[#c92a2a] mt-1">{fieldErrors.processNumber}</p>
              )}
            </div>

            <div>
              <span className="block text-[13px] font-bold text-[#333333] mb-1.5">
                Período de Vencimento do Registro
                <span className="text-[#c92a2a] ml-0.5" aria-hidden="true">*</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Data Inicial */}
                <div>
                  <div className="flex">
                    <input
                      ref={expFromRef}
                      id="search-exp-from"
                      type={criteria.expirationFrom ? 'date' : fromInputType}
                      required
                      placeholder="Data Inicial"
                      aria-label="Data Inicial"
                      value={criteria.expirationFrom}
                      onFocus={() => setFromInputType('date')}
                      onBlur={() => {
                        if (!criteria.expirationFrom) setFromInputType('text');
                      }}
                      onChange={(e) => {
                        clearFieldError('expirationFrom');
                        onChangeCriteria({ ...criteria, expirationFrom: e.target.value });
                      }}
                      aria-invalid={Boolean(fieldErrors.expirationFrom)}
                      className={`w-full h-[38px] px-3 text-[13px] tabular-nums text-[#333333] placeholder:text-[#777777] bg-white border rounded-l-[3px] focus:outline-none focus:ring-1 ${
                        fieldErrors.expirationFrom
                          ? 'border-[#c92a2a] focus:border-[#c92a2a] focus:ring-[#c92a2a]'
                          : 'border-[#ced4da] focus:border-[#1956b4] focus:ring-[#1956b4]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => openDatePicker(setFromInputType, expFromRef)}
                      aria-label="Selecionar Data Inicial"
                      className="w-[42px] h-[38px] bg-[#e9ecef] hover:bg-[#dde2e6] border border-l-0 border-[#ced4da] rounded-r-[3px] flex items-center justify-center text-[#333333] cursor-pointer shrink-0"
                    >
                      <Calendar className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                  {fieldErrors.expirationFrom && (
                    <p className="text-[11px] text-[#c92a2a] mt-1">
                      {fieldErrors.expirationFrom}
                    </p>
                  )}
                </div>

                {/* Data Final */}
                <div>
                  <div className="flex">
                    <input
                      ref={expToRef}
                      id="search-exp-to"
                      type={criteria.expirationTo ? 'date' : toInputType}
                      required
                      placeholder="Data Final"
                      aria-label="Data Final"
                      value={criteria.expirationTo}
                      onFocus={() => setToInputType('date')}
                      onBlur={() => {
                        if (!criteria.expirationTo) setToInputType('text');
                      }}
                      onChange={(e) => {
                        clearFieldError('expirationTo');
                        onChangeCriteria({ ...criteria, expirationTo: e.target.value });
                      }}
                      aria-invalid={Boolean(fieldErrors.expirationTo)}
                      className={`w-full h-[38px] px-3 text-[13px] tabular-nums text-[#333333] placeholder:text-[#777777] bg-white border rounded-l-[3px] focus:outline-none focus:ring-1 ${
                        fieldErrors.expirationTo
                          ? 'border-[#c92a2a] focus:border-[#c92a2a] focus:ring-[#c92a2a]'
                          : 'border-[#ced4da] focus:border-[#1956b4] focus:ring-[#1956b4]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => openDatePicker(setToInputType, expToRef)}
                      aria-label="Selecionar Data Final"
                      className="w-[42px] h-[38px] bg-[#e9ecef] hover:bg-[#dde2e6] border border-l-0 border-[#ced4da] rounded-r-[3px] flex items-center justify-center text-[#333333] cursor-pointer shrink-0"
                    >
                      <Calendar className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                  {fieldErrors.expirationTo && (
                    <p className="text-[11px] text-[#c92a2a] mt-1">
                      {fieldErrors.expirationTo}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer action bar matching reference screenshot */}
        <div className="bg-[#f5f7f9] border-t border-[#d8dde3] py-3 px-4 flex items-center justify-center gap-2 hc-header-bar">
          <button
            type="submit"
            disabled={loadingProducts}
            className="px-5 py-1.5 text-[13px] font-medium text-white bg-[#1956b4] hover:bg-[#12428c] disabled:opacity-60 rounded-[3px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {loadingProducts ? 'Carregando...' : 'Consultar'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-5 py-1.5 text-[13px] font-medium text-[#333333] bg-white hover:bg-[#f0f0f0] border border-[#cccccc] rounded-[3px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Limpar
          </button>
        </div>
      </form>
    </section>
  );
};
