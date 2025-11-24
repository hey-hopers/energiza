
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types';
import { BellIcon, ChevronDownIcon } from '../icons/Icons';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDropdownOpen(false);
    onLogout();
  };

  return (
    <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div>
        <h1 className="text-2xl font-semibold text-secondary">EnergizaWeb</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button 
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          aria-label="Notificações"
        >
          <BellIcon />
        </button>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-lg p-1"
            aria-label="Menu do usuário"
            aria-expanded={isDropdownOpen}
          >
            <img className="h-10 w-10 rounded-full object-cover" src={user.avatarUrl} alt={user.name} />
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-secondary">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
              <div className="px-4 py-2 border-b border-gray-100 md:hidden">
                <p className="text-sm font-medium text-secondary">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsDropdownOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Meu Perfil
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
