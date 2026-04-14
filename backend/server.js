require('./config/db');

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());


// ================= ROUTES =================
const ingredientRoutes = require('./routes/ingredients');
const breadCatalogRoutes = require('./routes/breadCatalog');
const recipeRoutes = require('./routes/recipes');
const batchRoutes = require('./routes/breadBatch');
const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activityLogs');

app.use('/api/ingredients', ingredientRoutes);
app.use('/api/breads', breadCatalogRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/logs', activityRoutes);


// ================= TEST =================
app.get('/', (req, res) => {
  res.send('Backend is running naa...');
});


// ================= START =================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});