const express = require('express');
const router = express.Router();

// Armazenamento local simulado
let categorias = [
  { id: 1, nome: "Cartões", produtos: 0 },
  { id: 2, nome: "Panfletos", produtos: 0 },
  { id: 3, nome: "Banners", produtos: 0 },
  { id: 4, nome: "Adesivos", produtos: 0 },
  { id: 5, nome: "Convites", produtos: 0 },
  { id: 6, nome: "Papelaria", produtos: 0 },
  { id: 7, nome: "Outros", produtos: 0 }
];

// Função auxiliar para gerar ID
const getNextId = () => {
  if (categorias.length === 0) return 1;
  return Math.max(...categorias.map(c => c.id)) + 1;
};

// Listar todas as categorias
router.get('/', (req, res) => {
  try {
    // Adicionar timestamp no console para debug
    console.log(`[${new Date().toISOString()}] GET /api/categorias - retornando ${categorias.length} categorias`);
    res.json(categorias);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ mensagem: 'Erro ao listar categorias' });
  }
});

// Obter uma categoria pelo ID
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const categoria = categorias.find(c => c.id === id);
    
    if (!categoria) {
      return res.status(404).json({ mensagem: 'Categoria não encontrada' });
    }
    
    res.json(categoria);
  } catch (error) {
    console.error('Erro ao obter categoria:', error);
    res.status(500).json({ mensagem: 'Erro ao obter categoria' });
  }
});

// Criar uma nova categoria
router.post('/', (req, res) => {
  try {
    const { nome } = req.body;
    
    if (!nome || nome.trim() === '') {
      return res.status(400).json({ mensagem: 'Nome da categoria é obrigatório' });
    }
    
    // Verificar se categoria já existe
    if (categorias.some(c => c.nome.toLowerCase() === nome.toLowerCase())) {
      return res.status(400).json({ mensagem: 'Já existe uma categoria com este nome' });
    }
    
    const novaCategoria = {
      id: getNextId(),
      nome: nome.trim(),
      produtos: 0
    };
    
    categorias.push(novaCategoria);
    console.log(`[${new Date().toISOString()}] POST /api/categorias - criada categoria: ${nome} (ID: ${novaCategoria.id})`);
    
    res.status(201).json(novaCategoria);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ mensagem: 'Erro ao criar categoria' });
  }
});

// Atualizar uma categoria
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome } = req.body;
    
    if (!nome || nome.trim() === '') {
      return res.status(400).json({ mensagem: 'Nome da categoria é obrigatório' });
    }
    
    // Buscar categoria
    const index = categorias.findIndex(c => c.id === id);
    
    if (index === -1) {
      return res.status(404).json({ mensagem: 'Categoria não encontrada' });
    }
    
    // Verificar se nome já existe em outra categoria
    if (categorias.some(c => c.id !== id && c.nome.toLowerCase() === nome.toLowerCase())) {
      return res.status(400).json({ mensagem: 'Já existe uma categoria com este nome' });
    }
    
    // Atualizar categoria
    categorias[index].nome = nome.trim();
    
    console.log(`[${new Date().toISOString()}] PUT /api/categorias/${id} - atualizada categoria para: ${nome}`);
    
    res.json(categorias[index]);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar categoria' });
  }
});

// Excluir uma categoria
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Buscar categoria
    const index = categorias.findIndex(c => c.id === id);
    
    if (index === -1) {
      return res.status(404).json({ mensagem: 'Categoria não encontrada' });
    }
    
    // Guardar a categoria antes de excluir
    const categoriaExcluida = categorias[index];
    
    // Excluir categoria
    categorias = categorias.filter(c => c.id !== id);
    
    console.log(`[${new Date().toISOString()}] DELETE /api/categorias/${id} - excluída categoria: ${categoriaExcluida.nome}`);
    
    res.json({ mensagem: 'Categoria excluída com sucesso', id });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    res.status(500).json({ mensagem: 'Erro ao excluir categoria' });
  }
});

module.exports = router; 