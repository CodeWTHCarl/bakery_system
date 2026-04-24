require('dotenv').config();
require('./config/db');

const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//routes
const ingredientRoutes  = require('./routes/ingredients');
const breadCatalogRoutes= require('./routes/breadCatalog');
const recipeRoutes      = require('./routes/recipes');
const batchRoutes       = require('./routes/breadBatch');
const authRoutes        = require('./routes/auth');
const activityRoutes    = require('./routes/activityLogs');
const userRoutes        = require('./routes/users');      // NEW

app.use('/api/ingredients', ingredientRoutes);
app.use('/api/breads',      breadCatalogRoutes);
app.use('/api/recipes',     recipeRoutes);
app.use('/api/batch',       batchRoutes);
app.use('/api/auth',        authRoutes);
app.use('/api/logs',        activityRoutes);
app.use('/api/users',       userRoutes);                 // NEW

//health checkk
app.get('/', (req, res) => {
  res.json({ message: 'Bakery API is running ✅', version: '2.0' });
});

//start
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});