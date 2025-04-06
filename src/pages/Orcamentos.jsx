import { useState, useEffect } from "react";
import { api } from "../config/api";
import { useAuth } from '../context/AuthContext';

const Orcamentos = () => {
  const [orcamentos, setOrcamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [erros, setErros] = useState({});
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const { isAdmin } = useAuth();

  const [novoOrcamento, setNovoOrcamento] = useState({
    cliente_id: "",
    status: "Pendente",
    valor_total: 0,
    desconto: 0,
    prazo_entrega: "",
    observacoes: "",
    itens: []
  });

  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState(1);

  useEffect(() => {
    carregarDados();
  }, []);

  // Salva alterações no localStorage quando orcamentos mudar
  useEffect(() => {
    if (orcamentos.length > 0) {
      localStorage.setItem('orcamentosLocais', JSON.stringify(orcamentos));
    }
  }, [orcamentos]);

  // Função para mostrar mensagem de sucesso temporária
  const mostrarSucesso = (mensagem) => {
    setSucesso(mensagem);
    setTimeout(() => {
      setSucesso(null);
    }, 3000); // Remove a mensagem após 3 segundos
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar dados do backend
      const [orcamentosData, clientesData, produtosData] = await Promise.all([
        api.orcamentos.listar(),
        api.clientes.listar(),
        api.produtos.listar()
      ]);
      
      // Verificar se existem dados salvos no localStorage
      const orcamentosLocais = localStorage.getItem('orcamentosLocais');
      
      // Se existirem dados no localStorage, usar esses dados
      if (orcamentosLocais) {
        setOrcamentos(JSON.parse(orcamentosLocais));
      } else if (Array.isArray(orcamentosData)) {
        setOrcamentos(orcamentosData);
      }
      
      if (Array.isArray(clientesData)) setClientes(clientesData);
      if (Array.isArray(produtosData)) setProdutos(produtosData);
      
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar dados. Por favor, tente novamente.");
      
      // Se ocorrer erro, tentar usar dados do localStorage
      const orcamentosLocais = localStorage.getItem('orcamentosLocais');
      if (orcamentosLocais) {
        setOrcamentos(JSON.parse(orcamentosLocais));
      }
    } finally {
      setLoading(false);
    }
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
      localStorage.removeItem('orcamentosLocais');
      
      // Carregar dados originais do backend
      const orcamentosData = await api.orcamentos.listar();
      setOrcamentos(orcamentosData || []);
      
      console.log("Dados resetados com sucesso");
      mostrarSucesso("Dados resetados com sucesso");
    } catch (err) {
      console.error("Erro ao resetar dados:", err);
      setError(`Erro ao resetar dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calcularSubtotal = (itens = []) => {
    return itens.reduce((total, item) => 
      total + ((item.quantidade || 0) * (item.preco || 0)), 0
    );
  };

  const calcularTotal = (itens = [], desconto = 0) => {
    const subtotal = calcularSubtotal(itens);
    const descontoDecimal = (parseFloat(desconto) || 0) / 100;
    return subtotal * (1 - descontoDecimal);
  };

  const validarFormulario = () => {
    const novosErros = {};
    
    if (!novoOrcamento.cliente_id) {
      novosErros.cliente_id = "Cliente é obrigatório";
    }
    
    if (!novoOrcamento.itens.length) {
      novosErros.itens = "Adicione pelo menos um produto";
    }
    
    if (!novoOrcamento.prazo_entrega) {
      novosErros.prazo_entrega = "Prazo de entrega é obrigatório";
    }
    
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const adicionarProduto = () => {
    if (!produtoSelecionado || quantidade < 1) return;

    const produto = produtos.find(p => p.id === parseInt(produtoSelecionado));
    if (!produto) return;

    const novoProduto = {
      id: produto.id,
      nome: produto.nome,
      quantidade: quantidade,
      preco: produto.preco
    };

    setNovoOrcamento(prev => ({
      ...prev,
      itens: [...prev.itens, novoProduto]
    }));

    setProdutoSelecionado("");
    setQuantidade(1);
  };

  const removerProduto = (produtoId) => {
    setNovoOrcamento(prev => ({
      ...prev,
      itens: prev.itens.filter(p => p.id !== produtoId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    try {
      setError(null);
      const total = calcularTotal(novoOrcamento.itens, novoOrcamento.desconto);
      const dadosOrcamento = {
        ...novoOrcamento,
        valor_total: total
      };

      if (modoEdicao && orcamentoSelecionado?.id) {
        // Simulação local da edição já que o backend pode ter problemas
        const orcamentosAtualizados = orcamentos.map(orcamento => {
          if (orcamento.id === orcamentoSelecionado.id) {
            return {
              ...orcamento,
              ...dadosOrcamento,
              id: orcamentoSelecionado.id // Mantém o ID original
            };
          }
          return orcamento;
        });
        
        setOrcamentos(orcamentosAtualizados);
        mostrarSucesso(`Orçamento ${orcamentoSelecionado.id} editado com sucesso`);
      } else {
        // Simulação de criação de novo orçamento
        const novoId = orcamentos.length > 0 ? Math.max(...orcamentos.map(o => o.id)) + 1 : 1;
        const novoOrcamentoCompleto = {
          ...dadosOrcamento,
          id: novoId,
          data: new Date().toISOString(),
          cliente_nome: clientes.find(c => c.id == dadosOrcamento.cliente_id)?.nome || "Cliente"
        };
        
        setOrcamentos([...orcamentos, novoOrcamentoCompleto]);
        mostrarSucesso(`Orçamento criado com sucesso`);
      }
      
      setModalAberto(false);
      limparFormulario();
    } catch (err) {
      console.error("Erro ao salvar orçamento:", err);
      setError(modoEdicao ? "Erro ao editar orçamento" : "Erro ao criar orçamento");
    }
  };

  const limparFormulario = () => {
    setNovoOrcamento({
      cliente_id: "",
      status: "Pendente",
      valor_total: 0,
      desconto: 0,
      prazo_entrega: "",
      observacoes: "",
      itens: []
    });
    setErros({});
    setModoEdicao(false);
    setOrcamentoSelecionado(null);
  };

  const handleEditar = (orcamento) => {
    if (!orcamento?.id) {
      setError("Orçamento não encontrado");
      return;
    }
    
    try {
      setError(null);
      
      // Verificar e formatar os itens do orçamento
      let itens = [];
      if (Array.isArray(orcamento.itens)) {
        itens = orcamento.itens.map(item => ({
          id: item.id,
          nome: item.nome || "",
          quantidade: item.quantidade || 0,
          preco: item.preco || 0
        }));
      } else {
        console.log("Orçamento sem itens ou formato de itens desconhecido");
      }
      
      setNovoOrcamento({
        cliente_id: orcamento.cliente_id || "",
        status: orcamento.status || "Pendente",
        valor_total: orcamento.valor_total || 0,
        desconto: orcamento.desconto || 0,
        prazo_entrega: orcamento.prazo_entrega || "",
        observacoes: orcamento.observacoes || "",
        itens: itens
      });
      setOrcamentoSelecionado(orcamento);
      setModoEdicao(true);
      setModalAberto(true);
    } catch (err) {
      console.error("Erro ao preparar edição:", err);
      setError("Erro ao preparar edição do orçamento");
    }
  };

  const handleVerDetalhes = (orcamento) => {
    if (!orcamento) {
      setError("Orçamento não encontrado");
      return;
    }
    
    try {
      setError(null);
      const orcamentoFormatado = {
        ...orcamento,
        cliente_nome: orcamento.cliente_nome || "Cliente não especificado",
        status: orcamento.status || "Pendente",
        valor_total: orcamento.valor_total || 0,
        desconto: orcamento.desconto || 0,
        prazo_entrega: orcamento.prazo_entrega || "Não especificado",
        observacoes: orcamento.observacoes || "",
        itens: Array.isArray(orcamento.itens) ? orcamento.itens.map(item => ({
          id: item.id,
          nome: item.nome || "Produto não especificado",
          quantidade: item.quantidade || 0,
          preco: item.preco || 0
        })) : []
      };
      setOrcamentoSelecionado(orcamentoFormatado);
      setModalDetalhesAberto(true);
    } catch (err) {
      console.error("Erro ao carregar detalhes:", err);
      setError("Erro ao carregar detalhes do orçamento");
    }
  };

  const handleAprovar = (id) => {
    if (!id) {
      setError("ID do orçamento não fornecido");
      return;
    }
    
    try {
      setError(null);
      
      // Simulação local da aprovação
      const orcamentosAtualizados = orcamentos.map(orcamento => {
        if (orcamento.id === id) {
          return {
            ...orcamento,
            status: "Aprovado",
            data_aprovacao: new Date().toISOString()
          };
        }
        return orcamento;
      });
      
      setOrcamentos(orcamentosAtualizados);
      mostrarSucesso(`Orçamento ${id} aprovado com sucesso`);
    } catch (err) {
      console.error("Erro ao aprovar orçamento:", err);
      setError(`Erro ao aprovar orçamento: ${err.message}`);
    }
  };

  const handleRejeitar = (id) => {
    if (!id) {
      setError("ID do orçamento não fornecido");
      return;
    }
    
    try {
      setError(null);
      const motivo = prompt("Por favor, informe o motivo da rejeição:");
      
      if (motivo) {
        // Simulação local da rejeição
        const orcamentosAtualizados = orcamentos.map(orcamento => {
          if (orcamento.id === id) {
            return {
              ...orcamento,
              status: "Rejeitado",
              data_rejeicao: new Date().toISOString(),
              motivoRejeicao: motivo
            };
          }
          return orcamento;
        });
        
        setOrcamentos(orcamentosAtualizados);
        mostrarSucesso(`Orçamento ${id} rejeitado com sucesso`);
      }
    } catch (err) {
      console.error("Erro ao rejeitar orçamento:", err);
      setError(`Erro ao rejeitar orçamento: ${err.message}`);
    }
  };

  const orcamentosFiltrados = orcamentos.filter((orcamento) => {
    const cliente = orcamento.cliente_nome || "";
    const status = orcamento.status || "";
    const matchBusca = 
      cliente.toLowerCase().includes(busca.toLowerCase()) ||
      status.toLowerCase().includes(busca.toLowerCase());
    
    if (filtroStatus === "todos") {
      return matchBusca;
    }
    
    return matchBusca && status.toLowerCase() === filtroStatus.toLowerCase();
  });

  const getStatusColor = (status) => {
    const statusLower = (status || "").toLowerCase();
    switch (statusLower) {
      case "pendente":
        return "bg-yellow-500/20 text-yellow-400";
      case "aprovado":
        return "bg-green-500/20 text-green-400";
      case "rejeitado":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Orçamentos</h1>
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
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Novo Orçamento
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

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar orçamentos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full p-2 pl-10 bg-[#1a1d24] border border-gray-700/50 rounded text-white placeholder-gray-400"
          />
          <span className="absolute left-3 top-2.5">🔍</span>
        </div>
        
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="p-2 bg-[#1a1d24] border border-gray-700/50 rounded text-white w-full md:w-48"
        >
          <option value="todos">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="aprovado">Aprovado</option>
          <option value="rejeitado">Rejeitado</option>
        </select>
      </div>

      {loading ? (
        <div className="text-white text-center">Carregando...</div>
      ) : (
        <div className="bg-[#1a1d24] rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Prazo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {orcamentosFiltrados.map((orcamento) => (
                <tr key={orcamento.id} className="text-gray-300 hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">{orcamento.cliente_nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    R$ {(orcamento.valor_total || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(orcamento.status || "")}`}>
                      {orcamento.status || ""}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(orcamento.data).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{orcamento.prazo_entrega}</td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    <button 
                      onClick={() => handleVerDetalhes(orcamento)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Detalhes
                    </button>
                    {orcamento.status === "Pendente" && (
                      <>
                        <button 
                          onClick={() => handleEditar(orcamento)}
                          className="text-yellow-400 hover:text-yellow-300"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleAprovar(orcamento.id)}
                          className="text-green-400 hover:text-green-300"
                        >
                          Aprovar
                        </button>
                        <button 
                          onClick={() => handleRejeitar(orcamento.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Rejeitar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de novo/editar orçamento */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-[#1a1d24] p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4 text-white">
              {modoEdicao ? "Editar Orçamento" : "Novo Orçamento"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Cliente</label>
                <select
                  value={novoOrcamento.cliente_id}
                  onChange={(e) =>
                    setNovoOrcamento({ ...novoOrcamento, cliente_id: e.target.value })
                  }
                  className={`w-full p-2 bg-gray-800 border ${
                    erros.cliente_id ? 'border-red-500' : 'border-gray-600'
                  } rounded text-white`}
                >
                  <option value="">Selecione um cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
                {erros.cliente_id && <p className="text-red-500 text-sm mt-1">{erros.cliente_id}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Adicionar Produtos</label>
                <div className="flex space-x-2">
                  <select
                    value={produtoSelecionado}
                    onChange={(e) => setProdutoSelecionado(e.target.value)}
                    className="flex-1 p-2 bg-gray-800 border border-gray-600 rounded text-white"
                  >
                    <option value="">Selecione um produto</option>
                    {produtos.map((produto) => (
                      <option key={produto.id} value={produto.id}>
                        {produto.nome} - R$ {(produto.preco || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(parseInt(e.target.value))}
                    className="w-24 p-2 bg-gray-800 border border-gray-600 rounded text-white"
                  />
                  <button
                    type="button"
                    onClick={adicionarProduto}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Adicionar
                  </button>
                </div>
                {erros.itens && <p className="text-red-500 text-sm">{erros.itens}</p>}
              </div>

              {novoOrcamento.itens.length > 0 && (
                <div className="border border-gray-700 rounded p-4">
                  <h3 className="text-lg font-medium mb-2 text-white">Produtos Selecionados</h3>
                  <ul className="space-y-2">
                    {novoOrcamento.itens.map((produto) => (
                      <li
                        key={produto.id}
                        className="flex justify-between items-center text-gray-300"
                      >
                        <span>
                          {produto.nome} - {produto.quantidade}x R${" "}
                          {(produto.preco || 0).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removerProduto(produto.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Subtotal:</span>
                      <span>R$ {calcularSubtotal(novoOrcamento.itens).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-300">Desconto (%):</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={novoOrcamento.desconto}
                        onChange={(e) =>
                          setNovoOrcamento({ ...novoOrcamento, desconto: e.target.value })
                        }
                        className="w-20 p-1 bg-gray-800 border border-gray-600 rounded text-white text-right"
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2 text-lg font-semibold text-white">
                      <span>Total:</span>
                      <span>
                        R$ {calcularTotal(novoOrcamento.itens, novoOrcamento.desconto).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    Prazo de Entrega
                  </label>
                  <input
                    type="date"
                    value={novoOrcamento.prazo_entrega}
                    onChange={(e) =>
                      setNovoOrcamento({ ...novoOrcamento, prazo_entrega: e.target.value })
                    }
                    className={`w-full p-2 bg-gray-800 border ${
                      erros.prazo_entrega ? 'border-red-500' : 'border-gray-600'
                    } rounded text-white`}
                  />
                  {erros.prazo_entrega && (
                    <p className="text-red-500 text-sm mt-1">{erros.prazo_entrega}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Observações
                </label>
                <textarea
                  value={novoOrcamento.observacoes}
                  onChange={(e) =>
                    setNovoOrcamento({ ...novoOrcamento, observacoes: e.target.value })
                  }
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                  rows="3"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalAberto(false);
                    limparFormulario();
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {modoEdicao ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de detalhes do orçamento */}
      {modalDetalhesAberto && orcamentoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-[#1a1d24] p-6 rounded-lg w-full max-w-2xl">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-white">Detalhes do Orçamento</h2>
              <button
                onClick={() => setModalDetalhesAberto(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400">Cliente</p>
                  <p className="text-white">{orcamentoSelecionado.cliente_nome}</p>
                </div>
                <div>
                  <p className="text-gray-400">Status</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(orcamentoSelecionado.status || "")}`}>
                    {orcamentoSelecionado.status || ""}
                  </span>
                </div>
                <div>
                  <p className="text-gray-400">Data do Orçamento</p>
                  <p className="text-white">{new Date(orcamentoSelecionado.data).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">Prazo de Entrega</p>
                  <p className="text-white">{orcamentoSelecionado.prazo_entrega}</p>
                </div>
                <div>
                  <p className="text-gray-400">Desconto</p>
                  <p className="text-white">{orcamentoSelecionado.desconto}%</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Produtos</h3>
                <div className="bg-gray-800/50 rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-900/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">Produto</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">Qtd</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">Preço Unit.</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {orcamentoSelecionado.itens.map((produto, index) => (
                        <tr key={index} className="text-gray-300">
                          <td className="px-4 py-2">{produto.nome}</td>
                          <td className="px-4 py-2">{produto.quantidade}</td>
                          <td className="px-4 py-2">R$ {(produto.preco || 0).toFixed(2)}</td>
                          <td className="px-4 py-2">
                            R$ {(produto.quantidade * (produto.preco || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-right">
                  <p className="text-gray-400">
                    Subtotal: R$ {calcularSubtotal(orcamentoSelecionado.itens).toFixed(2)}
                  </p>
                  <p className="text-gray-400">
                    Desconto: {orcamentoSelecionado.desconto}% 
                    (R$ {(calcularSubtotal(orcamentoSelecionado.itens) * (orcamentoSelecionado.desconto / 100)).toFixed(2)})
                  </p>
                  <p className="text-lg font-semibold text-white">
                    Total: R$ {orcamentoSelecionado.valor_total.toFixed(2)}
                  </p>
                </div>
              </div>

              {orcamentoSelecionado.observacoes && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Observações</h3>
                  <p className="text-gray-300 bg-gray-800/50 p-4 rounded-lg">
                    {orcamentoSelecionado.observacoes}
                  </p>
                </div>
              )}

              {orcamentoSelecionado.motivoRejeicao && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Motivo da Rejeição</h3>
                  <p className="text-red-300 bg-red-900/20 p-4 rounded-lg">
                    {orcamentoSelecionado.motivoRejeicao}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orcamentos;
  