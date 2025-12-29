
import React from 'react';
import { Page } from '../../App';
import { DashboardIcon, BusinessIcon, AccountIcon, BoltIcon, SystemIcon } from '../icons/Icons';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const NavLink: React.FC<{
  page: Page;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  icon: React.ReactNode;
  label: string;
}> = ({ page, currentPage, setCurrentPage, icon, label }) => {
  const isActive = currentPage === page;
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        setCurrentPage(page);
      }}
      className={`flex items-center px-4 py-3 my-1 text-sm font-medium rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-primary-500 text-white shadow-lg'
          : 'text-gray-300 hover:bg-primary-700 hover:text-white'
      }`}
    >
      {icon}
      <span className="ml-4">{label}</span>
    </a>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  return (
    <div className="hidden md:flex flex-col w-64 bg-secondary">
      <div className="flex items-center justify-center h-20 border-b border-gray-700">
        <BoltIcon className="w-8 h-8 text-primary-400" />
        <span className="text-white text-2xl font-bold ml-2">Energiza</span>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <nav>
          <NavLink page="dashboard" currentPage={currentPage} setCurrentPage={setCurrentPage} icon={<DashboardIcon />} label="Dashboard" />
          <NavLink page="my-business" currentPage={currentPage} setCurrentPage={setCurrentPage} icon={<BusinessIcon />} label="Meu Negócio" />
          <NavLink page="account" currentPage={currentPage} setCurrentPage={setCurrentPage} icon={<AccountIcon />} label="Minha Conta" />
          <div className="my-4 border-t border-gray-700"></div>
          <NavLink page="system" currentPage={currentPage} setCurrentPage={setCurrentPage} icon={<SystemIcon />} label="Sistema" />
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
