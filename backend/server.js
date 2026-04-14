require('./config/db');
const express = require('express');


const app = express();
const PORT = 5000;
const cors = require('cors');
app.use(cors());

const recipeRoutes = require('./routes/recipes');
const breadCatalogRoutes = require('./routes/breadCatalog');

//route to server
const ingredientRoutes = require('./routes/ingredients');

// Middleware (important later for JSON)
app.use(express.json());

//routes (after middleware)
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/breads', breadCatalogRoutes);
app.use('/api/recipes', recipeRoutes);

// Test routeee!!!
app.get('/', (req, res) => {
  res.send('Backend is running naa...');
});

// Start server (always last mhenn)
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});




