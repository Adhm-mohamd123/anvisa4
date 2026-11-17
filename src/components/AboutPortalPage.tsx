import React from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';

interface AboutPortalPageProps {
  onBack: () => void;
}

export const AboutPortalPage: React.FC<AboutPortalPageProps> = ({ onBack }) => {
  return (
    <div className="space-y-5">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium text-[#333333] bg-white hover:bg-[#f0f0f0] border border-[#cccccc] rounded-[3px] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Voltar ao Portal de Consultas</span>
        </button>
      </div>

      <section className="border border-[#d8dde3] rounded-[3px] bg-white overflow-hidden hc-surface">
        <div className="bg-[#eef1f4] border-b border-[#d8dde3] py-2.5 px-4 hc-header-bar">
          <h2 className="text-[14px] font-bold text-[#333333]">
            Sobre a Base Independente de Verificação de Cosméticos
          </h2>
        </div>

        <div className="p-6 space-y-5 text-[13px] text-[#333333] leading-relaxed">
          <div className="flex items-start gap-3 p-4 bg-[#f8f9fa] border border-[#dee2e6] rounded-[3px]">
            <ShieldCheck className="w-5 h-5 text-[#1351b4] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-[#222222] text-[14px]">
                Independência e Transparência dos Dados
              </h3>
              <p className="mt-1 text-[#444444]">
                O portal <strong>BRCosméticos</strong> é um sistema independente para consulta e
                verificação de registros de produtos cosméticos. Esta plataforma não possui
                vínculo institucional, operacional ou governamental com a ANVISA ou com órgãos do
                Governo Federal do Brasil. Todos os registros exibidos nas consultas públicas foram
                inseridos e validados exclusivamente pela administração desta base de dados.
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-[#222222] text-[14px] mb-2.5">
              Significado das Situações de Registro
            </h3>
            <div className="space-y-2.5">
              <div className="p-3 border border-[#dee2e6] rounded-[3px] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <StatusIndicator status="valid" size="sm" />
                <span className="text-[#444444]">
                  Indica que o produto foi cadastrado pela administração com prazo de validade
                  vigente e situação regular na base.
                </span>
              </div>
              <div className="p-3 border border-[#dee2e6] rounded-[3px] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <StatusIndicator status="expired" size="sm" />
                <span className="text-[#444444]">
                  Indica que o prazo de vigência do registro expirou e aguarda renovação ou
                  atualização administrativa.
                </span>
              </div>
              <div className="p-3 border border-[#dee2e6] rounded-[3px] flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <StatusIndicator status="suspended" size="sm" />
                <span className="text-[#444444]">
                  Indica que o registro foi suspenso temporariamente pela administração.
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-[#222222] text-[14px] mb-1.5">
              Critérios Suportados na Consulta Pública
            </h3>
            <p className="text-[#444444]">
              Os usuários podem verificar produtos utilizando o <strong>Nome do Produto</strong>,{' '}
              <strong>Número do Registro</strong>, <strong>Código SNB da Empresa</strong> (com
              identificação automática do fabricante), <strong>Número do Processo</strong> e{' '}
              <strong>Período de Vencimento</strong>. Caso um item não seja localizado, o sistema
              informa explicitamente que ele não consta como registrado na base verificada.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
