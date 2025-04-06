const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');

// Importação das rotas
const clientesRoutes = require('./routes/clientes');
const produtosRoutes = require('./routes/produtos');
const orcamentosRoutes = require('./routes/orcamentos');
const vendasRoutes = require('./routes/vendas');
const categoriasRoutes = require('./routes/categorias');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Rotas da API
app.use('/api/clientes', clientesRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/orcamentos', orcamentosRoutes);
app.use('/api/vendas', vendasRoutes);
app.use('/api/categorias', categoriasRoutes);

// Servir arquivos estáticos em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'API do Criartes funcionando!' });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app; 