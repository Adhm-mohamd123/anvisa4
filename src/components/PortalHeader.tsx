import React, { useState } from 'react';
import { Lock, Menu, X } from 'lucide-react';

export type AppRoute =
  | { name: 'home' }
  | { name: 'search' }
  | { name: 'details'; id: string }
  | { name: 'admin' }
  | { name: 'about' };

interface PortalHeaderProps {
  route: AppRoute;
  onNavigate: (hash: string) => void;
  highContrast: boolean;
  onToggleContrast: () => void;
  isAdminUser: boolean;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  route,
  onNavigate,
  highContrast,
  onToggleContrast,
  isAdminUser,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNav = (hash: string) => {
    setMobileMenuOpen(false);
    onNavigate(hash);
  };

  return (
    <header className="w-full no-print">
      {/* Slim top Brasil utility bar matching reference screenshot */}
      <div className="bg-[#f1f1f1] border-b border-[#dcdcdc] hc-surface">
        <div className="max-w-[1140px] mx-auto px-4 h-[34px] flex items-center justify-between gap-4 text-[11px] text-[#4a4a4a]">
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <svg
              width="20"
              height="14"
              viewBox="0 0 20 14"
              aria-hidden="true"
              className="rounded-[1px] border border-[#cfcfcf] shrink-0"
            >
              <rect width="20" height="14" fill="#009c3b" />
              <polygon points="10,1.6 18.2,7 10,12.4 1.8,7" fill="#ffdf00" />
              <circle cx="10" cy="7" r="3" fill="#002776" />
            </svg>
            <span className="font-bold tracking-wide text-[#4a4a4a]">BRASIL</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Desktop Navigation */}
            <nav
              aria-label="Navegação superior"
              className="hidden md:flex items-center gap-4 whitespace-nowrap"
            >
              <button
                type="button"
                onClick={() => onNavigate('#/sobre')}
                className="hover:text-[#1b4e9b] hover:underline cursor-pointer"
              >
                Acesso à informação
              </button>
              <button
                type="button"
                onClick={() => onNavigate('#/cosmeticos/registrados/')}
                className={`hover:text-[#1b4e9b] hover:underline cursor-pointer ${
                  route.name === 'search' || route.name === 'details'
                    ? 'text-[#1b4e9b] font-semibold'
                    : ''
                }`}
              >
                Cosméticos
              </button>
              <button
                type="button"
                onClick={() => onNavigate('#/admin')}
                className={`inline-flex items-center gap-1 hover:text-[#1b4e9b] hover:underline cursor-pointer ${
                  route.name === 'admin' ? 'text-[#1b4e9b] font-semibold' : ''
                }`}
              >
                <Lock className="w-3 h-3" aria-hidden="true" />
                <span>{isAdminUser ? 'Painel Admin' : 'Administração'}</span>
              </button>
            </nav>

            {/* Mobile Hamburger Button matching reference screenshot */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label="Abrir menu de navegação"
              className="md:hidden p-1 text-[#4a4a4a] hover:text-[#1b4e9b] cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>

            {/* Blue accessibility icon square matching reference screenshot */}
            <button
              type="button"
              onClick={onToggleContrast}
              title="Alternar Alto Contraste"
              aria-label="Alternar Alto Contraste"
              className="w-[22px] h-[22px] bg-[#1b5ca7] hover:bg-[#144782] text-white rounded-[2px] flex items-center justify-center cursor-pointer shrink-0"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                aria-hidden="true"
              >
                <circle cx="12" cy="5" r="2" />
                <path d="M5 9h14M12 9v6m0 0-3 6m3-6 3 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <nav
            aria-label="Menu móvel"
            className="md:hidden bg-white border-t border-[#dcdcdc] px-4 py-2.5 flex flex-col gap-2 text-[13px] font-medium"
          >
            <button
              type="button"
              onClick={() => handleMobileNav('#/')}
              className="text-left py-1 text-[#333333] hover:text-[#1b4e9b] cursor-pointer"
            >
              Início — Consultas
            </button>
            <button
              type="button"
              onClick={() => handleMobileNav('#/cosmeticos/registrados/')}
              className="text-left py-1 text-[#1b4e9b] font-semibold cursor-pointer"
            >
              Cosméticos - Produtos Regularizados
            </button>
            <button
              type="button"
              onClick={() => handleMobileNav('#/sobre')}
              className="text-left py-1 text-[#333333] hover:text-[#1b4e9b] cursor-pointer"
            >
              Sobre a Base Independente
            </button>
            <button
              type="button"
              onClick={() => handleMobileNav('#/admin')}
              className="text-left py-1 text-[#333333] hover:text-[#1b4e9b] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAdminUser ? 'Painel Admin' : 'Administração'}</span>
            </button>
          </nav>
        )}
      </div>

      {/* Main light cool-gray banner matching reference screenshot */}
      <div className="bg-[#eff1f4] border-b border-[#dde1e6] hc-banner">
        <div className="max-w-[1140px] mx-auto px-4 pt-2 pb-4">
          {/* Secondary utility row on right: ACESSIBILIDADE | ALTO CONTRASTE with dotted underline */}
          <div className="flex items-center justify-end gap-4 text-[10px] tracking-wide text-[#1b4e9b] uppercase mb-1">
            <div className="inline-flex items-center gap-3 pb-0.5 border-b border-dotted border-[#8ba8d1]">
              <button
                type="button"
                onClick={() => onNavigate('#/sobre')}
                className="hover:underline cursor-pointer"
              >
                Acessibilidade
              </button>
              <button
                type="button"
                onClick={onToggleContrast}
                aria-pressed={highContrast}
                className="hover:underline cursor-pointer"
              >
                Alto Contraste
              </button>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => onNavigate('#/')}
              className="text-left cursor-pointer group"
            >
              <h1 className="text-[28px] sm:text-[31px] font-bold tracking-tight text-[#1b5ca7] leading-none group-hover:underline">
                Consultas
              </h1>
            </button>
            <p className="text-[11px] sm:text-[12px] text-[#1b5ca7] uppercase tracking-wide mt-1.5">
             Anvisa - Agência Nacional de Vigilância Sanitária
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
