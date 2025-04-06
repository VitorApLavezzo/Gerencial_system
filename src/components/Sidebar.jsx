import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaBox,
  FaFileInvoiceDollar,
  FaShoppingCart,
  FaBars,
  FaTimes,
  FaTags
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import PerfilUsuario from "./PerfilUsuario";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: "/", icon: FaHome, label: "Dashboard" },
    { path: "/clientes", icon: FaUsers, label: "Clientes" },
    { path: "/produtos", icon: FaBox, label: "Produtos" },
    { path: "/categorias", icon: FaTags, label: "Categorias" },
    { path: "/orcamentos", icon: FaFileInvoiceDollar, label: "Orçamentos" },
    { path: "/vendas", icon: FaShoppingCart, label: "Vendas" },
  ];

  return (
    <>
      {/* Botão do menu mobile */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-[#1a1d24] text-white shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative w-64 h-screen overflow-y-auto bg-[#1a1d24] z-45 transform transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 font-bold text-xl border-b border-gray-700/50 text-white">
            Criartes
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded transition-colors ${
                  isActive(item.path)
                    ? "bg-gray-700/30 text-white"
                    : "text-gray-400 hover:bg-gray-700/30 hover:text-white"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-700/50">
            <PerfilUsuario />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
