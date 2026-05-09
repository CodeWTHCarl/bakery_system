require('dotenv').config();
require('./config/db');

const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
const ingredientRoutes  = require('./routes/ingredients');
const breadCatalogRoutes= require('./routes/breadCatalog');
const recipeRoutes      = require('./routes/recipes');
const batchRoutes       = require('./routes/breadBatch');
const authRoutes        = require('./routes/auth');
const activityRoutes    = require('./routes/activityLogs');
const userRoutes        = require('./routes/users');
const supplierRoutes    = require('./routes/suppliers');

app.use('/api/ingredients', ingredientRoutes);
app.use('/api/breads',      breadCatalogRoutes);
app.use('/api/recipes',     recipeRoutes);
app.use('/api/batch',       batchRoutes);
app.use('/api/auth',        authRoutes);
app.use('/api/logs',        activityRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/suppliers',   supplierRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Bakery API running ✅', version: '3.0' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});