const express = require('express');
const router = express.Router();
const db = require('../config/db');


// create recipe
router.post('/', (req, res) => {
  const { bread_id, ingredient_id, quantity } = req.body;

  const sql = `
    INSERT INTO recipe (bread_id, ingredient_id, quantity)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [bread_id, ingredient_id, quantity], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          error: 'This ingredient is already assigned to this bread'
        });
      }

      console.error(err);
      return res.status(500).json({ error: 'Failed to add recipe' });
    }

    res.json({
      message: 'Recipe added successfully',
      id: result.insertId
    });
  });
});

//read recipes
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


router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  const sql = `
    UPDATE recipe
    SET quantity = ?
    WHERE recipe_id = ?
  `;

  db.query(sql, [quantity, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to update recipe' });
    }

    res.json({ message: 'Recipe updated successfully' });
  });
});



router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM recipe WHERE recipe_id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to delete recipe' });
    }

    res.json({ message: 'Recipe deleted successfully' });
  });
});


module.exports = router;