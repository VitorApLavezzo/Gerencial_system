import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';

const PerfilUsuario = () => {
  const { currentUser, logout } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };
  
  // Fechar o menu quando clicar fora dele
  useEffect(() => {
    const handleClickFora = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAberto(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickFora);
    return () => {
      document.removeEventListener('mousedown', handleClickFora);
    };
  }, []);
  
  const primeiraLetraNome = currentUser?.name?.charAt(0) || 'U';
  
  return (
    <div className="relative w-full" ref={menuRef}>
      <button
        onClick={() => setMenuAberto(!menuAberto)}
        className="flex items-center w-full space-x-2 p-2 rounded-lg hover:bg-gray-700/30 transition-colors"
      >
        {currentUser?.picture ? (
          <img 
            src={currentUser.picture} 
            alt="Foto do perfil" 
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
            {primeiraLetraNome}
          </div>
        )}
        <span className="text-sm text-white truncate flex-1">
          {currentUser?.name || 'Usuário'}
        </span>
      </button>
      
      {menuAberto && (
        <div className="absolute left-0 bottom-full mb-2 w-48 bg-[#1a1d24] rounded-lg shadow-lg py-1 z-50 border border-gray-700/50">
          <div className="px-4 py-3 border-b border-gray-700/50">
            <p className="text-sm text-white font-medium truncate">{currentUser?.name}</p>
            <p className="text-xs text-gray-400 truncate">{currentUser?.email}</p>
          </div>
          
          <div className="py-1">
            <button
              onClick={() => {
                setMenuAberto(false);
                navigate('/configuracoes');
              }}
              className="w-full px-4 py-2 text-sm text-white hover:bg-gray-700/30 flex items-center"
            >
              <FaCog className="mr-2 text-gray-400" />
              Configurações
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-white hover:bg-gray-700/30 flex items-center"
            >
              <FaSignOutAlt className="mr-2 text-gray-400" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerfilUsuario; 