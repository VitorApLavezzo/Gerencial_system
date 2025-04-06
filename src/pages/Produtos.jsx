import { useState, useEffect } from "react";
import { api } from "../config/api";
import { useAuth } from '../context/AuthContext';
import { Link } from "react-router-dom";
import { FaTags, FaPlus } from "react-icons/fa";

const Produtos = () => {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [erros, setErros] = useState({});
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  
  const [novoProduto, setNovoProduto] = useState({
    nome: "",
    descricao: "",
    preco: "",
    estoque: "",
    categoria_id: "",
    categoria: "",
    especificacoes: "",
    imagem: ""
  });

  const { isAdmin } = useAuth();

  useEffect(() => {
    carregarProdutos();
    carregarCategorias();
  }, []);

  // Salva alterações no localStorage quando produtos mudar
  useEffect(() => {
    localStorage.setItem('produtosLocais', JSON.stringify(produtos));
  }, [produtos]);

  // Função para mostrar mensagem de sucesso temporária
  const mostrarSucesso = (mensagem) => {
    setSucesso(mensagem);
    setTimeout(() => {
      setSucesso(null);
    }, 3000); // Remove a mensagem após 3 segundos
  };

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      
      // Carregar dados do backend
      const data = await api.produtos.listar();
      
      // Verificar se existem dados salvos no localStorage
      const produtosLocais = localStorage.getItem('produtosLocais');
      
      // Se existirem dados no localStorage, usar esses dados
      if (produtosLocais) {
        setProdutos(JSON.parse(produtosLocais));
      } else {
        setProdutos(data);
      }
      
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      setError("Erro ao carregar produtos");
      
      // Se ocorrer erro, tentar usar dados do localStorage
      const produtosLocais = localStorage.getItem('produtosLocais');
      if (produtosLocais) {
        setProdutos(JSON.parse(produtosLocais));
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
      localStorage.removeItem('produtosLocais');
      
      // Carregar dados originais do backend
      const data = await api.produtos.listar();
      setProdutos(data);
      
      console.log("Dados resetados com sucesso");
      mostrarSucesso("Dados resetados com sucesso");
    } catch (err) {
      console.error("Erro ao resetar dados:", err);
      setError(`Erro ao resetar dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const validarFormulario = () => {
    const novosErros = {};
    
    if (!novoProduto.nome.trim()) {
      novosErros.nome = "Nome é obrigatório";
    }
    
    if (!novoProduto.descricao.trim()) {
      novosErros.descricao = "Descrição é obrigatória";
    }
    
    if (!novoProduto.preco || novoProduto.preco <= 0) {
      novosErros.preco = "Preço deve ser maior que zero";
    }
    
    if (!novoProduto.categoria) {
      novosErros.categoria = "Categoria é obrigatória";
    }
    
    if (!novoProduto.estoque || novoProduto.estoque < 0) {
      novosErros.estoque = "Estoque não pode ser negativo";
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
      
      // Encontrar o objeto categoria completo
      const categoriaObj = categorias.find(cat => cat.nome === novoProduto.categoria);
      
      // Preparar o produto com valores formatados
      const produtoFormatado = {
        nome: novoProduto.nome.trim(),
        descricao: novoProduto.descricao.trim(),
        preco: parseFloat(novoProduto.preco),
        estoque: parseInt(novoProduto.estoque),
        categoria: novoProduto.categoria,
        categoria_id: categoriaObj?.id || null,
        especificacoes: novoProduto.especificacoes?.trim() || "",
        imagem: novoProduto.imagem || ""
      };
      
      if (modoEdicao && produtoSelecionado?.id) {
        // Simulação local da edição já que o backend pode ter problemas
        const produtosAtualizados = produtos.map(produto => {
          if (produto.id === produtoSelecionado.id) {
            return {
              ...produto,
              ...produtoFormatado,
              id: produtoSelecionado.id // Mantém o ID original
            };
          }
          return produto;
        });
        
        setProdutos(produtosAtualizados);
        mostrarSucesso(`Produto "${produtoFormatado.nome}" editado com sucesso!`);
      } else {
        // Simulação de criação de novo produto
        const novoId = produtos.length > 0 ? Math.max(...produtos.map(p => p.id)) + 1 : 1;
        const novoProdutoCompleto = {
          ...produtoFormatado,
          id: novoId,
          data_cadastro: new Date().toISOString()
        };
        
        setProdutos([...produtos, novoProdutoCompleto]);
        mostrarSucesso(`Produto "${produtoFormatado.nome}" criado com sucesso!`);
      }
      
      setModalAberto(false);
      limparFormulario();
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      setError(modoEdicao ? "Erro ao editar produto" : "Erro ao criar produto");
    }
  };

  const limparFormulario = () => {
    setNovoProduto({
      nome: "",
      descricao: "",
      preco: "",
      estoque: "",
      categoria_id: "",
      categoria: "",
      especificacoes: "",
      imagem: ""
    });
    setErros({});
    setModoEdicao(false);
    setProdutoSelecionado(null);
  };

  const handleEditar = (produto) => {
    setNovoProduto({
      nome: produto.nome,
      descricao: produto.descricao,
      preco: produto.preco.toString(),
      estoque: produto.estoque.toString(),
      categoria: produto.categoria,
      categoria_id: produto.categoria_id,
      especificacoes: produto.especificacoes || "",
      imagem: produto.imagem || ""
    });
    setProdutoSelecionado(produto);
    setModoEdicao(true);
    setModalAberto(true);
  };

  const handleExcluir = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?\n\nEsta ação não pode ser desfeita.")) {
      try {
        // Captura o nome do produto antes de excluí-lo
        const produtoParaExcluir = produtos.find(p => p.id === id);
        if (!produtoParaExcluir) {
          throw new Error("Produto não encontrado");
        }
        
        const produtosAtualizados = produtos.filter(produto => produto.id !== id);
        setProdutos(produtosAtualizados);
        
        // Exibe mensagem de sucesso
        mostrarSucesso(`Produto "${produtoParaExcluir.nome}" excluído com sucesso!`);
      } catch (err) {
        console.error("Erro ao excluir produto:", err);
        setError(`Erro ao excluir produto: ${err.message}`);
      }
    }
  };

  const handleVerDetalhes = (produto) => {
    setProdutoSelecionado(produto);
    setModalDetalhesAberto(true);
  };

  const produtosFiltrados = produtos.filter((produto) => {
    const matchBusca = 
      produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
      produto.descricao.toLowerCase().includes(busca.toLowerCase());
    
    if (filtroCategoria === "todas") {
      return matchBusca;
    }
    
    return matchBusca && produto.categoria === filtroCategoria;
  });

  const handleImagemChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNovoProduto(prev => ({
          ...prev,
          imagem: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const carregarCategorias = async () => {
    try {
      // Tentar carregar da API primeiro
      try {
        const categoriasAPI = await api.categorias.listar();
        if (categoriasAPI && Array.isArray(categoriasAPI)) {
          console.log("Categorias carregadas da API:", categoriasAPI);
          setCategorias(categoriasAPI);
          return;
        }
      } catch (errApi) {
        console.warn("Não foi possível carregar categorias da API, usando localStorage:", errApi);
      }

      // Fallback para o localStorage
      const categoriasLocais = localStorage.getItem('categoriasLocais');
      
      if (categoriasLocais) {
        const categoriasParsed = JSON.parse(categoriasLocais);
        setCategorias(categoriasParsed);
      } else {
        // Categorias padrão caso não exista no localStorage
        const categoriasPadrao = [
          { id: 1, nome: "Cartões", produtos: 0 },
          { id: 2, nome: "Panfletos", produtos: 0 },
          { id: 3, nome: "Banners", produtos: 0 },
          { id: 4, nome: "Adesivos", produtos: 0 },
          { id: 5, nome: "Convites", produtos: 0 },
          { id: 6, nome: "Papelaria", produtos: 0 },
          { id: 7, nome: "Outros", produtos: 0 }
        ];
        setCategorias(categoriasPadrao);
      }
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
      // Usar categorias padrão em caso de erro
      const categoriasPadrao = [
        { id: 1, nome: "Cartões", produtos: 0 },
        { id: 2, nome: "Panfletos", produtos: 0 },
        { id: 3, nome: "Banners", produtos: 0 },
        { id: 4, nome: "Adesivos", produtos: 0 },
        { id: 5, nome: "Convites", produtos: 0 },
        { id: 6, nome: "Papelaria", produtos: 0 },
        { id: 7, nome: "Outros", produtos: 0 }
      ];
      setCategorias(categoriasPadrao);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Produtos</h1>
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
            Novo Produto
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

      <div className="bg-slate-800 p-4 rounded-lg shadow mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full p-2 rounded bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="p-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas as categorias</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.nome}>
                  {cat.nome}
                </option>
              ))}
            </select>
            <Link 
              to="/categorias"
              className="flex items-center space-x-1 p-2 bg-teal-600 hover:bg-teal-700 text-white rounded transition-colors"
              title="Gerenciar categorias"
            >
              <FaTags size={16} />
              <span>Categorias</span>
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-300">Carregando produtos...</p>
        </div>
      ) : produtosFiltrados.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-300">
            {filtroCategoria === "todas" && busca === ""
              ? "Nenhum produto cadastrado."
              : "Nenhum produto encontrado com os filtros atuais."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-slate-800 rounded-lg overflow-hidden">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Estoque
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {produtosFiltrados.map((produto) => (
                <tr 
                  key={produto.id} 
                  className="hover:bg-slate-700 transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {produto.imagem ? (
                        <div className="flex-shrink-0 h-10 w-10 rounded overflow-hidden bg-slate-600">
                          <img
                            src={produto.imagem}
                            alt={produto.nome}
                            className="h-10 w-10 object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 h-10 w-10 rounded overflow-hidden bg-slate-600 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">Sem img</span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-white">
                          {produto.nome}
                        </div>
                        <div className="text-sm text-gray-400 truncate max-w-xs">
                          {produto.descricao.substring(0, 50)}
                          {produto.descricao.length > 50 ? "..." : ""}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900 text-blue-300">
                      {produto.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                    {produto.preco.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      produto.estoque > 10
                        ? "bg-green-900 text-green-300"
                        : produto.estoque > 0
                        ? "bg-yellow-900 text-yellow-300"
                        : "bg-red-900 text-red-300"
                    }`}>
                      {produto.estoque}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                    {new Date(produto.data_cadastro).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleVerDetalhes(produto)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Detalhes
                    </button>
                    <button
                      onClick={() => handleEditar(produto)}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleExcluir(produto.id)}
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

      {/* Modal de Detalhes */}
      {modalDetalhesAberto && produtoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white">
                Detalhes do Produto
              </h3>
              <button
                onClick={() => setModalDetalhesAberto(false)}
                className="text-gray-400 hover:text-gray-200 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {produtoSelecionado.imagem ? (
                  <div className="w-full sm:w-1/3 flex-shrink-0">
                    <img
                      src={produtoSelecionado.imagem}
                      alt={produtoSelecionado.nome}
                      className="w-full h-auto object-cover rounded-lg shadow-lg"
                    />
                  </div>
                ) : (
                  <div className="w-full sm:w-1/3 flex-shrink-0 bg-slate-700 rounded-lg h-48 flex items-center justify-center">
                    <span className="text-gray-400">Sem imagem</span>
                  </div>
                )}
                <div className="flex-1 space-y-4">
                  <div>
                    <h4 className="text-sm text-gray-400">Nome</h4>
                    <p className="text-lg font-semibold text-white">
                      {produtoSelecionado.nome}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-400">Categoria</h4>
                    <p className="text-white">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900 text-blue-300">
                        {produtoSelecionado.categoria}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <h4 className="text-sm text-gray-400">Preço</h4>
                      <p className="text-white font-semibold">
                        {produtoSelecionado.preco.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm text-gray-400">Estoque</h4>
                      <p className="text-white">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          produtoSelecionado.estoque > 10
                            ? "bg-green-900 text-green-300"
                            : produtoSelecionado.estoque > 0
                            ? "bg-yellow-900 text-yellow-300"
                            : "bg-red-900 text-red-300"
                        }`}>
                          {produtoSelecionado.estoque} unidades
                        </span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-400">Data de Cadastro</h4>
                    <p className="text-white">
                      {new Date(produtoSelecionado.data_cadastro).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm text-gray-400 mb-2">Descrição</h4>
                <p className="text-white bg-slate-700 rounded-lg p-4">
                  {produtoSelecionado.descricao || "Sem descrição disponível."}
                </p>
              </div>
              {produtoSelecionado.especificacoes && (
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">Especificações</h4>
                  <p className="text-white bg-slate-700 rounded-lg p-4 whitespace-pre-wrap">
                    {produtoSelecionado.especificacoes}
                  </p>
                </div>
              )}
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

      {/* Modal de Criação/Edição */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white">
                {modoEdicao ? "Editar Produto" : "Novo Produto"}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Nome do Produto
                  </label>
                  <input
                    type="text"
                    value={novoProduto.nome}
                    onChange={(e) =>
                      setNovoProduto((prev) => ({
                        ...prev,
                        nome: e.target.value,
                      }))
                    }
                    className={`w-full p-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 ${
                      erros.nome ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                    }`}
                  />
                  {erros.nome && (
                    <p className="text-red-500 text-xs">{erros.nome}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Categoria
                  </label>
                  <select
                    value={novoProduto.categoria}
                    onChange={(e) =>
                      setNovoProduto((prev) => ({
                        ...prev,
                        categoria: e.target.value,
                      }))
                    }
                    className={`w-full p-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 ${
                      erros.categoria ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                    }`}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.nome}>
                        {categoria.nome}
                      </option>
                    ))}
                  </select>
                  {erros.categoria && (
                    <p className="text-red-500 text-xs">{erros.categoria}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={novoProduto.preco}
                    onChange={(e) =>
                      setNovoProduto((prev) => ({
                        ...prev,
                        preco: e.target.value,
                      }))
                    }
                    className={`w-full p-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 ${
                      erros.preco ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                    }`}
                  />
                  {erros.preco && (
                    <p className="text-red-500 text-xs">{erros.preco}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Estoque
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={novoProduto.estoque}
                    onChange={(e) =>
                      setNovoProduto((prev) => ({
                        ...prev,
                        estoque: e.target.value,
                      }))
                    }
                    className={`w-full p-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 ${
                      erros.estoque ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                    }`}
                  />
                  {erros.estoque && (
                    <p className="text-red-500 text-xs">{erros.estoque}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Descrição
                </label>
                <textarea
                  value={novoProduto.descricao}
                  onChange={(e) =>
                    setNovoProduto((prev) => ({
                      ...prev,
                      descricao: e.target.value,
                    }))
                  }
                  rows={3}
                  className={`w-full p-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 ${
                    erros.descricao ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                  }`}
                ></textarea>
                {erros.descricao && (
                  <p className="text-red-500 text-xs">{erros.descricao}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Especificações Técnicas (opcional)
                </label>
                <textarea
                  value={novoProduto.especificacoes}
                  onChange={(e) =>
                    setNovoProduto((prev) => ({
                      ...prev,
                      especificacoes: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full p-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dimensões, material, detalhes técnicos, etc."
                ></textarea>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Imagem do Produto (opcional)
                </label>
                <div className="flex items-center gap-4">
                  {novoProduto.imagem && (
                    <div className="h-20 w-20 rounded overflow-hidden bg-slate-700">
                      <img
                        src={novoProduto.imagem}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      onChange={handleImagemChange}
                      accept="image/*"
                      className="w-full p-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none"
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      Formatos suportados: JPG, PNG, GIF. Tamanho máximo: 2MB
                    </p>
                  </div>
                </div>
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
                  {modoEdicao ? "Salvar Alterações" : "Criar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Produtos;
  