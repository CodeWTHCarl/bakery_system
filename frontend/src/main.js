import './style.css';

const form = document.getElementById('ingredient-form');
const list = document.getElementById('ingredient-list');

const breadForm = document.getElementById('bread-form');
const breadList = document.getElementById('bread-list');

// NEW (RECIPE)
const recipeForm = document.getElementById('recipe-form');
const recipeList = document.getElementById('recipe-list');
const breadSelect = document.getElementById('bread-select');
const ingredientSelect = document.getElementById('ingredient-select');


// ================= INGREDIENTS =================
async function fetchIngredients() {
  const res = await fetch('http://localhost:5000/api/ingredients');
  const data = await res.json();

  list.innerHTML = '';
  ingredientSelect.innerHTML = '';

  data.forEach(item => {
    // TABLE
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.ingredient_name}</td>
      <td>${item.quantity_available}</td>
      <td>${item.unit}</td>
      <td>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </td>
    `;

    // DROPDOWN OPTION
    const option = document.createElement('option');
    option.value = item.ingredient_id;
    option.textContent = item.ingredient_name;
    ingredientSelect.appendChild(option);

    // EDIT
    row.querySelector('.edit-btn').addEventListener('click', () => {
      const newName = prompt('Enter new name:', item.ingredient_name);
      const newQuantity = prompt('Enter new quantity:', item.quantity_available);
      const newUnit = prompt('Enter new unit:', item.unit);

      if (!newName || !newQuantity || !newUnit) return;

      updateIngredient(item.ingredient_id, newName, newQuantity, newUnit);
    });

    // DELETE
    row.querySelector('.delete-btn').addEventListener('click', async () => {
      await fetch(`http://localhost:5000/api/ingredients/${item.ingredient_id}`, {
        method: 'DELETE'
      });
      fetchIngredients();
    });

    list.appendChild(row);
  });
}

// CREATE INGREDIENT
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const quantity = document.getElementById('quantity').value;
  const unit = document.getElementById('unit').value.trim();

  if (!name || !quantity || !unit) return;

  await fetch('http://localhost:5000/api/ingredients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ingredient_name: name,
      quantity_available: quantity,
      unit: unit
    })
  });

  form.reset();
  fetchIngredients();
});

async function updateIngredient(id, name, quantity, unit) {
  await fetch(`http://localhost:5000/api/ingredients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ingredient_name: name,
      quantity_available: quantity,
      unit: unit
    })
  });

  fetchIngredients();
}


// ================= BREAD =================
async function fetchBreads() {
  const res = await fetch('http://localhost:5000/api/breads');
  const data = await res.json();

  breadList.innerHTML = '';
  breadSelect.innerHTML = '';

  data.forEach(item => {
    // TABLE
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.bread_name}</td>
      <td>${item.category || '-'}</td>
      <td>${item.price}</td>
    `;
    breadList.appendChild(row);

    // DROPDOWN OPTION
    const option = document.createElement('option');
    option.value = item.bread_id;
    option.textContent = item.bread_name;
    breadSelect.appendChild(option);
  });
}

// CREATE BREAD
breadForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const bread_name = document.getElementById('bread_name').value.trim();
  const category = document.getElementById('category').value.trim();
  const price = document.getElementById('price').value;

  if (!bread_name || !price) return;

  await fetch('http://localhost:5000/api/breads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bread_name, category, price })
  });

  breadForm.reset();
  fetchBreads();
});


// ================= RECIPE =================

// LOAD RECIPES
async function fetchRecipes() {
  const res = await fetch('http://localhost:5000/api/recipes');
  const data = await res.json();

  recipeList.innerHTML = '';

  data.forEach(item => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${item.bread_name}</td>
      <td>${item.ingredient_name}</td>
      <td>${item.quantity}</td>
    `;

    recipeList.appendChild(row);
  });
}

// CREATE RECIPE
recipeForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const bread_id = breadSelect.value;
  const ingredient_id = ingredientSelect.value;
  const quantity = document.getElementById('recipe-quantity').value;

  if (!bread_id || !ingredient_id || !quantity) return;

  await fetch('http://localhost:5000/api/recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bread_id, ingredient_id, quantity })
  });

  recipeForm.reset();
  fetchRecipes();
});


// ================= INIT =================
fetchIngredients();
fetchBreads();
fetchRecipes();