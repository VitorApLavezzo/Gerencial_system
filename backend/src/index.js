const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Caminho para o arquivo do banco de dados
const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Criar banco de dados em arquivo
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao criar banco de dados:', err);
  } else {
    console.log('Banco de dados conectado em', dbPath);
    criarTabelas();
  }
});

// Criar tabelas
function criarTabelas() {
  db.serialize(() => {
    // Tabela de Clientes
    db.run(`CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT,
      telefone TEXT,
      endereco TEXT,
      data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabela de Categorias
    db.run(`CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Verificar se existem categorias padrão
    db.get("SELECT COUNT(*) as count FROM categorias", [], (err, row) => {
      if (err) {
        console.error("Erro ao verificar categorias:", err);
        return;
      }

      // Se não houver categorias, não criar nenhuma categoria padrão
      if (row.count === 0) {
        console.log("Banco de dados inicializado sem categorias padrão");
      }
    });

    // Tabela de Produtos
    db.run(`CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT,
      preco REAL NOT NULL,
      estoque INTEGER DEFAULT 0,
      categoria TEXT,
      categoria_id INTEGER,
      especificacoes TEXT,
      imagem TEXT,
      data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    )`);

    // Tabela de Orçamentos
    db.run(`CREATE TABLE IF NOT EXISTS orcamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER,
      data DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'Pendente',
      valor_total REAL,
      desconto REAL DEFAULT 0,
      prazo_entrega TEXT,
      observacoes TEXT,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    )`);

    // Tabela de Itens do Orçamento
    db.run(`CREATE TABLE IF NOT EXISTS orcamento_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orcamento_id INTEGER,
      produto_id INTEGER,
      quantidade INTEGER,
      preco_unitario REAL,
      FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id),
      FOREIGN KEY (produto_id) REFERENCES produtos(id)
    )`);

    // Tabela de Vendas
    db.run(`CREATE TABLE IF NOT EXISTS vendas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER,
      data DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'Pendente',
      valor_total REAL,
      desconto REAL DEFAULT 0,
      forma_pagamento TEXT,
      parcelas INTEGER DEFAULT 1,
      observacoes TEXT,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    )`);

    // Tabela de Itens da Venda
    db.run(`CREATE TABLE IF NOT EXISTS venda_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venda_id INTEGER,
      produto_id INTEGER,
      quantidade INTEGER,
      preco_unitario REAL,
      FOREIGN KEY (venda_id) REFERENCES vendas(id),
      FOREIGN KEY (produto_id) REFERENCES produtos(id)
    )`);
  });
}

// Rotas para Categorias
app.get('/api/categorias', (req, res) => {
  db.all(`
    SELECT c.*, 
    (SELECT COUNT(*) FROM produtos WHERE categoria = c.nome) as produtos 
    FROM categorias c
    ORDER BY c.nome
  `, [], (err, rows) => {
    if (err) {
      console.error('Erro ao listar categorias:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/categorias/:id', (req, res) => {
  const id = req.params.id;
  db.get(`
    SELECT c.*, 
    (SELECT COUNT(*) FROM produtos WHERE categoria = c.nome) as produtos 
    FROM categorias c
    WHERE c.id = ?
  `, [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Categoria não encontrada' });
      return;
    }
    res.json(row);
  });
});

app.post('/api/categorias', (req, res) => {
  const { nome } = req.body;
  
  if (!nome || nome.trim() === '') {
    return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
  }
  
  // Verificar se já existe essa categoria
  db.get('SELECT id FROM categorias WHERE nome = ?', [nome.trim()], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (row) {
      return res.status(400).json({ error: 'Já existe uma categoria com este nome' });
    }
    
    // Inserir nova categoria
    db.run('INSERT INTO categorias (nome) VALUES (?)', [nome.trim()], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Retornar a categoria criada
      db.get('SELECT id, nome FROM categorias WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.status(201).json({ ...row, produtos: 0 });
      });
    });
  });
});

app.put('/api/categorias/:id', (req, res) => {
  const id = req.params.id;
  const { nome } = req.body;
  
  if (!nome || nome.trim() === '') {
    return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
  }
  
  // Verificar se já existe outra categoria com esse nome
  db.get('SELECT id FROM categorias WHERE nome = ? AND id != ?', [nome.trim(), id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (row) {
      return res.status(400).json({ error: 'Já existe outra categoria com este nome' });
    }
    
    // Atualizar categoria
    db.run('UPDATE categorias SET nome = ? WHERE id = ?', [nome.trim(), id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }
      
      // Retornar a categoria atualizada
      db.get(`
        SELECT c.*, 
        (SELECT COUNT(*) FROM produtos WHERE categoria = (SELECT nome FROM categorias WHERE id = ?)) as produtos 
        FROM categorias c
        WHERE c.id = ?
      `, [id, id], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.json(row);
      });
    });
  });
});

app.delete('/api/categorias/:id', (req, res) => {
  const id = req.params.id;
  
  // Verificar se existe a categoria
  db.get('SELECT id, nome FROM categorias WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    // Tentar encontrar nome da categoria "Outros"
    db.get('SELECT nome FROM categorias WHERE nome = "Outros"', [], (err, outrosRow) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const outrosNome = outrosRow ? outrosRow.nome : null;
      
      // Se tiver produtos associados, atualizar para categoria "Outros"
      if (outrosNome) {
        db.run('UPDATE produtos SET categoria = ? WHERE categoria = ?', [outrosNome, row.nome], (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Excluir a categoria
          excluirCategoria(id, row.nome, res);
        });
      } else {
        // Apenas remover categoria dos produtos
        db.run('UPDATE produtos SET categoria = "Sem categoria" WHERE categoria = ?', [row.nome], (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Excluir a categoria
          excluirCategoria(id, row.nome, res);
        });
      }
    });
  });
});

function excluirCategoria(id, nome, res) {
  db.run('DELETE FROM categorias WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({
      message: `Categoria '${nome}' excluída com sucesso`,
      id: parseInt(id)
    });
  });
}

// Rotas para Clientes
app.get('/api/clientes', (req, res) => {
  db.all('SELECT * FROM clientes', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/clientes', (req, res) => {
  const { nome, email, telefone, endereco } = req.body;
  db.run('INSERT INTO clientes (nome, email, telefone, endereco) VALUES (?, ?, ?, ?)',
    [nome, email, telefone, endereco],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    });
});

// Rotas para Produtos
app.get('/api/produtos', (req, res) => {
  db.all(`
    SELECT p.* 
    FROM produtos p
  `, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/produtos', (req, res) => {
  const { nome, descricao, preco, estoque, categoria, categoria_id, especificacoes, imagem } = req.body;
  db.run('INSERT INTO produtos (nome, descricao, preco, estoque, categoria, categoria_id, especificacoes, imagem) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [nome, descricao, preco, estoque, categoria, categoria_id, especificacoes, imagem],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    });
});

// Rotas para Orçamentos
app.get('/api/orcamentos', (req, res) => {
  db.all(`
    SELECT o.*, c.nome as cliente_nome 
    FROM orcamentos o
    LEFT JOIN clientes c ON o.cliente_id = c.id
  `, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/orcamentos', (req, res) => {
  const { cliente_id, status, valor_total, desconto, prazo_entrega, observacoes, itens } = req.body;
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    db.run('INSERT INTO orcamentos (cliente_id, status, valor_total, desconto, prazo_entrega, observacoes) VALUES (?, ?, ?, ?, ?, ?)',
      [cliente_id, status, valor_total, desconto, prazo_entrega, observacoes],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        
        const orcamento_id = this.lastID;
        
        // Inserir itens do orçamento
        const stmt = db.prepare('INSERT INTO orcamento_itens (orcamento_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)');
        
        itens.forEach(item => {
          stmt.run(orcamento_id, item.produto_id, item.quantidade, item.preco_unitario);
        });
        
        stmt.finalize();
        db.run('COMMIT');
        res.json({ id: orcamento_id });
      });
  });
});

// Rotas para Vendas
app.get('/api/vendas', (req, res) => {
  db.all(`
    SELECT v.*, c.nome as cliente_nome 
    FROM vendas v
    LEFT JOIN clientes c ON v.cliente_id = c.id
  `, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/vendas', (req, res) => {
  const { cliente_id, status, valor_total, desconto, forma_pagamento, parcelas, observacoes, itens } = req.body;
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    db.run('INSERT INTO vendas (cliente_id, status, valor_total, desconto, forma_pagamento, parcelas, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [cliente_id, status, valor_total, desconto, forma_pagamento, parcelas, observacoes],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        
        const venda_id = this.lastID;
        
        // Inserir itens da venda
        const stmt = db.prepare('INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)');
        
        itens.forEach(item => {
          stmt.run(venda_id, item.produto_id, item.quantidade, item.preco_unitario);
        });
        
        stmt.finalize();
        db.run('COMMIT');
        res.json({ id: venda_id });
      });
  });
});

// Rota para atualizar status da venda
app.post('/api/vendas/:id/status', (req, res) => {
  const id = req.params.id;
  const { status, acao, data_conclusao, data_cancelamento } = req.body;
  
  let sql, params;
  
  if (acao === 'finalizar' && status === 'Concluída') {
    sql = 'UPDATE vendas SET status = ?, data_conclusao = ? WHERE id = ?';
    params = [status, data_conclusao, id];
  } else if (acao === 'cancelar' && status === 'Cancelada') {
    sql = 'UPDATE vendas SET status = ?, data_cancelamento = ? WHERE id = ?';
    params = [status, data_cancelamento, id];
  } else {
    sql = 'UPDATE vendas SET status = ? WHERE id = ?';
    params = [status, id];
  }
  
  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Venda não encontrada' });
      return;
    }
    
    res.json({ 
      message: `Status da venda atualizado para ${status}`,
      id: parseInt(id) 
    });
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
}); 