const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

const PREDEFINED = [
  { name: 'All-Purpose Flour',  unit: 'kg',  reorder_level: 5    },
  { name: 'Bread Flour',        unit: 'kg',  reorder_level: 5    },
  { name: 'Cake Flour',         unit: 'kg',  reorder_level: 3    },
  { name: 'White Sugar',        unit: 'kg',  reorder_level: 3    },
  { name: 'Brown Sugar',        unit: 'kg',  reorder_level: 2    },
  { name: 'Powdered Sugar',     unit: 'kg',  reorder_level: 2    },
  { name: 'Butter',             unit: 'kg',  reorder_level: 2    },
  { name: 'Margarine',          unit: 'kg',  reorder_level: 2    },
  { name: 'Eggs',               unit: 'pcs', reorder_level: 24   },
  { name: 'Salt',               unit: 'g',   reorder_level: 500  },
  { name: 'Instant Yeast',      unit: 'g',   reorder_level: 200  },
  { name: 'Baking Powder',      unit: 'g',   reorder_level: 300  },
  { name: 'Baking Soda',        unit: 'g',   reorder_level: 200  },
  { name: 'Whole Milk',         unit: 'L',   reorder_level: 5    },
  { name: 'Evaporated Milk',    unit: 'ml',  reorder_level: 500  },
  { name: 'Condensed Milk',     unit: 'ml',  reorder_level: 400  },
  { name: 'Vegetable Oil',      unit: 'L',   reorder_level: 3    },
  { name: 'Vanilla Extract',    unit: 'ml',  reorder_level: 100  },
  { name: 'Cocoa Powder',       unit: 'g',   reorder_level: 500  },
  { name: 'Cinnamon Powder',    unit: 'g',   reorder_level: 200  },
  { name: 'Cheese',             unit: 'kg',  reorder_level: 1    },
  { name: 'Cream Cheese',       unit: 'kg',  reorder_level: 0.5  },
  { name: 'Heavy Cream',        unit: 'ml',  reorder_level: 500  },
  { name: 'Water',              unit: 'ml',  reorder_level: 1000 },
  { name: 'Bread Improver',     unit: 'g',   reorder_level: 200  },
];

// GET predefined list
router.get('/predefined', (req, res) => res.json(PREDEFINED));

// CREATE
router.post('/', (req, res) => {
  const { ingredient_name, quantity_available, unit, reorder_level, cost_per_unit, supplier_id } = req.body;

  if (!ingredient_name || !quantity_available || !unit) {
    return res.status(400).json({ error: 'Name, quantity, and unit are required.' });
  }

  const sql = `
    INSERT INTO ingredients (ingredient_name, quantity_available, unit, reorder_level, cost_per_unit, supplier_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [ingredient_name, quantity_available, unit, reorder_level || 1000, cost_per_unit || 0.00, supplier_id || null], (err, result) => {
    if (err) { console.error(err); return res.status(500).json({ error: 'Failed to add ingredient.' }); }
    res.json({ message: 'Ingredient added successfully', id: result.insertId });
  });
});

// READ all (with supplier name joined)
router.get('/', (req, res) => {
  const sql = `
    SELECT i.*, s.supplier_name
    FROM ingredients i
    LEFT JOIN suppliers s ON i.supplier_id = s.supplier_id
    ORDER BY i.ingredient_name
  `;

  db.query(sql, (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ error: 'Failed to fetch ingredients.' }); }
    res.json(results);
  });
});

// UPDATE
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { ingredient_name, quantity_available, unit, reorder_level, cost_per_unit, supplier_id } = req.body;

  const sql = `
    UPDATE ingredients
    SET ingredient_name = ?, quantity_available = ?, unit = ?,
        reorder_level = ?, cost_per_unit = ?, supplier_id = ?
    WHERE ingredient_id = ?
  `;

  db.query(sql, [ingredient_name, quantity_available, unit, reorder_level || 1000, cost_per_unit || 0.00, supplier_id || null, id], (err) => {
    if (err) { console.error(err); return res.status(500).json({ error: 'Failed to update ingredient.' }); }
    res.json({ message: 'Ingredient updated successfully' });
  });
});

// DELETE
router.delete('/:id', (req, res) => {
  db.query('DELETE FROM ingredients WHERE ingredient_id = ?', [req.params.id], (err) => {
    if (err) { console.error(err); return res.status(500).json({ error: 'Failed to delete ingredient.' }); }
    res.json({ message: 'Ingredient deleted successfully' });
  });
});

module.exports = router;