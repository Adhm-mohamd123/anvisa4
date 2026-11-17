import React from 'react';

interface PortalFooterProps {
  onNavigate: (hash: string) => void;
}

export const PortalFooter: React.FC<PortalFooterProps> = ({ onNavigate }) => {
  return (
    <footer className="mt-10 no-print">
      {/* Reference-style bottom informational links block */}
      <div className="max-w-[1140px] mx-auto px-4 pb-6">
        <ul className="space-y-1.5 text-[13px] text-[#495057] list-disc pl-5">
          <li>
            Base de dados independente para verificação de registros de cosméticos inseridos e
            validados pela administração.{' '}
            <button
              type="button"
              onClick={() => onNavigate('#/sobre')}
              className="text-[#1351b4] hover:underline font-medium cursor-pointer"
            >
              Saiba mais sobre os critérios de verificação
            </button>
            .
          </li>
          <li>
            Para cadastrar novos produtos, atualizar situações ou importar/exportar registros,{' '}
            <button
              type="button"
              onClick={() => onNavigate('#/admin')}
              className="text-[#1351b4] hover:underline font-medium cursor-pointer"
            >
              acesse o Painel Administrativo protegido
            </button>
            .
          </li>
        </ul>
      </div>

      {/* Institutional dark navy footer bar */}
      <div className="bg-[#071d41] text-white border-t border-[#0c326f] hc-surface">
        <div className="max-w-[1140px] mx-auto px-4 py-4 flex flex-wrap items-center justify-end gap-5 text-[12px] text-[#e2e8f0]">
          <button
            type="button"
            onClick={() => onNavigate('#/')}
            className="hover:underline cursor-pointer whitespace-nowrap"
          >
            Portal de Consultas
          </button>
          <button
            type="button"
            onClick={() => onNavigate('#/cosmeticos/registrados/')}
            className="hover:underline cursor-pointer whitespace-nowrap"
          >
            Consultar Cosméticos
          </button>
          <button
            type="button"
            onClick={() => onNavigate('#/admin')}
            className="hover:underline cursor-pointer whitespace-nowrap"
          >
            Painel Administrativo
          </button>
        </div>
      </div>
    </footer>
  );
};
