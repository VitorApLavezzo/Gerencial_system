import { useState, useEffect } from "react";
import InputMask from "react-input-mask";
import { api } from "../config/api";
import { useAuth } from '../context/AuthContext';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [erros, setErros] = useState({});
  const [novoCliente, setNovoCliente] = useState({
    nome: "",
    email: "",
    telefone: "",
    endereco: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    carregarClientes();
  }, []);

  // Salva alterações no localStorage quando clientes mudar
  useEffect(() => {
    // Sempre salvar o array de clientes, mesmo quando vazio
    localStorage.setItem('clientesLocais', JSON.stringify(clientes));
  }, [clientes]);

  // Função para mostrar mensagem de sucesso temporária
  const mostrarSucesso = (mensagem) => {
    setSucesso(mensagem);
    setTimeout(() => {
      setSucesso(null);
    }, 3000); // Remove a mensagem após 3 segundos
  };

  const handleResetarDados = async () => {
    // Verificar se o usuário é administrador
    if (!isAdmin()) {
      setError("Apenas administradores podem resetar os dados");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Remover dados do localStorage
      localStorage.removeItem('clientesLocais');
      
      // Carregar dados originais do backend
      const data = await api.clientes.listar();
      setClientes(data);
      
      console.log("Dados resetados com sucesso");
      mostrarSucesso("Dados resetados com sucesso");
    } catch (err) {
      console.error("Erro ao resetar dados:", err);
      setError(`Erro ao resetar dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const carregarClientes = async () => {
    try {
      setLoading(true);
      
      // Carregar dados do backend
      const data = await api.clientes.listar();
      
      // Verificar se existem dados salvos no localStorage
      const clientesLocais = localStorage.getItem('clientesLocais');
      
      // Se existirem dados no localStorage, usar esses dados
      if (clientesLocais) {
        setClientes(JSON.parse(clientesLocais));
      } else {
        setClientes(data);
      }
      
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
      setError("Erro ao carregar clientes");
      
      // Se ocorrer erro, tentar usar dados do localStorage
      const clientesLocais = localStorage.getItem('clientesLocais');
      if (clientesLocais) {
        setClientes(JSON.parse(clientesLocais));
      }
    } finally {
      setLoading(false);
    }
  };

  const validarFormulario = () => {
    const novosErros = {};
    
    if (!novoCliente.nome.trim()) {
      novosErros.nome = "Nome é obrigatório";
    }
    
    if (!novoCliente.email.trim()) {
      novosErros.email = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(novoCliente.email)) {
      novosErros.email = "Email inválido";
    }
    
    if (!novoCliente.telefone.replace(/[^0-9]/g, "").length) {
      novosErros.telefone = "Telefone é obrigatório";
    }
    
    if (!novoCliente.endereco.trim()) {
      novosErros.endereco = "Endereço é obrigatório";
    }
    
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    try {
      setError(null);
      
      // Preparar o cliente com valores formatados
      const clienteFormatado = {
        nome: novoCliente.nome.trim(),
        email: novoCliente.email.trim(),
        telefone: novoCliente.telefone,
        endereco: novoCliente.endereco.trim(),
      };
      
      if (modoEdicao && clienteSelecionado?.id) {
        // Simulação local da edição já que o backend pode ter problemas
        const clientesAtualizados = clientes.map(cliente => {
          if (cliente.id === clienteSelecionado.id) {
            return {
              ...cliente,
              ...clienteFormatado,
              id: clienteSelecionado.id // Mantém o ID original
            };
          }
          return cliente;
        });
        
        setClientes(clientesAtualizados);
        mostrarSucesso(`Cliente "${clienteFormatado.nome}" editado com sucesso!`);
      } else {
        // Simulação de criação de novo cliente
        const novoId = clientes.length > 0 ? Math.max(...clientes.map(c => c.id)) + 1 : 1;
        const novoClienteCompleto = {
          ...clienteFormatado,
          id: novoId,
          data_cadastro: new Date().toISOString()
        };
        
        setClientes([...clientes, novoClienteCompleto]);
        mostrarSucesso(`Cliente "${clienteFormatado.nome}" criado com sucesso!`);
      }
      
      setModalAberto(false);
      limparFormulario();
    } catch (err) {
      console.error("Erro ao salvar cliente:", err);
      setError(modoEdicao ? "Erro ao editar cliente" : "Erro ao criar cliente");
    }
  };

  const limparFormulario = () => {
    setNovoCliente({
      nome: "",
      email: "",
      telefone: "",
      endereco: ""
    });
    setErros({});
    setModoEdicao(false);
    setClienteSelecionado(null);
  };

  const handleEditar = (cliente) => {
    setNovoCliente({
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      endereco: cliente.endereco,
    });
    setClienteSelecionado(cliente);
    setModoEdicao(true);
    setModalAberto(true);
  };

  const handleExcluir = async (id) => {
    if (window.confirm(
      "Tem certeza que deseja excluir este cliente?\n\n" +
      "O cliente será removido do cadastro, mas continuará disponível nas vendas e orçamentos existentes.\n\n" +
      "Esta ação não pode ser desfeita."
    )) {
      try {
        setError(null);
        
        // Guardar o nome antes de excluir
        const nomeCliente = clientes.find(c => c.id === id)?.nome || "Cliente";
        
        // Implementar exclusão local
        const clientesAtualizados = clientes.filter(cliente => cliente.id !== id);
        setClientes(clientesAtualizados);
        
        // Cliente excluído com sucesso
        mostrarSucesso(`Cliente "${nomeCliente}" excluído com sucesso!`);
      } catch (err) {
        console.error("Erro ao excluir cliente:", err);
        setError(`Erro ao excluir cliente: ${err.message || ""}`);
      }
    }
  };

  const handleVerDetalhes = (cliente) => {
    setClienteSelecionado(cliente);
    setModalDetalhesAberto(true);
  };

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
    cliente.email.toLowerCase().includes(busca.toLowerCase()) ||
    cliente.telefone.includes(busca)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <div className="space-x-2">
          {isAdmin() && (
            <button
              onClick={handleResetarDados}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              title="Reiniciar dados originais do backend"
            >
              Resetar Dados
            </button>
          )}
          <button
            onClick={() => {
              limparFormulario();
              setModalAberto(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Novo Cliente
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {sucesso && (
        <div className="bg-green-500/20 border border-green-500 text-green-400 p-4 rounded-lg">
          {sucesso}
        </div>
      )}

      <div className="bg-slate-800 p-4 rounded-lg shadow mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar clientes por nome, email ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full p-2 rounded bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-300">Carregando clientes...</p>
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-300">
            {busca === ""
              ? "Nenhum cliente cadastrado."
              : "Nenhum cliente encontrado com os filtros atuais."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-slate-800 rounded-lg overflow-hidden">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Telefone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Data de Cadastro</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-slate-700 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-medium text-white">{cliente.nome}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-300">{cliente.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-300">{cliente.telefone}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                    {new Date(cliente.data_cadastro).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                    <button 
                      onClick={() => handleVerDetalhes(cliente)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Detalhes
                    </button>
                    <button 
                      onClick={() => handleEditar(cliente)}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleExcluir(cliente.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white">
                {modoEdicao ? "Editar Cliente" : "Novo Cliente"}
              </h3>
              <button
                onClick={() => {
                  setModalAberto(false);
                  limparFormulario();
                }}
                className="text-gray-400 hover:text-gray-200 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Nome</label>
                <input
                  type="text"
                  value={novoCliente.nome}
                  onChange={(e) =>
                    setNovoCliente(prev => ({ ...prev, nome: e.target.value }))
                  }
                  className={`w-full p-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 ${
                    erros.nome ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                  }`}
                />
                {erros.nome && <p className="text-red-500 text-xs">{erros.nome}</p>}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Email</label>
                <input
                  type="email"
                  value={novoCliente.email}
                  onChange={(e) =>
                    setNovoCliente(prev => ({ ...prev, email: e.target.value }))
                  }
                  className={`w-full p-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 ${
                    erros.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                  }`}
                />
                {erros.email && <p className="text-red-500 text-xs">{erros.email}</p>}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Telefone</label>
                <InputMask
                  mask="(99) 99999-9999"
                  value={novoCliente.telefone}
                  onChange={(e) =>
                    setNovoCliente(prev => ({ ...prev, telefone: e.target.value }))
                  }
                  className={`w-full p-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 ${
                    erros.telefone ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                  }`}
                />
                {erros.telefone && <p className="text-red-500 text-xs">{erros.telefone}</p>}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Endereço</label>
                <input
                  type="text"
                  value={novoCliente.endereco}
                  onChange={(e) =>
                    setNovoCliente(prev => ({ ...prev, endereco: e.target.value }))
                  }
                  className={`w-full p-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 ${
                    erros.endereco ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                  }`}
                />
                {erros.endereco && <p className="text-red-500 text-xs">{erros.endereco}</p>}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalAberto(false);
                    limparFormulario();
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  {modoEdicao ? "Salvar Alterações" : "Criar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalDetalhesAberto && clienteSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg shadow-lg max-w-lg w-full">
            <div className="flex justify-between items-center p-4 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white">
                Detalhes do Cliente
              </h3>
              <button
                onClick={() => setModalDetalhesAberto(false)}
                className="text-gray-400 hover:text-gray-200 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm text-gray-400">Nome</h4>
                  <p className="text-lg font-semibold text-white">{clienteSelecionado.nome}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-400">Email</h4>
                  <p className="text-white">{clienteSelecionado.email}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-400">Telefone</h4>
                  <p className="text-white">{clienteSelecionado.telefone}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-400">Endereço</h4>
                  <p className="text-white">{clienteSelecionado.endereco}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-400">Data de Cadastro</h4>
                  <p className="text-white">
                    {new Date(clienteSelecionado.data_cadastro).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-700 p-4 flex justify-end">
              <button
                onClick={() => setModalDetalhesAberto(false)}
                className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-500 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;
