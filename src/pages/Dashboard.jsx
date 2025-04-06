import { useState, useEffect } from "react";
import { api } from "../config/api";
import {
  FaUsers,
  FaBox,
  FaFileInvoiceDollar,
  FaShoppingCart,
  FaChartLine,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaStar,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [periodoSelecionado, setPeriodoSelecionado] = useState("hoje");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estatisticas, setEstatisticas] = useState({
    hoje: {
      clientes: 0,
      produtos: 0,
      orcamentos: 0,
      vendas: 0,
      faturamento: 0,
      taxaCrescimento: 0,
    },
    semana: {
      clientes: 0,
      produtos: 0,
      orcamentos: 0,
      vendas: 0,
      faturamento: 0,
      taxaCrescimento: 0,
    },
    mes: {
      clientes: 0,
      produtos: 0,
      orcamentos: 0,
      vendas: 0,
      faturamento: 0,
      taxaCrescimento: 0,
    },
  });
  const [atividadesRecentes, setAtividadesRecentes] = useState([]);
  
  // Novos estados
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState([]);
  const [clientesAtivos, setClientesAtivos] = useState([]);
  const [dadosGrafico, setDadosGrafico] = useState([]);

  const { isAdmin } = useAuth();

  // Função para carregar dados da API
  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar dados da API
      const [clientes, produtos, orcamentos, vendas] = await Promise.all([
        api.clientes.listar(),
        api.produtos.listar(),
        api.orcamentos.listar(),
        api.vendas.listar()
      ]);
      
      // Calcular estatísticas
      const hoje = new Date();
      const umaSemanaAtras = new Date(hoje);
      umaSemanaAtras.setDate(hoje.getDate() - 7);
      const umMesAtras = new Date(hoje);
      umMesAtras.setMonth(hoje.getMonth() - 1);
      
      // Filtrar por período
      const vendasHoje = vendas.filter(venda => 
        new Date(venda.data).toDateString() === hoje.toDateString()
      );
      
      const vendasSemana = vendas.filter(venda => 
        new Date(venda.data) >= umaSemanaAtras
      );
      
      const vendasMes = vendas.filter(venda => 
        new Date(venda.data) >= umMesAtras
      );
      
      // Calcular faturamentos
      const faturamentoHoje = vendasHoje.reduce((total, venda) => 
        total + (venda.valor_total || 0), 0
      );
      
      const faturamentoSemana = vendasSemana.reduce((total, venda) => 
        total + (venda.valor_total || 0), 0
      );
      
      const faturamentoMes = vendasMes.reduce((total, venda) => 
        total + (venda.valor_total || 0), 0
      );
      
      // Atualizar estatísticas
      setEstatisticas({
        hoje: {
          clientes: clientes.length,
          produtos: produtos.length,
          orcamentos: orcamentos.length,
          vendas: vendasHoje.length,
          faturamento: faturamentoHoje,
          taxaCrescimento: 15, // Valor estático por enquanto
        },
        semana: {
          clientes: clientes.length,
          produtos: produtos.length,
          orcamentos: orcamentos.length,
          vendas: vendasSemana.length,
          faturamento: faturamentoSemana,
          taxaCrescimento: 22, // Valor estático por enquanto
        },
        mes: {
          clientes: clientes.length,
          produtos: produtos.length,
          orcamentos: orcamentos.length,
          vendas: vendasMes.length,
          faturamento: faturamentoMes,
          taxaCrescimento: 28, // Valor estático por enquanto
        },
      });
      
      // Gerar atividades recentes
      const todasAtividades = [
        ...vendas.map(venda => ({
          id: `venda-${venda.id}`,
          tipo: "venda",
          descricao: `Venda ${venda.status || 'Pendente'} para ${venda.cliente_nome || 'Cliente'}`,
          valor: venda.valor_total || 0,
          data: venda.data || new Date().toISOString(),
          dataObj: new Date(venda.data || new Date())
        })),
        ...orcamentos.map(orcamento => ({
          id: `orcamento-${orcamento.id}`,
          tipo: "orcamento",
          descricao: `Orçamento ${orcamento.status || 'Pendente'} para ${orcamento.cliente_nome || 'Cliente'}`,
          valor: orcamento.valor_total || 0,
          data: orcamento.data || new Date().toISOString(),
          dataObj: new Date(orcamento.data || new Date())
        }))
      ];
      
      // Ordenar atividades por data (mais recentes primeiro)
      const atividadesOrdenadas = todasAtividades
        .sort((a, b) => b.dataObj - a.dataObj)
        .slice(0, 5) // Limitar a 5 atividades
        .map(atividade => ({
          ...atividade,
          data: formatarData(atividade.data)
        }));
      
      setAtividadesRecentes(atividadesOrdenadas);
      
      // Produtos com baixo estoque (menos de 5 unidades)
      const produtosComBaixoEstoque = produtos
        .filter(produto => produto.estoque !== undefined && produto.estoque <= 5)
        .sort((a, b) => a.estoque - b.estoque)
        .slice(0, 5);
      
      setProdutosBaixoEstoque(produtosComBaixoEstoque);
      
      // Clientes mais ativos (com mais vendas/orçamentos)
      const contagemPorCliente = {};
      
      // Contar vendas por cliente
      vendas.forEach(venda => {
        const clienteId = venda.cliente_id;
        const clienteNome = venda.cliente_nome || 'Cliente sem nome';
        
        if (!contagemPorCliente[clienteId]) {
          contagemPorCliente[clienteId] = {
            id: clienteId,
            nome: clienteNome,
            vendas: 0,
            orcamentos: 0,
            valorTotal: 0
          };
        }
        
        contagemPorCliente[clienteId].vendas += 1;
        contagemPorCliente[clienteId].valorTotal += (venda.valor_total || 0);
      });
      
      // Contar orçamentos por cliente
      orcamentos.forEach(orcamento => {
        const clienteId = orcamento.cliente_id;
        const clienteNome = orcamento.cliente_nome || 'Cliente sem nome';
        
        if (!contagemPorCliente[clienteId]) {
          contagemPorCliente[clienteId] = {
            id: clienteId,
            nome: clienteNome,
            vendas: 0,
            orcamentos: 0,
            valorTotal: 0
          };
        }
        
        contagemPorCliente[clienteId].orcamentos += 1;
      });
      
      // Converter para array e ordenar por número de vendas
      const clientesOrdenados = Object.values(contagemPorCliente)
        .sort((a, b) => b.vendas - a.vendas || b.orcamentos - a.orcamentos)
        .slice(0, 5);
      
      setClientesAtivos(clientesOrdenados);
      
      // Dados para o gráfico simplificado de vendas dos últimos 7 dias
      const ultimos7Dias = [];
      for (let i = 6; i >= 0; i--) {
        const data = new Date();
        data.setDate(data.getDate() - i);
        ultimos7Dias.push({
          dia: data.toLocaleDateString('pt-BR', { weekday: 'short' }),
          data: data,
          vendas: 0,
          valor: 0
        });
      }
      
      // Preencher com dados reais
      vendas.forEach(venda => {
        const dataVenda = new Date(venda.data);
        ultimos7Dias.forEach(item => {
          if (dataVenda.toDateString() === item.data.toDateString()) {
            item.vendas += 1;
            item.valor += (venda.valor_total || 0);
          }
        });
      });
      
      setDadosGrafico(ultimos7Dias);
      
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
      setError("Erro ao carregar dados. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };
  
  // Formatar data para exibição
  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Formatar moeda
  const formatarMoeda = (valor) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    carregarDados();
  }, []);

  const dados = estatisticas[periodoSelecionado];
  
  // Calcula o valor máximo para o gráfico
  const maxVendas = Math.max(...dadosGrafico.map(dia => dia.vendas), 1);

  const handleResetarDados = async () => {
    if (!isAdmin()) {
      setError("Apenas administradores podem resetar os dados");
      return;
    }
    
    await carregarDados();
  };

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex space-x-4">
          {isAdmin() && (
            <button 
              onClick={handleResetarDados}
              className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Resetar Dados
            </button>
          )}
          <select
            value={periodoSelecionado}
            onChange={(e) => setPeriodoSelecionado(e.target.value)}
            className="p-2 bg-[#1a1d24] border border-gray-700/50 rounded text-white"
          >
            <option value="hoje">Hoje</option>
            <option value="semana">Última Semana</option>
            <option value="mes">Último Mês</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-white text-center">
            <p className="text-xl">Carregando dados...</p>
            <p className="text-gray-400 mt-2">Por favor, aguarde...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Card - Clientes */}
            <div className="bg-[#1a1d24] p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Clientes</p>
                  <p className="text-2xl font-semibold text-white">{dados.clientes}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <FaUsers className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </div>

            {/* Card - Produtos */}
            <div className="bg-[#1a1d24] p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Produtos</p>
                  <p className="text-2xl font-semibold text-white">{dados.produtos}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-full">
                  <FaBox className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </div>

            {/* Card - Orçamentos */}
            <div className="bg-[#1a1d24] p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Orçamentos</p>
                  <p className="text-2xl font-semibold text-white">{dados.orcamentos}</p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-full">
                  <FaFileInvoiceDollar className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Card - Vendas */}
            <div className="bg-[#1a1d24] p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Vendas</p>
                  <p className="text-2xl font-semibold text-white">{dados.vendas}</p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-full">
                  <FaShoppingCart className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Card - Faturamento */}
            <div className="bg-[#1a1d24] p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-medium text-white mb-4">Faturamento</h3>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold text-white">
                  {dados.faturamento.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </p>
                <div className="flex items-center">
                  {dados.taxaCrescimento > 0 ? (
                    <FaArrowUp className="text-green-500 mr-1" />
                  ) : (
                    <FaArrowDown className="text-red-500 mr-1" />
                  )}
                  <span className={`${dados.taxaCrescimento > 0 ? "text-green-500" : "text-red-500"}`}>
                    {Math.abs(dados.taxaCrescimento)}%
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                {periodoSelecionado === "hoje" ? "Hoje" : 
                  periodoSelecionado === "semana" ? "Últimos 7 dias" : "Últimos 30 dias"}
              </p>
            </div>

            {/* Card - Produtos com baixo estoque */}
            <div className="bg-[#1a1d24] p-6 rounded-lg shadow-lg col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Produtos com baixo estoque</h3>
                <div className="p-2 bg-amber-500/10 rounded-full">
                  <FaExclamationTriangle className="h-5 w-5 text-amber-500" />
                </div>
              </div>
              {produtosBaixoEstoque.length > 0 ? (
                <div className="space-y-3">
                  {produtosBaixoEstoque.map(produto => (
                    <div key={produto.id} className="flex justify-between items-center border-b border-gray-700 pb-2">
                      <div className="flex-1">
                        <p className="text-white font-medium truncate">{produto.nome}</p>
                        <p className="text-gray-400 text-sm">ID: {produto.id}</p>
                      </div>
                      <div className="ml-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          produto.estoque === 0 
                            ? "bg-red-900 text-red-300" 
                            : produto.estoque <= 3
                            ? "bg-amber-900 text-amber-300"
                            : "bg-yellow-900 text-yellow-300"
                        }`}>
                          {produto.estoque} un
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">Todos os produtos estão com estoque adequado.</p>
              )}
            </div>

            {/* Card - Clientes mais ativos */}
            <div className="bg-[#1a1d24] p-6 rounded-lg shadow-lg col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Clientes mais ativos</h3>
                <div className="p-2 bg-blue-500/10 rounded-full">
                  <FaStar className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              {clientesAtivos.length > 0 ? (
                <div className="space-y-3">
                  {clientesAtivos.map(cliente => (
                    <div key={cliente.id} className="flex justify-between items-center border-b border-gray-700 pb-2">
                      <div className="flex-1">
                        <p className="text-white font-medium truncate">{cliente.nome}</p>
                        <div className="flex text-gray-400 text-sm">
                          <span className="mr-3">{cliente.vendas} vendas</span>
                          <span>{cliente.orcamentos} orçamentos</span>
                        </div>
                      </div>
                      <div className="ml-4 text-sm text-white">
                        {formatarMoeda(cliente.valorTotal)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">Nenhum cliente ativo encontrado.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Card - Gráfico de Vendas */}
            <div className="bg-[#1a1d24] p-6 rounded-lg shadow-lg col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-white">Vendas dos últimos 7 dias</h3>
                <div className="p-2 bg-indigo-500/10 rounded-full">
                  <FaChartLine className="h-5 w-5 text-indigo-500" />
                </div>
              </div>
              <div className="h-64 flex items-end justify-between space-x-2">
                {dadosGrafico.map((dia, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="w-full">
                      <div 
                        className="bg-indigo-600 hover:bg-indigo-500 rounded-t transition-all"
                        style={{ height: `${(dia.vendas / maxVendas) * 180}px`, minHeight: dia.vendas > 0 ? '20px' : '4px' }}
                        title={`${dia.vendas} vendas - ${formatarMoeda(dia.valor)}`}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2 uppercase">{dia.dia}</div>
                    <div className="text-xs font-medium text-white">{dia.vendas}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card - Atividades Recentes */}
            <div className="bg-[#1a1d24] p-6 rounded-lg shadow-lg col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Atividades Recentes</h3>
                <div className="p-2 bg-emerald-500/10 rounded-full">
                  <FaCalendarAlt className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
              {atividadesRecentes.length > 0 ? (
                <div className="space-y-4">
                  {atividadesRecentes.map((atividade) => (
                    <div key={atividade.id} className="border-b border-gray-700 pb-3">
                      <div className="flex justify-between items-start">
                        <p className="text-white">{atividade.descricao}</p>
                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                          atividade.tipo === "venda" 
                            ? "bg-green-900 text-green-300" 
                            : "bg-blue-900 text-blue-300"
                        }`}>
                          {atividade.tipo === "venda" ? "Venda" : "Orçamento"}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-400 text-sm">{atividade.data}</span>
                        <span className="text-white font-medium">
                          {atividade.valor.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">Nenhuma atividade recente encontrada.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
  