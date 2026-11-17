import React, { useEffect, useState } from 'react';
import { ArrowLeft, Printer, ShieldCheck, AlertCircle } from 'lucide-react';
import { fetchCosmeticById } from '../services/cosmeticsService';
import { formatDateBR, type CosmeticProduct } from '../types/cosmetic';
import { StatusIndicator } from './StatusIndicator';
import { ProductThumbnail } from './ProductThumbnail';

interface ProductDetailViewProps {
  productId: string;
  onBack: () => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  productId,
  onBack,
}) => {
  const [product, setProduct] = useState<CosmeticProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCosmeticById(productId)
      .then((item) => {
        if (!cancelled) {
          setProduct(item);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar registro.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="border border-[#d8dde3] rounded-[3px] bg-white p-6 space-y-4">
        <div className="h-12 bg-[#f4f6f9] rounded-[3px] animate-pulse" />
        <div className="h-64 bg-[#f4f6f9] rounded-[3px] animate-pulse" />
      </div>
    );
  }

  if (error || !product || !product.verifiedByAdmin) {
    return (
      <section className="border border-[#d8dde3] rounded-[3px] bg-white p-8 text-center hc-surface">
        <AlertCircle className="w-10 h-10 text-[#b91c1c] mx-auto mb-3" aria-hidden="true" />
        <h2 className="text-[17px] font-bold text-[#222222]">
          Registro não encontrado ou não verificado
        </h2>
        <p className="text-[13px] text-[#555555] max-w-lg mx-auto mt-1.5">
          {error
            ? 'Não foi possível recuperar os detalhes deste registro.'
            : 'O produto solicitado não foi localizado ou não possui validação administrativa nesta base independente.'}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 text-[13px] font-semibold text-white bg-[#1351b4] hover:bg-[#0c3c8a] rounded-[3px] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Voltar à Consulta</span>
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium text-[#333333] bg-white hover:bg-[#f0f0f0] border border-[#cccccc] rounded-[3px] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Voltar aos Resultados</span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold text-white bg-[#1351b4] hover:bg-[#0c3c8a] rounded-[3px] cursor-pointer"
        >
          <Printer className="w-4 h-4" aria-hidden="true" />
          <span>Imprimir Comprovante</span>
        </button>
      </div>

      {/* Main Verification Certificate Panel */}
      <section className="border border-[#d8dde3] rounded-[3px] bg-white overflow-hidden hc-surface">
        <div className="bg-[#eef1f4] border-b border-[#d8dde3] py-3 px-5 flex flex-wrap items-center justify-between gap-2 hc-header-bar">
          <h2 className="text-[15px] font-bold text-[#333333]">
            Detalhes do Registro de Cosmético
          </h2>
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#1351b4]">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>Verificado pela Administração</span>
          </span>
        </div>

        <div className="p-5 space-y-5">
          {/* Status Verification Banner */}
          <StatusIndicator status={product.status} size="lg" />

          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 items-start">
            {/* Left Column: Product Image */}
            <div className="space-y-2.5">
              <ProductThumbnail
                productId={product.id}
                productName={product.productName}
                imageUrl={product.imageUrl}
                hasUploadedImage={product.hasUploadedImage}
                className="w-full h-[240px]"
              />
              <p className="text-[11px] text-[#666666] text-center">
                Imagem cadastrada para identificação do produto
              </p>
            </div>

            {/* Right Column: Official-style Specification Table */}
            <div className="border border-[#dee2e6] rounded-[3px] overflow-hidden">
              <table className="w-full text-[13px] border-collapse">
                <tbody className="divide-y divide-[#e9ecef]">
                  <tr>
                    <th className="w-[38%] py-2.5 px-3.5 bg-[#f8f9fa] text-left font-semibold text-[#333333] align-top">
                      Nome do Produto
                    </th>
                    <td className="py-2.5 px-3.5 font-semibold text-[#111111]">
                      {product.productName}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-2.5 px-3.5 bg-[#f8f9fa] text-left font-semibold text-[#333333] align-top">
                      Número do Registro
                    </th>
                    <td className="py-2.5 px-3.5 font-mono tabular-nums text-[#111111]">
                      {product.registrationNumber}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-2.5 px-3.5 bg-[#f8f9fa] text-left font-semibold text-[#333333] align-top">
                      Número SNB da Empresa
                    </th>
                    <td className="py-2.5 px-3.5 font-mono tabular-nums text-[#111111]">
                      {product.snbNumber}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-2.5 px-3.5 bg-[#f8f9fa] text-left font-semibold text-[#333333] align-top">
                      Número do Processo
                    </th>
                    <td className="py-2.5 px-3.5 font-mono tabular-nums text-[#111111]">
                      {product.processNumber}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-2.5 px-3.5 bg-[#f8f9fa] text-left font-semibold text-[#333333] align-top">
                      Empresa Fabricante
                    </th>
                    <td className="py-2.5 px-3.5 text-[#222222]">
                      {product.manufacturerName}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-2.5 px-3.5 bg-[#f8f9fa] text-left font-semibold text-[#333333] align-top">
                      País de Origem
                    </th>
                    <td className="py-2.5 px-3.5 text-[#222222]">
                      {product.originCountry}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-2.5 px-3.5 bg-[#f8f9fa] text-left font-semibold text-[#333333] align-top">
                      Data do Registro
                    </th>
                    <td className="py-2.5 px-3.5 tabular-nums text-[#222222]">
                      {formatDateBR(product.registrationDate)}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-2.5 px-3.5 bg-[#f8f9fa] text-left font-semibold text-[#333333] align-top">
                      Vencimento do Registro
                    </th>
                    <td className="py-2.5 px-3.5 tabular-nums text-[#222222]">
                      {formatDateBR(product.expirationDate)}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-2.5 px-3.5 bg-[#f8f9fa] text-left font-semibold text-[#333333] align-top">
                      Situação Atual do Registro
                    </th>
                    <td className="py-2.5 px-3.5">
                      <StatusIndicator status={product.status} size="sm" />
                    </td>
                  </tr>
                  <tr>
                    <th className="py-2.5 px-3.5 bg-[#f8f9fa] text-left font-semibold text-[#333333] align-top">
                      Descrição do Produto
                    </th>
                    <td className="py-2.5 px-3.5 text-[#333333] whitespace-pre-line leading-relaxed">
                      {product.description?.trim()
                        ? product.description
                        : 'Nenhuma descrição adicional informada.'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-[#e9ecef] text-[12px] text-[#555555]">
            <strong>Nota de Verificação:</strong> Os dados acima constam na base independente de
            verificação da BRCosméticos após inserção e conferência administrativa. Este
            comprovante não substitui documentos emitidos por órgãos governamentais oficiais.
          </div>
        </div>
      </section>
    </div>
  );
};
