import React from 'react';

interface PortalFooterProps {
  onNavigate: (hash: string) => void;
}

export const PortalFooter: React.FC<PortalFooterProps> = ({ onNavigate }) => {
  return (
    <footer className="mt-10 no-print">
      {/* Reference-style bottom informational links block */}
      <div className="max-w-[1140px] mx-auto pb-6 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
        <ul className="space-y-1.5 text-[13px] text-[#495057] list-disc pl-5">
          <li>
            
            {' '}
            <button
              type="button"
              onClick={() => onNavigate('#/sobre')}
              className="text-[#1351b4] hover:underline font-medium cursor-pointer"
            >
             
            </button>
            
          </li>
          <li>
            ,{' '}
            <button
              type="button"
              onClick={() => onNavigate('#/admin')}
              className="text-[#1351b4] hover:underline font-medium cursor-pointer"
            >
              
            </button>
            
          </li>
        </ul>
      </div>

      {/* Institutional dark navy footer bar */}
      <div className="bg-[#071d41] text-white border-t border-[#0c326f] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] hc-surface">
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
