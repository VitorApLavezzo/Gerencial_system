const BASE_URL = "http://localhost:3001/api";

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `Erro ${response.status}: ${response.statusText}`
    }));
    console.error("Erro na requisição:", {
      status: response.status,
      statusText: response.statusText,
      error
    });
    throw new Error(error.message || `Erro ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

const api = {
  clientes: {
    listar: async () => {
      const response = await fetch(`${BASE_URL}/clientes`);
      return handleResponse(response);
    },
    criar: async (cliente) => {
      const response = await fetch(`${BASE_URL}/clientes`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(cliente)
      });
      return handleResponse(response);
    },
    atualizar: async (id, cliente) => {
      const response = await fetch(`${BASE_URL}/clientes/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(cliente)
      });
      return handleResponse(response);
    },
    excluir: async (id) => {
      const response = await fetch(`${BASE_URL}/clientes/${id}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json"
        }
      });
      return handleResponse(response);
    }
  },
  categorias: {
    listar: async () => {
      try {
        console.log("Listando categorias...");
        const response = await fetch(`${BASE_URL}/categorias`);
        return handleResponse(response);
      } catch (error) {
        console.error("Erro na listagem de categorias:", error);
        throw error;
      }
    },
    criar: async (categoria) => {
      try {
        console.log("Criando categoria:", categoria);
        const response = await fetch(`${BASE_URL}/categorias`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(categoria)
        });
        return handleResponse(response);
      } catch (error) {
        console.error("Erro na criação de categoria:", error);
        throw error;
      }
    },
    atualizar: async (id, categoria) => {
      try {
        console.log("Atualizando categoria:", { id, categoria });
        const response = await fetch(`${BASE_URL}/categorias/${id}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(categoria)
        });
        return handleResponse(response);
      } catch (error) {
        console.error("Erro na atualização de categoria:", error);
        throw error;
      }
    },
    excluir: async (id) => {
      try {
        console.log("Excluindo categoria:", id);
        const response = await fetch(`${BASE_URL}/categorias/${id}`, {
          method: "DELETE",
          headers: {
            "Accept": "application/json"
          }
        });
        return handleResponse(response);
      } catch (error) {
        console.error("Erro na exclusão de categoria:", error);
        throw error;
      }
    }
  },
  produtos: {
    listar: async () => {
      const response = await fetch(`${BASE_URL}/produtos`);
      return handleResponse(response);
    },
    criar: async (produto) => {
      const response = await fetch(`${BASE_URL}/produtos`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(produto)
      });
      return handleResponse(response);
    },
    atualizar: async (id, produto) => {
      const response = await fetch(`${BASE_URL}/produtos/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(produto)
      });
      return handleResponse(response);
    },
    excluir: async (id) => {
      const response = await fetch(`${BASE_URL}/produtos/${id}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json"
        }
      });
      return handleResponse(response);
    }
  },
  orcamentos: {
    listar: async () => {
      const response = await fetch(`${BASE_URL}/orcamentos`);
      return handleResponse(response);
    },
    criar: async (orcamento) => {
      const response = await fetch(`${BASE_URL}/orcamentos`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(orcamento)
      });
      return handleResponse(response);
    },
    atualizar: async (id, orcamento) => {
      const response = await fetch(`${BASE_URL}/orcamentos/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(orcamento)
      });
      return handleResponse(response);
    },
    excluir: async (id) => {
      const response = await fetch(`${BASE_URL}/orcamentos/${id}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json"
        }
      });
      return handleResponse(response);
    }
  },
  vendas: {
    listar: async () => {
      try {
        console.log("Listando vendas...");
        const response = await fetch(`${BASE_URL}/vendas`);
        if (!response.ok) {
          throw new Error(`Erro ao listar vendas: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Erro na listagem de vendas:", error);
        throw error;
      }
    },
    criar: async (venda) => {
      try {
        console.log("Criando venda:", venda);
        const response = await fetch(`${BASE_URL}/vendas`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(venda)
        });
        if (!response.ok) {
          throw new Error(`Erro ao criar venda: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Erro na criação de venda:", error);
        throw error;
      }
    },
    atualizar: async (id, venda) => {
      try {
        console.log("Atualizando venda:", { id, venda });
        const response = await fetch(`${BASE_URL}/vendas/${id}/status`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(venda)
        });
        if (!response.ok) {
          throw new Error(`Erro ao atualizar venda: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Erro na atualização de venda:", error);
        throw error;
      }
    },
    excluir: async (id) => {
      try {
        console.log("Excluindo venda:", id);
        const response = await fetch(`${BASE_URL}/vendas/${id}`, {
          method: "DELETE",
          headers: {
            "Accept": "application/json"
          }
        });
        if (!response.ok) {
          throw new Error(`Erro ao excluir venda: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Erro na exclusão de venda:", error);
        throw error;
      }
    }
  }
};

export { api }; 