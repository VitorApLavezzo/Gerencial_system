import { useState } from 'react';
import { FaCog, FaDatabase, FaUserShield, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Configuracoes = () => {
  const { currentUser, isAdmin } = useAuth();
  const [mensagem, setMensagem] = useState(null);
  const [confirmacaoAberta, setConfirmacaoAberta] = useState(false);
  const [acaoConfirmacao, setAcaoConfirmacao] = useState(null);
  
  const mostrarMensagem = (tipo, texto) => {
    setMensagem({ tipo, texto });
    setTimeout(() => setMensagem(null), 5000);
  };
  
  const confirmarAcao = (acao) => {
    setAcaoConfirmacao(acao);
    setConfirmacaoAberta(true);
  };
  
  const resetarDados = () => {
    try {
      // Confirmar se é administrador
      if (!isAdmin()) {
        mostrarMensagem('erro', 'Apenas administradores podem realizar esta ação.');
        return;
      }
      
      // Resetar dados do localStorage (exceto usuários)
      localStorage.removeItem('clientes');
      localStorage.removeItem('produtos');
      localStorage.removeItem('orcamentos');
      localStorage.removeItem('vendas');
      
      mostrarMensagem('sucesso', 'Dados do sistema resetados com sucesso!');
    } catch (error) {
      console.error('Erro ao resetar dados:', error);
      mostrarMensagem('erro', 'Ocorreu um erro ao resetar os dados.');
    } finally {
      setConfirmacaoAberta(false);
    }
  };
  
  const resetarTodosDados = () => {
    try {
      // Confirmar se é administrador
      if (!isAdmin()) {
        mostrarMensagem('erro', 'Apenas administradores podem realizar esta ação.');
        return;
      }
      
      // Guardar usuário atual
      const userAtual = localStorage.getItem('currentUser');
      
      // Limpar todo o localStorage
      localStorage.clear();
      
      // Restaurar usuário atual
      localStorage.setItem('currentUser', userAtual);
      
      // Restaurar lista básica de usuários
      const usuarioAtual = JSON.parse(userAtual);
      localStorage.setItem('users', JSON.stringify([usuarioAtual]));
      
      mostrarMensagem('sucesso', 'Todos os dados do sistema foram resetados com sucesso!');
    } catch (error) {
      console.error('Erro ao resetar todos os dados:', error);
      mostrarMensagem('erro', 'Ocorreu um erro ao resetar todos os dados.');
    } finally {
      setConfirmacaoAberta(false);
    }
  };
  
  return (
    <div className="bg-[#1a1d24] rounded-lg p-6 shadow-lg">
      <div className="flex items-center mb-6">
        <FaCog className="text-blue-500 text-2xl mr-2" />
        <h1 className="text-2xl font-bold text-white">Configurações do Sistema</h1>
      </div>
      
      {mensagem && (
        <div className={`mb-6 p-4 rounded-lg border ${
          mensagem.tipo === 'sucesso' 
            ? 'bg-green-500/20 border-green-500 text-green-400' 
            : 'bg-red-500/20 border-red-500 text-red-400'
        }`}>
          {mensagem.tipo === 'sucesso' ? <FaCheck className="inline mr-2" /> : <FaExclamationTriangle className="inline mr-2" />}
          {mensagem.texto}
        </div>
      )}
      
      <div className="space-y-6">
        <div className="border-b border-gray-700 pb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <FaUserShield className="text-blue-500 mr-2" />
            Informações do Usuário
          </h2>
          
          <div className="bg-[#12151c] p-4 rounded-lg">
            <div className="flex items-center space-x-4 mb-4">
              {currentUser?.picture ? (
                <img 
                  src={currentUser.picture} 
                  alt="Foto do perfil" 
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-medium">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
              )}
              
              <div>
                <h3 className="text-white font-medium">{currentUser?.name}</h3>
                <p className="text-gray-400 text-sm">{currentUser?.email}</p>
                <div className="mt-1">
                  {isAdmin() ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500">
                      Administrador
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500">
                      Usuário
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm">
              Cadastrado em: {new Date(currentUser?.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        
        {isAdmin() && (
          <div className="border-b border-gray-700 pb-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <FaDatabase className="text-blue-500 mr-2" />
              Gerenciamento de Dados
            </h2>
            
            <div className="space-y-4">
              <div className="bg-[#12151c] p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2">Resetar Dados do Sistema</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Esta ação irá limpar todos os dados de clientes, produtos, orçamentos e vendas.
                  Os dados de usuários serão mantidos.
                </p>
                <button
                  onClick={() => confirmarAcao('resetar')}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                  Resetar Dados
                </button>
              </div>
              
              <div className="bg-[#12151c] p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2">Resetar Todos os Dados</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Esta ação irá limpar TODOS os dados do sistema, incluindo usuários (exceto o seu).
                  Use com extrema cautela!
                </p>
                <button
                  onClick={() => confirmarAcao('resetarTodos')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Resetar Tudo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de confirmação */}
      {confirmacaoAberta && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-[#1a1d24] p-6 rounded-lg max-w-md w-full">
              <h3 className="text-xl font-semibold text-white mb-4">Confirmar Ação</h3>
              <p className="text-gray-300 mb-6">
                {acaoConfirmacao === 'resetar'
                  ? 'Tem certeza que deseja resetar os dados do sistema? Esta ação não pode ser desfeita.'
                  : 'Tem certeza que deseja resetar TODOS os dados do sistema? Esta ação é extremamente destrutiva e não pode ser desfeita.'}
              </p>
              <div className="flex space-x-4 justify-end">
                <button
                  onClick={() => setConfirmacaoAberta(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={acaoConfirmacao === 'resetar' ? resetarDados : resetarTodosDados}
                  className={`px-4 py-2 ${
                    acaoConfirmacao === 'resetar'
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white rounded-lg transition-colors`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Configuracoes; 