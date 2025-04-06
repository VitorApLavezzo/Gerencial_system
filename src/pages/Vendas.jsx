import { useState, useEffect } from "react";
import { api } from "../config/api";
import { useAuth } from '../context/AuthContext';

const Vendas = () => {
  const [vendas, setVendas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sucesso, setSucesso] = useState(null);

  const [novaVenda, setNovaVenda] = useState({
    cliente_id: "",
    status: "Pendente",
    valor_total: 0,
    desconto: 0,
    forma_pagamento: "",
    parcelas: 1,
    observacoes: "",
    itens: []
  });

  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [erros, setErros] = useState({});

  const { isAdmin } = useAuth();

  useEffect(() => {
    carregarDados();
  }, []);

  // Salva alterações no localStorage quando vendas mudar
  useEffect(() => {
    if (vendas.length > 0) {
      localStorage.setItem('vendasLocais', JSON.stringify(vendas));
    }
  }, [vendas]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Carregar dados do backend
      const [vendasData, clientesData, produtosData] = await Promise.all([
        api.vendas.listar(),
        api.clientes.listar(),
        api.produtos.listar()
      ]);
      
      // Verificar se existem dados salvos no localStorage
      const vendasLocais = localStorage.getItem('vendasLocais');
      
      // Se existirem dados no localStorage, usar esses dados
      if (vendasLocais) {
        setVendas(JSON.parse(vendasLocais));
      } else {
        setVendas(vendasData || []);
      }
      
      setClientes(clientesData || []);
      setProdutos(produtosData || []);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError(`Erro ao carregar dados: ${err.message}`);
      
      // Se ocorrer erro, tentar usar dados do localStorage
      const vendasLocais = localStorage.getItem('vendasLocais');
      if (vendasLocais) {
        setVendas(JSON.parse(vendasLocais));
      }
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
    
    if (!novaVenda.cliente_id) {
      novosErros.cliente_id = "Cliente é obrigatório";
    }
    
    if (!novaVenda.itens.length) {
      novosErros.itens = "Adicione pelo menos um produto";
    }
    
    if (!novaVenda.forma_pagamento) {
      novosErros.forma_pagamento = "Forma de pagamento é obrigatória";
    }
    
    if (novaVenda.forma_pagamento === "Cartão de Crédito" && (!novaVenda.parcelas || novaVenda.parcelas < 1)) {
      novosErros.parcelas = "Número de parcelas inválido";
    }
    
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const limparFormulario = () => {
    setNovaVenda({
      cliente_id: "",
      status: "Pendente",
      valor_total: 0,
      desconto: 0,
      forma_pagamento: "",
      parcelas: 1,
      observacoes: "",
      itens: []
    });
    setProdutoSelecionado("");
    setQuantidade(1);
    setErros({});
    setModoEdicao(false);
    setVendaSelecionada(null);
  };

  // Função para mostrar mensagem de sucesso temporária
  const mostrarSucesso = (mensagem) => {
    setSucesso(mensagem);
    setTimeout(() => {
      setSucesso(null);
    }, 3000); // Remove a mensagem após 3 segundos
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    try {
      setError(null);
      const dadosVenda = {
        ...novaVenda,
        valor_total: calcularTotal(novaVenda.itens, novaVenda.desconto)
      };

      if (modoEdicao && vendaSelecionada?.id) {
        // Simulação local da edição já que o backend não suporta
        const vendasAtualizadas = vendas.map(venda => {
          if (venda.id === vendaSelecionada.id) {
            return {
              ...venda,
              ...dadosVenda,
              id: vendaSelecionada.id // Mantém o ID original
            };
          }
          return venda;
        });
        
        setVendas(vendasAtualizadas);
        console.log(`Venda ${vendaSelecionada.id} editada com sucesso (simulação local)`);
        mostrarSucesso(`Venda ${vendaSelecionada.id} editada com sucesso`);
      } else {
        // Simulação de criação de nova venda
        const novoId = vendas.length > 0 ? Math.max(...vendas.map(v => v.id)) + 1 : 1;
        const novaVendaCompleta = {
          ...dadosVenda,
          id: novoId,
          data: new Date().toISOString(),
          cliente_nome: clientes.find(c => c.id == dadosVenda.cliente_id)?.nome
        };
        
        setVendas([...vendas, novaVendaCompleta]);
        console.log(`Nova venda criada com ID ${novoId} (simulação local)`);
        mostrarSucesso(`Venda criada com sucesso`);
      }
      
      setModalAberto(false);
      limparFormulario();
    } catch (err) {
      console.error("Erro ao salvar venda:", err);
      setError(modoEdicao ? "Erro ao editar venda" : "Erro ao criar venda");
    }
  };

  const handleEditar = (venda) => {
    if (!venda?.id) {
      setError("Venda não encontrada");
      return;
    }
    
    try {
      setError(null);
      
      // Obter os itens da venda, se disponíveis
      let itens = [];
      if (Array.isArray(venda.itens)) {
        itens = venda.itens.map(item => ({
          id: item.id,
          nome: item.nome || "",
          quantidade: item.quantidade || 0,
          preco: item.preco || 0
        }));
      } else {
        // Se não houver itens, deixamos a lista vazia
        console.log("Venda sem itens ou formato de itens desconhecido");
      }
      
      setNovaVenda({
        cliente_id: venda.cliente_id || "",
        status: venda.status || "Pendente",
        valor_total: venda.valor_total || 0,
        desconto: venda.desconto || 0,
        forma_pagamento: venda.forma_pagamento || "",
        parcelas: venda.parcelas || 1,
        observacoes: venda.observacoes || "",
        itens: itens
      });
      
      setVendaSelecionada(venda);
      setModoEdicao(true);
      setModalAberto(true);
    } catch (err) {
      console.error("Erro ao preparar edição:", err);
      setError("Erro ao preparar edição da venda");
    }
  };

  const handleVerDetalhes = (venda) => {
    if (!venda) {
      setError("Venda não encontrada");
      return;
    }
    
    try {
      setError(null);
      const vendaFormatada = {
        ...venda,
        cliente_nome: venda.cliente_nome || "Cliente não especificado",
        status: venda.status || "Pendente",
        valor_total: venda.valor_total || 0,
        desconto: venda.desconto || 0,
        forma_pagamento: venda.forma_pagamento || "Não especificada",
        parcelas: venda.parcelas || 1,
        observacoes: venda.observacoes || "",
        itens: Array.isArray(venda.itens) ? venda.itens.map(item => ({
          id: item.id,
          nome: item.nome || "Produto não especificado",
          quantidade: item.quantidade || 0,
          preco: item.preco || 0
        })) : []
      };
      setVendaSelecionada(vendaFormatada);
      setModalDetalhesAberto(true);
    } catch (err) {
      console.error("Erro ao carregar detalhes:", err);
      setError("Erro ao carregar detalhes da venda");
    }
  };

  const handleFinalizar = async (id) => {
    if (!id) {
      setError("ID da venda não fornecido");
      return;
    }
    
    try {
      setError(null);
      
      // Simulação local da atualização já que o backend não suporta
      const vendasAtualizadas = vendas.map(venda => {
        if (venda.id === id) {
          return {
            ...venda,
            status: "Concluída",
            data_conclusao: new Date().toISOString()
          };
        }
        return venda;
      });
      
      setVendas(vendasAtualizadas);
      
      // Exibir mensagem de sucesso
      console.log(`Venda ${id} finalizada com sucesso (simulação local)`);
      mostrarSucesso(`Venda ${id} finalizada com sucesso`);
    } catch (err) {
      console.error("Erro ao finalizar venda:", err);
      setError(`Erro ao finalizar venda: ${err.message}`);
    }
  };

  const handleCancelar = async (id) => {
    if (!id) {
      setError("ID da venda não fornecido");
      return;
    }
    
    try {
      setError(null);
      
      // Simulação local da atualização já que o backend não suporta
      const vendasAtualizadas = vendas.map(venda => {
        if (venda.id === id) {
          return {
            ...venda,
            status: "Cancelada",
            data_cancelamento: new Date().toISOString()
          };
        }
        return venda;
      });
      
      setVendas(vendasAtualizadas);
      
      // Exibir mensagem de sucesso
      console.log(`Venda ${id} cancelada com sucesso (simulação local)`);
      mostrarSucesso(`Venda ${id} cancelada com sucesso`);
    } catch (err) {
      console.error("Erro ao cancelar venda:", err);
      setError(`Erro ao cancelar venda: ${err.message}`);
    }
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

    setNovaVenda(prev => ({
      ...prev,
      itens: [...prev.itens, novoProduto]
    }));

    setProdutoSelecionado("");
    setQuantidade(1);
  };

  const removerProduto = (produtoId) => {
    setNovaVenda(prev => ({
      ...prev,
      itens: prev.itens.filter(p => p.id !== produtoId)
    }));
  };

  const vendasFiltradas = vendas.filter(venda => {
    const clienteNome = (venda.cliente_nome || "").toLowerCase();
    const status = (venda.status || "").toLowerCase();
    const termoBusca = busca.toLowerCase();
    
    return clienteNome.includes(termoBusca) || status.includes(termoBusca);
  });

  const getStatusColor = (status) => {
    const statusLower = (status || "").toLowerCase();
    switch (statusLower) {
      case "pendente":
        return "bg-yellow-500/20 text-yellow-400";
      case "concluída":
        return "bg-green-500/20 text-green-400";
      case "cancelada":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
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
      localStorage.removeItem('vendasLocais');
      
      // Carregar dados originais do backend
      const vendasData = await api.vendas.listar();
      setVendas(vendasData || []);
      
      console.log("Dados resetados com sucesso");
      mostrarSucesso("Dados resetados com sucesso");
    } catch (err) {
      console.error("Erro ao resetar dados:", err);
      setError(`Erro ao resetar dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Vendas</h1>
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
            Nova Venda
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
            placeholder="Buscar vendas..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full p-2 pl-10 bg-[#1a1d24] border border-gray-700/50 rounded text-white placeholder-gray-400"
          />
          <span className="absolute left-3 top-2.5">🔍</span>
        </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Forma de Pagamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {vendasFiltradas.map((venda) => (
                <tr key={venda.id} className="text-gray-300 hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">{venda.cliente_nome || ""}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    R$ {(venda.valor_total || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{venda.forma_pagamento || ""}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(venda.status || "")}`}>
                      {venda.status || ""}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{venda.data ? new Date(venda.data).toLocaleDateString() : ""}</td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    <button 
                      onClick={() => handleVerDetalhes(venda)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Detalhes
                    </button>
                    {venda.status === "Pendente" && (
                      <>
                        <button 
                          onClick={() => handleEditar(venda)}
                          className="text-yellow-400 hover:text-yellow-300"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleFinalizar(venda.id)}
                          className="text-green-400 hover:text-green-300"
                        >
                          Finalizar
                        </button>
                        <button 
                          onClick={() => handleCancelar(venda.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Cancelar
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

      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div 
            className="bg-[#1a1d24] p-6 rounded-lg w-full max-w-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setModalAberto(false);
                limparFormulario();
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-300"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4 text-white pr-8">
              {modoEdicao ? "Editar Venda" : "Nova Venda"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Cliente</label>
                <select
                  value={novaVenda.cliente_id}
                  onChange={(e) =>
                    setNovaVenda({ ...novaVenda, cliente_id: e.target.value })
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
                        {produto.nome} - R$ {produto.preco.toFixed(2)}
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

              {novaVenda.itens.length > 0 && (
                <div className="border border-gray-700 rounded p-4">
                  <h3 className="text-lg font-medium mb-2 text-white">Produtos Selecionados</h3>
                  <ul className="space-y-2">
                    {novaVenda.itens.map((produto) => (
                      <li
                        key={produto.id}
                        className="flex justify-between items-center text-gray-300"
                      >
                        <span>
                          {produto.nome} - {produto.quantidade}x R${" "}
                          {produto.preco.toFixed(2)}
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
                      <span>R$ {calcularSubtotal(novaVenda.itens).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-300">Desconto (%):</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={novaVenda.desconto}
                        onChange={(e) =>
                          setNovaVenda({ ...novaVenda, desconto: e.target.value })
                        }
                        className="w-20 p-1 bg-gray-800 border border-gray-600 rounded text-white text-right"
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2 text-lg font-semibold text-white">
                      <span>Total:</span>
                      <span>
                        R$ {(calcularSubtotal(novaVenda.itens) * (1 - (novaVenda.desconto / 100))).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    Forma de Pagamento
                  </label>
                  <select
                    value={novaVenda.forma_pagamento}
                    onChange={(e) =>
                      setNovaVenda({ ...novaVenda, forma_pagamento: e.target.value })
                    }
                    className={`w-full p-2 bg-gray-800 border ${
                      erros.forma_pagamento ? 'border-red-500' : 'border-gray-600'
                    } rounded text-white`}
                  >
                    <option value="">Selecione...</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="PIX">PIX</option>
                    <option value="Transferência">Transferência</option>
                  </select>
                  {erros.forma_pagamento && (
                    <p className="text-red-500 text-sm mt-1">{erros.forma_pagamento}</p>
                  )}
                </div>

                {novaVenda.forma_pagamento === "Cartão de Crédito" && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">
                      Parcelas
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={novaVenda.parcelas}
                      onChange={(e) =>
                        setNovaVenda({ ...novaVenda, parcelas: parseInt(e.target.value) })
                      }
                      className={`w-full p-2 bg-gray-800 border ${
                        erros.parcelas ? 'border-red-500' : 'border-gray-600'
                      } rounded text-white`}
                    />
                    {erros.parcelas && (
                      <p className="text-red-500 text-sm mt-1">{erros.parcelas}</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Observações
                </label>
                <textarea
                  value={novaVenda.observacoes}
                  onChange={(e) =>
                    setNovaVenda({ ...novaVenda, observacoes: e.target.value })
                  }
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {modoEdicao ? "Salvar Alterações" : "Criar Venda"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de detalhes da venda */}
      {modalDetalhesAberto && vendaSelecionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div 
            className="bg-[#1a1d24] p-6 rounded-lg w-full max-w-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setModalDetalhesAberto(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-300"
            >
              ✕
            </button>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-white">Detalhes da Venda</h2>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400">Cliente</p>
                  <p className="text-white">{vendaSelecionada.cliente_nome || ""}</p>
                </div>
                <div>
                  <p className="text-gray-400">Status</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(vendaSelecionada.status || "")}`}>
                    {vendaSelecionada.status || ""}
                  </span>
                </div>
                <div>
                  <p className="text-gray-400">Data da Venda</p>
                  <p className="text-white">{vendaSelecionada.data ? new Date(vendaSelecionada.data).toLocaleDateString() : ""}</p>
                </div>
                <div>
                  <p className="text-gray-400">Forma de Pagamento</p>
                  <p className="text-white">{vendaSelecionada.forma_pagamento || ""}</p>
                </div>
                {vendaSelecionada.forma_pagamento === "Cartão de Crédito" && (
                  <div>
                    <p className="text-gray-400">Parcelas</p>
                    <p className="text-white">{vendaSelecionada.parcelas}x</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-400">Desconto</p>
                  <p className="text-white">{vendaSelecionada.desconto || 0}%</p>
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
                      {vendaSelecionada.itens && vendaSelecionada.itens.map((produto, index) => (
                        <tr key={index} className="text-gray-300">
                          <td className="px-4 py-2">{produto.nome || ""}</td>
                          <td className="px-4 py-2">{produto.quantidade || 0}</td>
                          <td className="px-4 py-2">R$ {(produto.preco || 0).toFixed(2)}</td>
                          <td className="px-4 py-2">
                            R$ {((produto.quantidade || 0) * (produto.preco || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-right">
                  <p className="text-gray-400">
                    Subtotal: R$ {calcularSubtotal(vendaSelecionada.itens || []).toFixed(2)}
                  </p>
                  <p className="text-gray-400">
                    Desconto: {vendaSelecionada.desconto || 0}% 
                    (R$ {(calcularSubtotal(vendaSelecionada.itens || []) * ((vendaSelecionada.desconto || 0) / 100)).toFixed(2)})
                  </p>
                  <p className="text-lg font-semibold text-white">
                    Total: R$ {(vendaSelecionada.valor_total || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {vendaSelecionada.observacoes && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Observações</h3>
                  <p className="text-gray-300 bg-gray-800/50 p-4 rounded-lg">
                    {vendaSelecionada.observacoes || ""}
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

export default Vendas;