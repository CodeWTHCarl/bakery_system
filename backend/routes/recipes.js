const express = require('express');
const router = express.Router();
const db = require('../config/db');


// ================= CREATE RECIPE =================
router.post('/', (req, res) => {
  const { bread_id, ingredient_id, quantity } = req.body;

  const sql = `
    INSERT INTO recipe (bread_id, ingredient_id, quantity)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [bread_id, ingredient_id, quantity], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to add recipe' });
    }

    res.json({
      message: 'Recipe added successfully',
      id: result.insertId
    });
  });
});


// ================= READ RECIPES =================
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      recipe.recipe_id,
      bread_catalog.bread_name,
      ingredients.ingredient_name,
      recipe.quantity
    FROM recipe
    JOIN bread_catalog ON recipe.bread_id = bread_catalog.bread_id
    JOIN ingredients ON recipe.ingredient_id = ingredients.ingredient_id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch recipes' });
    }

    res.json(results);
  });
});

module.exports = router;