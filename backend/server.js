require('./config/db');
const express = require('express');

const app = express();
const PORT = 5000;
const cors = require('cors');
app.use(cors());


//route to server
const ingredientRoutes = require('./routes/ingredients');

// Middleware (important later for JSON)
app.use(express.json());

//routes (after middleware)
app.use('/api/ingredients', ingredientRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Backend is running...');
});

// Start server (always last mhenn)
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});




