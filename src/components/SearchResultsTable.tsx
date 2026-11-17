import React from 'react';
import { Eye, SearchX, Info } from 'lucide-react';
import { formatDateBR, type CosmeticProduct } from '../types/cosmetic';
import { StatusIndicator } from './StatusIndicator';
import { ProductThumbnail } from './ProductThumbnail';

interface SearchResultsTableProps {
  results: CosmeticProduct[];
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
  onSelectProduct: (id: string) => void;
  onResetSearch: () => void;
  onGoAdmin: () => void;
}

export const SearchResultsTable: React.FC<SearchResultsTableProps> = ({
  results,
  loading,
  error,
  hasSearched,
  onSelectProduct,
  onResetSearch,
  onGoAdmin,
}) => {
  return (
    <section
      aria-labelledby="resultados-consulta-heading"
      className="border border-[#d8dde3] rounded-[3px] bg-white overflow-hidden mt-6 hc-surface"
    >
      <div className="bg-[#eef1f4] border-b border-[#d8dde3] py-2.5 px-4 flex flex-wrap items-center justify-between gap-2 hc-header-bar">
        <h2
          id="resultados-consulta-heading"
          className="text-[14px] font-semibold text-[#333333]"
        >
          {hasSearched ? 'Resultado da Consulta' : 'Registros Verificados na Base'}
        </h2>
        <span className="text-[12px] text-[#555555] tabular-nums">
          {loading ? 'Consultando base...' : `${results.length} registro(s) encontrado(s)`}
        </span>
      </div>

      {error && (
        <div className="p-5 bg-[#fef2f2] border-b border-[#fecaca] text-[#991b1b] text-[13px]">
          Ocorreu um erro ao consultar os dados: {error}
        </div>
      )}

      {loading ? (
        <div className="p-4 space-y-2.5" aria-busy="true" aria-label="Carregando registros">
          {[1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="h-[44px] bg-[#f4f6f9] rounded-[3px] animate-pulse"
            />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="p-8 text-center">
          <div className="mx-auto w-11 h-11 rounded-[3px] bg-[#f4f6f9] border border-[#dce1e7] flex items-center justify-center text-[#1351b4] mb-3">
            {hasSearched ? (
              <SearchX className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Info className="w-5 h-5" aria-hidden="true" />
            )}
          </div>
          <h3 className="text-[15px] font-semibold text-[#222222]">
            {hasSearched
              ? 'Nenhum produto encontrado para os critérios informados'
              : 'Nenhum registro cadastrado na base de dados até o momento'}
          </h3>
          <p className="text-[13px] text-[#555555] max-w-xl mx-auto mt-1.5 leading-relaxed">
            {hasSearched
              ? 'Este produto não consta na base verificada ou algum dos dados informados não confere integralmente. Verifique se o nome completo do produto, número do registro, SNB / CNPJ, empresa fabricante, número do processo e período de vencimento estão exatos.'
              : 'Este portal exibe exclusivamente produtos inseridos e verificados pela administração. Acesse o Painel Administrativo para cadastrar os primeiros registros.'}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            {hasSearched && (
              <button
                type="button"
                onClick={onResetSearch}
                className="px-4 py-1.5 text-[13px] font-medium text-[#333333] bg-white hover:bg-[#f0f0f0] border border-[#cccccc] rounded-[3px] cursor-pointer"
              >
                Limpar Filtros
              </button>
            )}
            {!hasSearched && (
              <button
                type="button"
                onClick={onGoAdmin}
                className="px-4 py-1.5 text-[13px] font-semibold text-white bg-[#1351b4] hover:bg-[#0c3c8a] rounded-[3px] cursor-pointer"
              >
                Acessar Painel Administrativo
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-[#dee2e6] text-[#333333]">
                <th className="py-2.5 px-4 font-semibold">Produto</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Nº do Registro</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">SNB</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Nº do Processo</th>
                <th className="py-2.5 px-3 font-semibold">Empresa Fabricante</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Vencimento</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Situação</th>
                <th className="py-2.5 px-4 font-semibold text-right whitespace-nowrap">
                  Verificação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e9ecef]">
              {results.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-[#f5f8fc] transition-colors"
                >
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <ProductThumbnail
                        productId={product.id}
                        productName={product.productName}
                        imageUrl={product.imageUrl}
                        hasUploadedImage={product.hasUploadedImage}
                        className="w-10 h-10"
                      />
                      <div>
                        <button
                          type="button"
                          onClick={() => onSelectProduct(product.id)}
                          className="text-left font-semibold text-[#1351b4] hover:underline cursor-pointer"
                        >
                          {product.productName}
                        </button>
                        <div className="text-[11px] text-[#666666]">
                          Origem: {product.originCountry}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[12px] tabular-nums whitespace-nowrap text-[#222222]">
                    {product.registrationNumber}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[12px] tabular-nums whitespace-nowrap text-[#444444]">
                    {product.snbNumber}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[12px] tabular-nums whitespace-nowrap text-[#444444]">
                    {product.processNumber}
                  </td>
                  <td className="py-2.5 px-3 text-[#333333] min-w-[160px]">
                    {product.manufacturerName}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums whitespace-nowrap text-[#333333]">
                    {formatDateBR(product.expirationDate)}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <StatusIndicator status={product.status} size="sm" />
                  </td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-semibold text-[#1351b4] bg-[#eef3fb] hover:bg-[#dce6f7] border border-[#c5d6f3] rounded-[3px] transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Detalhes</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
