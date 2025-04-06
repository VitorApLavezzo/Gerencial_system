import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../config/api";

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [nomeEditado, setNomeEditado] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    carregarCategorias();
  }, []);

  // Salva alterações no localStorage como fallback
  useEffect(() => {
    localStorage.setItem('categoriasLocais', JSON.stringify(categorias));
  }, [categorias]);

  const mostrarSucesso = (mensagem) => {
    setSucesso(mensagem);
    setTimeout(() => {
      setSucesso(null);
    }, 3000); // Remove a mensagem após 3 segundos
  };

  const carregarCategorias = async () => {
    try {
      setLoading(true);
      
      // Tentar carregar do backend
      let categoriasCarregadas;
      try {
        categoriasCarregadas = await api.categorias.listar();
        console.log("Categorias carregadas da API:", categoriasCarregadas);
      } catch (errApi) {
        console.warn("Erro ao carregar categorias da API, usando localStorage:", errApi);
        
        // Verificar se existem dados salvos no localStorage
        const categoriasLocais = localStorage.getItem('categoriasLocais');
        
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
        
        // Se existirem dados no localStorage, usar esses dados
        if (categoriasLocais) {
          categoriasCarregadas = JSON.parse(categoriasLocais);
        } else {
          // Usar categorias padrão e salvar no localStorage
          categoriasCarregadas = categoriasPadrao;
          localStorage.setItem('categoriasLocais', JSON.stringify(categoriasPadrao));
          
          // Tentar criar as categorias padrão no backend
          try {
            for (const categoria of categoriasPadrao) {
              await api.categorias.criar({ nome: categoria.nome });
            }
          } catch (errCreate) {
            console.warn("Não foi possível criar categorias padrão na API:", errCreate);
          }
        }
      }
      
      setCategorias(categoriasCarregadas);
      
      // Atualizar contagem de produtos para cada categoria
      atualizarContagemProdutos();
      
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
      setError("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };
  
  const atualizarContagemProdutos = async () => {
    try {
      let produtos;
      
      // Tentar carregar produtos da API
      try {
        produtos = await api.produtos.listar();
      } catch (errApi) {
        console.warn("Erro ao carregar produtos da API, usando localStorage:", errApi);
        
        // Usar localStorage como fallback
        const produtosLocais = localStorage.getItem('produtosLocais');
        if (produtosLocais) {
          produtos = JSON.parse(produtosLocais);
        } else {
          produtos = [];
        }
      }
      
      if (!produtos || !produtos.length) return;
      
      setCategorias(prevCategorias => {
        // Contar produtos por categoria
        const contagem = {};
        produtos.forEach(produto => {
          if (produto.categoria) {
            contagem[produto.categoria] = (contagem[produto.categoria] || 0) + 1;
          }
        });
        
        // Atualizar contagem nas categorias
        return prevCategorias.map(categoria => ({
          ...categoria,
          produtos: contagem[categoria.nome] || 0
        }));
      });
    } catch (err) {
      console.error("Erro ao atualizar contagem de produtos:", err);
    }
  };

  const handleResetarDados = async () => {
    // Verificar se o usuário é administrador
    if (!isAdmin()) {
      setError("Apenas administradores podem resetar os dados");
      return;
    }
    
    if (!window.confirm("Tem certeza que deseja resetar todas as categorias? Esta ação irá restaurar apenas as categorias padrão.")) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Categorias padrão
      const categoriasPadrao = [
        { id: 1, nome: "Cartões", produtos: 0 },
        { id: 2, nome: "Panfletos", produtos: 0 },
        { id: 3, nome: "Banners", produtos: 0 },
        { id: 4, nome: "Adesivos", produtos: 0 },
        { id: 5, nome: "Convites", produtos: 0 },
        { id: 6, nome: "Papelaria", produtos: 0 },
        { id: 7, nome: "Outros", produtos: 0 }
      ];
      
      // Tentar excluir todas as categorias existentes na API
      try {
        for (const categoria of categorias) {
          await api.categorias.excluir(categoria.id);
        }
        
        // Criar as categorias padrão na API
        for (const categoria of categoriasPadrao) {
          await api.categorias.criar({ nome: categoria.nome });
        }
      } catch (errApi) {
        console.warn("Erro ao resetar categorias na API, usando localStorage:", errApi);
      }
      
      // Remover dados do localStorage
      localStorage.removeItem('categoriasLocais');
      
      // Recarregar categorias
      await carregarCategorias();
      
      mostrarSucesso("Categorias resetadas com sucesso");
    } catch (err) {
      console.error("Erro ao resetar categorias:", err);
      setError(`Erro ao resetar categorias: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNovaCategoria = async (e) => {
    e.preventDefault();
    
    if (!novaCategoria.trim()) {
      setError("O nome da categoria não pode estar vazio");
      return;
    }
    
    // Verificar se a categoria já existe
    if (categorias.some(cat => cat.nome.toLowerCase() === novaCategoria.trim().toLowerCase())) {
      setError("Esta categoria já existe");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const novaCategoriaObj = { nome: novaCategoria.trim() };
      
      // Tentar criar na API
      let categoriaCriada;
      try {
        categoriaCriada = await api.categorias.criar(novaCategoriaObj);
        console.log("Categoria criada na API:", categoriaCriada);
      } catch (errApi) {
        console.warn("Erro ao criar categoria na API, usando localStorage:", errApi);
        
        // Criar localmente se a API falhar
        const novoId = categorias.length > 0 ? Math.max(...categorias.map(c => c.id)) + 1 : 1;
        categoriaCriada = {
          id: novoId,
          nome: novaCategoria.trim(),
          produtos: 0
        };
      }
      
      // Atualizar estado
      setCategorias([...categorias, categoriaCriada]);
      setNovaCategoria("");
      mostrarSucesso(`Categoria "${categoriaCriada.nome}" criada com sucesso!`);
    } catch (err) {
      console.error("Erro ao criar categoria:", err);
      setError("Erro ao criar categoria");
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarEdicao = (categoria) => {
    setCategoriaEditando(categoria.id);
    setNomeEditado(categoria.nome);
  };

  const handleCancelarEdicao = () => {
    setCategoriaEditando(null);
    setNomeEditado("");
  };

  const handleSalvarEdicao = async (id) => {
    if (!nomeEditado.trim()) {
      setError("O nome da categoria não pode estar vazio");
      return;
    }
    
    // Verificar se o novo nome já existe em outra categoria
    if (categorias.some(cat => cat.id !== id && cat.nome.toLowerCase() === nomeEditado.trim().toLowerCase())) {
      setError("Já existe uma categoria com este nome");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const categoriaAntiga = categorias.find(cat => cat.id === id);
      const nomeAntigo = categoriaAntiga.nome;
      const nomeNovo = nomeEditado.trim();
      
      // Tentar atualizar na API
      try {
        await api.categorias.atualizar(id, { nome: nomeNovo });
        console.log("Categoria atualizada na API:", { id, nome: nomeNovo });
      } catch (errApi) {
        console.warn("Erro ao atualizar categoria na API, usando localStorage:", errApi);
      }
      
      // Atualizar estado local
      const categoriasAtualizadas = categorias.map(cat => {
        if (cat.id === id) {
          return { ...cat, nome: nomeNovo };
        }
        return cat;
      });
      
      setCategorias(categoriasAtualizadas);
      setCategoriaEditando(null);
      mostrarSucesso("Categoria atualizada com sucesso!");
      
      // Atualizar produtos que usam esta categoria
      atualizarProdutosComCategoria(nomeAntigo, nomeNovo);
    } catch (err) {
      console.error("Erro ao editar categoria:", err);
      setError("Erro ao editar categoria");
    } finally {
      setLoading(false);
    }
  };

  const atualizarProdutosComCategoria = async (nomeAntigo, nomeNovo) => {
    try {
      // Verificar produtos no localStorage
      const produtosLocais = localStorage.getItem('produtosLocais');
      if (!produtosLocais) return;
      
      const produtos = JSON.parse(produtosLocais);
      const produtosAtualizados = produtos.map(produto => {
        if (produto.categoria === nomeAntigo) {
          return { ...produto, categoria: nomeNovo };
        }
        return produto;
      });
      
      localStorage.setItem('produtosLocais', JSON.stringify(produtosAtualizados));
      
      // Tentar atualizar produtos na API também
      try {
        const produtosApi = await api.produtos.listar();
        for (const produto of produtosApi) {
          if (produto.categoria === nomeAntigo) {
            await api.produtos.atualizar(produto.id, { ...produto, categoria: nomeNovo });
          }
        }
      } catch (errApi) {
        console.warn("Erro ao atualizar produtos na API:", errApi);
      }
    } catch (err) {
      console.error("Erro ao atualizar produtos com a categoria:", err);
    }
  };

  const handleExcluir = async (id) => {
    // Verificar se a categoria está sendo usada por produtos
    const categoria = categorias.find(cat => cat.id === id);
    if (categoria?.produtos > 0) {
      if (!window.confirm(
        `A categoria "${categoria.nome}" está sendo usada por ${categoria.produtos} produto(s).\n\n` +
        `Se você excluí-la, esses produtos ficarão sem categoria.\n\n` +
        `Deseja prosseguir com a exclusão?`
      )) {
        return;
      }
    } else {
      if (!window.confirm("Tem certeza que deseja excluir esta categoria?")) {
        return;
      }
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Guarda o nome da categoria antes de excluir
      const categoriaNome = categoria.nome;
      
      // Tentar excluir na API
      try {
        await api.categorias.excluir(id);
        console.log("Categoria excluída na API:", id);
      } catch (errApi) {
        console.warn("Erro ao excluir categoria na API, usando localStorage:", errApi);
      }
      
      // Remove a categoria do estado
      const categoriasAtualizadas = categorias.filter(cat => cat.id !== id);
      setCategorias(categoriasAtualizadas);
      
      mostrarSucesso(`Categoria "${categoriaNome}" excluída com sucesso!`);
      
      // Atualizar produtos que usavam esta categoria
      if (categoriaNome) {
        removerCategoriaDosProdutos(categoriaNome);
      }
    } catch (err) {
      console.error("Erro ao excluir categoria:", err);
      setError("Erro ao excluir categoria");
    } finally {
      setLoading(false);
    }
  };

  const removerCategoriaDosProdutos = async (categoriaNome) => {
    try {
      // Atualizar no localStorage
      const produtosLocais = localStorage.getItem('produtosLocais');
      if (produtosLocais) {
        const produtos = JSON.parse(produtosLocais);
        const produtosAtualizados = produtos.map(produto => {
          if (produto.categoria === categoriaNome) {
            return { ...produto, categoria: "Outros" }; // Define para "Outros"
          }
          return produto;
        });
        
        localStorage.setItem('produtosLocais', JSON.stringify(produtosAtualizados));
      }
      
      // Tentar atualizar na API também
      try {
        const produtosApi = await api.produtos.listar();
        for (const produto of produtosApi) {
          if (produto.categoria === categoriaNome) {
            await api.produtos.atualizar(produto.id, { ...produto, categoria: "Outros" });
          }
        }
      } catch (errApi) {
        console.warn("Erro ao atualizar produtos na API após exclusão de categoria:", errApi);
      }
    } catch (err) {
      console.error("Erro ao remover categoria dos produtos:", err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Categorias de Produtos</h1>
        {isAdmin() && (
          <button
            onClick={handleResetarDados}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            title="Restaurar categorias padrão"
          >
            Resetar Categorias
          </button>
        )}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Nova Categoria */}
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold text-white mb-4">Adicionar Nova Categoria</h2>
          <form onSubmit={handleNovaCategoria} className="space-y-4">
            <div>
              <label htmlFor="nomeCategoria" className="block text-sm font-medium text-gray-300 mb-1">
                Nome da Categoria
              </label>
              <input
                type="text"
                id="nomeCategoria"
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                className="w-full p-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Cartazes, Embalagens, etc."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Adicionar Categoria
            </button>
          </form>
        </div>

        {/* Lista de Categorias */}
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">Categorias Existentes</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-300">Carregando categorias...</p>
            </div>
          ) : categorias.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-300">Nenhuma categoria cadastrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Produtos
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {categorias.map((categoria) => (
                    <tr key={categoria.id} className="hover:bg-slate-700/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {categoriaEditando === categoria.id ? (
                          <input
                            type="text"
                            value={nomeEditado}
                            onChange={(e) => setNomeEditado(e.target.value)}
                            className="w-full p-2 rounded bg-slate-600 border border-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <div className="text-white">{categoria.nome}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900 text-blue-300">
                          {categoria.produtos}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        {categoriaEditando === categoria.id ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleSalvarEdicao(categoria.id)}
                              className="text-green-400 hover:text-green-300 transition-colors"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={handleCancelarEdicao}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-4">
                            <button
                              onClick={() => handleIniciarEdicao(categoria)}
                              className="text-yellow-400 hover:text-yellow-300 transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleExcluir(categoria.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              Excluir
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categorias; 