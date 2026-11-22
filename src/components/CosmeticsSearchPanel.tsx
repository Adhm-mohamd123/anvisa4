import React, { useMemo, useRef, useState } from 'react';
import { Search, Calendar, X, AlertCircle } from 'lucide-react';
import {
  normalizeCodeForSearch,
  normalizeTextForSearch,
  type CosmeticProduct,
  type SearchCriteria,
} from '../types/cosmetic';

interface CosmeticsSearchPanelProps {
  criteria: SearchCriteria;
  onChangeCriteria: (next: SearchCriteria) => void;
  onSubmitSearch: (next?: SearchCriteria) => void;
  onResetSearch: () => void;
  onSelectProduct?: (id: string) => void;
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
  onSelectProduct,
  searchNotFound = false,
  loadingProducts = false,
  allProducts,
  focusField,
}) => {
  const [snbFeedback, setSnbFeedback] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fromInputType, setFromInputType] = useState<'text' | 'date'>('text');
  const [toInputType, setToInputType] = useState<'text' | 'date'>('text');
  const expFromRef = useRef<HTMLInputElement | null>(null);
  const expToRef = useRef<HTMLInputElement | null>(null);

  const nameSuggestions = useMemo(() => {
    const q = normalizeTextForSearch(criteria.productName);
    if (!q) return [];
    const tokens = q.split(' ').filter(Boolean);
    const qCode = normalizeCodeForSearch(criteria.productName);

    return allProducts
      .filter((p) => {
        if (!p.verifiedByAdmin) return false;
        const nameNorm = normalizeTextForSearch(p.productName);
        const matchesTokens = tokens.every((t) => nameNorm.includes(t));
        const matchesCode =
          Boolean(qCode) &&
          (normalizeCodeForSearch(p.registrationNumber).includes(qCode) ||
            normalizeCodeForSearch(p.snbNumber).includes(qCode) ||
            normalizeCodeForSearch(p.processNumber).includes(qCode));
        return matchesTokens || matchesCode;
      })
      .sort((a, b) => {
        const aName = normalizeTextForSearch(a.productName);
        const bName = normalizeTextForSearch(b.productName);
        const aScore = aName === q ? 0 : aName.startsWith(q) ? 1 : 2;
        const bScore = bName === q ? 0 : bName.startsWith(q) ? 1 : 2;
        return aScore - bScore;
      })
      .slice(0, 6);
  }, [allProducts, criteria.productName]);

  const handleSnbLookup = () => {
    const queryRaw = criteria.snbNumber.trim().toLowerCase();
    const queryNorm = normalizeCodeForSearch(criteria.snbNumber);
    if (!queryRaw) {
      setSnbFeedback('Informe um código SNB / CNPJ para localizar a empresa fabricante.');
      return;
    }

    const match = allProducts.find((p) => {
      const snbRaw = p.snbNumber.toLowerCase();
      const snbNorm = normalizeCodeForSearch(p.snbNumber);
      return snbRaw.includes(queryRaw) || (Boolean(queryNorm) && snbNorm.includes(queryNorm));
    });

    if (match) {
      setSnbFeedback(null);
      const updated: SearchCriteria = {
        ...criteria,
        manufacturerName: match.manufacturerName,
      };
      onChangeCriteria(updated);
      onSubmitSearch(updated);
    } else {
      setSnbFeedback('Nenhuma empresa encontrada para este código SNB na base verificada.');
      onChangeCriteria({ ...criteria, manufacturerName: '' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSnbFeedback(null);
    setShowSuggestions(false);
    onSubmitSearch();
  };

  const handleClear = () => {
    setSnbFeedback(null);
    setShowSuggestions(false);
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
      className="border border-[#d8dde3] rounded-[3px] bg-white overflow-visible hc-surface"
    >
      {/* Header bar matching reference screenshot: "Critérios para Consulta" */}
      <div className="bg-[#f2f4f7] border-b border-[#d8dde3] py-2.5 px-4 text-center rounded-t-[3px] hc-header-bar">
        <h2
          id="criterios-consulta-heading"
          className="text-[14px] font-medium text-[#333333]"
        >
          Critérios para Consulta
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="p-4 sm:p-5 space-y-4">
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

          {searchNotFound && (
            <div
              role="alert"
              className="flex items-start gap-2 bg-[#fef2f2] border border-[#fecaca] rounded-[3px] px-3 py-2.5 text-[12px] text-[#991b1b]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Nenhum produto encontrado para os critérios informados. Tente informar apenas parte
                do nome do produto ou outro dado de identificação.
              </span>
            </div>
          )}

          {/* Row 1: Nome do Produto | Número do Registro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="relative">
              <label
                htmlFor="search-product-name"
                className="block text-[13px] font-bold text-[#333333] mb-1.5"
              >
                Nome do Produto
              </label>
              <input
                id="search-product-name"
                type="text"
                autoComplete="off"
                autoFocus={focusField === 'productName'}
                value={criteria.productName}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 150);
                }}
                onChange={(e) => {
                  setShowSuggestions(true);
                  onChangeCriteria({ ...criteria, productName: e.target.value });
                }}
                className="w-full h-[38px] px-3 text-[13px] text-[#333333] bg-white border border-[#ced4da] rounded-[3px] focus:outline-none focus:border-[#1956b4] focus:ring-1 focus:ring-[#1956b4]"
              />
              {showSuggestions && nameSuggestions.length > 0 && (
                <ul
                  role="listbox"
                  aria-label="Produtos encontrados"
                  className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-[#ced4da] rounded-[3px] shadow-md divide-y divide-[#eef1f4] max-h-60 overflow-y-auto hc-surface"
                >
                  {nameSuggestions.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setShowSuggestions(false);
                          onSelectProduct?.(item.id);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[#f2f6fb] transition-colors cursor-pointer flex items-center justify-between gap-2"
                      >
                        <span className="text-[13px] font-medium text-[#1b5ca7] truncate">
                          {item.productName}
                        </span>
                        <span className="text-[11px] font-mono text-[#666666] shrink-0">
                          {item.registrationNumber}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label
                htmlFor="search-registration-number"
                className="block text-[13px] font-bold text-[#333333] mb-1.5"
              >
                Número do Registro
              </label>
              <input
                id="search-registration-number"
                type="text"
                autoFocus={focusField === 'registrationNumber'}
                value={criteria.registrationNumber}
                onChange={(e) =>
                  onChangeCriteria({ ...criteria, registrationNumber: e.target.value })
                }
                className="w-full h-[38px] px-3 text-[13px] font-mono tabular-nums text-[#333333] bg-white border border-[#ced4da] rounded-[3px] focus:outline-none focus:border-[#1956b4] focus:ring-1 focus:ring-[#1956b4]"
              />
            </div>
          </div>

          {/* Row 2: Número SNB da Empresa + Magnifier | Gray Manufacturer box */}
          <div>
            <label
              htmlFor="search-snb-number"
              className="block text-[13px] font-bold text-[#333333] mb-1.5"
            >
              Número SNB / CNPJ da Empresa
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 items-center">
              <div className="flex">
                <input
                  id="search-snb-number"
                  type="text"
                  autoFocus={focusField === 'snbNumber'}
                  value={criteria.snbNumber}
                  onChange={(e) => {
                    setSnbFeedback(null);
                    onChangeCriteria({ ...criteria, snbNumber: e.target.value });
                  }}
                  className="w-full h-[38px] px-3 text-[13px] font-mono tabular-nums text-[#333333] bg-white border border-[#ced4da] rounded-l-[3px] focus:outline-none focus:border-[#1956b4] focus:ring-1 focus:ring-[#1956b4]"
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

              <div className="relative">
                <input
                  id="search-manufacturer-name"
                  type="text"
                  aria-label="Empresa Fabricante"
                  value={criteria.manufacturerName}
                  onChange={(e) =>
                    onChangeCriteria({ ...criteria, manufacturerName: e.target.value })
                  }
                  placeholder=""
                  className="w-full h-[38px] px-3 pr-8 text-[13px] text-[#333333] bg-[#e9ecef] focus:bg-white border border-[#ced4da] rounded-[3px] focus:outline-none focus:border-[#1956b4] focus:ring-1 focus:ring-[#1956b4] transition-colors"
                />
                {criteria.manufacturerName && (
                  <button
                    type="button"
                    onClick={() =>
                      onChangeCriteria({ ...criteria, manufacturerName: '' })
                    }
                    aria-label="Limpar empresa fabricante"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#111111] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
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
              </label>
              <input
                id="search-process-number"
                type="text"
                autoFocus={focusField === 'processNumber'}
                value={criteria.processNumber}
                onChange={(e) =>
                  onChangeCriteria({ ...criteria, processNumber: e.target.value })
                }
                className="w-full h-[38px] px-3 text-[13px] font-mono tabular-nums text-[#333333] bg-white border border-[#ced4da] rounded-[3px] focus:outline-none focus:border-[#1956b4] focus:ring-1 focus:ring-[#1956b4]"
              />
            </div>

            <div>
              <span className="block text-[13px] font-bold text-[#333333] mb-1.5">
                Período de Vencimento do Registro
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Data Inicial */}
                <div className="flex">
                  <input
                    ref={expFromRef}
                    id="search-exp-from"
                    type={criteria.expirationFrom ? 'date' : fromInputType}
                    placeholder="Data Inicial"
                    aria-label="Data Inicial"
                    value={criteria.expirationFrom}
                    onFocus={() => setFromInputType('date')}
                    onBlur={() => {
                      if (!criteria.expirationFrom) setFromInputType('text');
                    }}
                    onChange={(e) =>
                      onChangeCriteria({ ...criteria, expirationFrom: e.target.value })
                    }
                    className="w-full h-[38px] px-3 text-[13px] tabular-nums text-[#333333] placeholder:text-[#777777] bg-white border border-[#ced4da] rounded-l-[3px] focus:outline-none focus:border-[#1956b4] focus:ring-1 focus:ring-[#1956b4]"
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

                {/* Data Final */}
                <div className="flex">
                  <input
                    ref={expToRef}
                    id="search-exp-to"
                    type={criteria.expirationTo ? 'date' : toInputType}
                    placeholder="Data Final"
                    aria-label="Data Final"
                    value={criteria.expirationTo}
                    onFocus={() => setToInputType('date')}
                    onBlur={() => {
                      if (!criteria.expirationTo) setToInputType('text');
                    }}
                    onChange={(e) =>
                      onChangeCriteria({ ...criteria, expirationTo: e.target.value })
                    }
                    className="w-full h-[38px] px-3 text-[13px] tabular-nums text-[#333333] placeholder:text-[#777777] bg-white border border-[#ced4da] rounded-l-[3px] focus:outline-none focus:border-[#1956b4] focus:ring-1 focus:ring-[#1956b4]"
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
              </div>
            </div>
          </div>
        </div>

        {/* Footer action bar matching reference screenshot */}
        <div className="bg-[#f5f7f9] border-t border-[#d8dde3] py-3 px-4 rounded-b-[3px] flex items-center justify-center gap-2 hc-header-bar">
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
