import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Hammer, Settings, FileText, Scroll, ShoppingCart, ArrowUpRight, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Cerrar sidebar al navegar
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Panel' },
    { path: '/compras', icon: <ShoppingCart size={20} />, label: 'Compras' },
    { path: '/salidas', icon: <ArrowUpRight size={20} />, label: 'Salidas / Consumos' },
    { path: '/inventario', icon: <Package size={20} />, label: 'Inventario' },
    { path: '/configuracion', icon: <Settings size={20} />, label: 'Configuracion' },
    { path: '/recetas', icon: <Scroll size={20} />, label: 'Recetas' },
    { path: '/produccion', icon: <Hammer size={20} />, label: 'Produccion' },
    { path: '/reportes', icon: <FileText size={20} />, label: 'Informes' },
  ];

  return (
    <>
      {/* Botón Hamburguesa — solo visible en móvil */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-[#0f172a] text-white p-2.5 rounded-lg shadow-lg"
      >
        <Menu size={22} />
      </button>

      {/* Backdrop oscuro — solo móvil cuando está abierto */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`h-screen w-64 bg-[#0f172a] text-slate-300 fixed left-0 top-0 shadow-xl z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>

        {/* Botón cerrar — solo móvil */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white md:hidden"
        >
          <X size={20} />
        </button>

        {/* HEADER LOGO */}
        <div className="p-6">
          <h1 className="text-xl font-extrabold text-[#3b82f6] leading-tight">
            Celestial <br /> Servicios
          </h1>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Gestion de Produccion</p>
        </div>

        {/* MENU */}
        <nav className="mt-2 flex-1 space-y-1 px-3 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm ${isActive
                  ? 'bg-[#2563eb] text-white shadow-md shadow-blue-900/20'
                  : 'hover:bg-slate-800 hover:text-white'
                  }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT + FOOTER */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all cursor-pointer"
          >
            <LogOut size={18} />
            <span>Cerrar Sesion</span>
          </button>
          <p className="text-xs text-slate-600 text-center">v0.0.4 - Celestial Dev</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
