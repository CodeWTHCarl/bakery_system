import './style.css';

const role = localStorage.getItem('role');

if (!role) {
  window.location.href = '/login.html';
}

// ================= TOAST =================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 100);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ================= CONFIRM MODAL =================
let confirmCallback = null;

function showConfirm(message, callback) {
  const modal = document.getElementById('confirm-modal');
  const msg = document.getElementById('confirm-message');

  msg.textContent = message;
  modal.classList.remove('hidden');

  confirmCallback = callback;
}

document.getElementById('confirm-yes')?.addEventListener('click', () => {
  if (confirmCallback) confirmCallback();
  document.getElementById('confirm-modal').classList.add('hidden');
});

document.getElementById('confirm-no')?.addEventListener('click', () => {
  document.getElementById('confirm-modal').classList.add('hidden');
});

// ================= LOG =================
async function logAction(action) {
  await fetch('http://localhost:5000/api/logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action,
      role
    })
  });
}

// INGREDIENT
const form = document.getElementById('ingredient-form');
const list = document.getElementById('ingredient-list');

// BREAD
const breadForm = document.getElementById('bread-form');
const breadList = document.getElementById('bread-list');

// RECIPE
const recipeForm = document.getElementById('recipe-form');
const recipeList = document.getElementById('recipe-list');
const breadSelect = document.getElementById('bread-select');
const ingredientSelect = document.getElementById('ingredient-select');

// BATCH
const batchForm = document.getElementById('batch-form');
const batchList = document.getElementById('batch-list');
const batchBreadSelect = document.getElementById('batch-bread-select');


// ================= INGREDIENTS =================
async function fetchIngredients() {
  const res = await fetch('http://localhost:5000/api/ingredients');
  const data = await res.json();

  list.innerHTML = '';
  ingredientSelect.innerHTML = '';

  data.forEach(item => {
    const row = document.createElement('tr');
    const isLow = item.quantity_available <= (item.reorder_level || 100);

    row.innerHTML = `
      <td>${item.ingredient_name}</td>
      <td style="color:${isLow ? 'red' : 'black'}">
        ${item.quantity_available} ${isLow ? '⚠ LOW' : ''}
      </td>
      <td>${item.unit}</td>
      <td>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </td>
    `;

    const option = document.createElement('option');
    option.value = item.ingredient_id;
    option.textContent = item.ingredient_name;
    ingredientSelect.appendChild(option);

    if (role !== 'staff') {

      row.querySelector('.delete-btn').addEventListener('click', () => {
        showConfirm('Delete this ingredient?', async () => {
          await fetch(`http://localhost:5000/api/ingredients/${item.ingredient_id}`, {
            method: 'DELETE'
          });

          await logAction('Deleted ingredient: ' + item.ingredient_name);
          showToast('Ingredient deleted');
          fetchIngredients();
        });
      });

    } else {
      row.querySelector('.edit-btn').style.display = 'none';
      row.querySelector('.delete-btn').style.display = 'none';
    }

    list.appendChild(row);
  });
}


// ================= BREAD =================
async function fetchBreads() {
  const res = await fetch('http://localhost:5000/api/breads');
  const data = await res.json();

  breadList.innerHTML = '';
  breadSelect.innerHTML = '';
  batchBreadSelect.innerHTML = '';

  data.forEach(item => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${item.bread_name}</td>
      <td>${item.category || '-'}</td>
      <td>${item.price}</td>
      <td>
        <button class="delete-btn">Delete</button>
      </td>
    `;

    if (role !== 'staff') {
      row.querySelector('.delete-btn').addEventListener('click', () => {
        showConfirm('Delete this bread?', async () => {
          await fetch(`http://localhost:5000/api/breads/${item.bread_id}`, {
            method: 'DELETE'
          });

          await logAction('Deleted bread: ' + item.bread_name);
          showToast('Bread deleted');
          fetchBreads();
        });
      });
    } else {
      row.querySelector('.delete-btn').style.display = 'none';
    }

    breadList.appendChild(row);

    const opt1 = document.createElement('option');
    opt1.value = item.bread_id;
    opt1.textContent = item.bread_name;
    breadSelect.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = item.bread_id;
    opt2.textContent = item.bread_name;
    batchBreadSelect.appendChild(opt2);
  });
}


// ================= RECIPE =================
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
      <td>
        <button class="delete-btn">Delete</button>
      </td>
    `;

    if (role !== 'staff') {
      row.querySelector('.delete-btn').addEventListener('click', () => {
        showConfirm('Delete this recipe?', async () => {
          await fetch(`http://localhost:5000/api/recipes/${item.recipe_id}`, {
            method: 'DELETE'
          });

          await logAction('Deleted recipe');
          showToast('Recipe deleted');
          fetchRecipes();
        });
      });
    } else {
      row.querySelector('.delete-btn').style.display = 'none';
    }

    recipeList.appendChild(row);
  });
}


// ================= BATCH =================
batchForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const bread_id = document.getElementById('batch-bread-select').value;
  const quantity = document.getElementById('batch-quantity').value;
  const baking_date = document.getElementById('baking-date').value;
  const expiry_date = document.getElementById('expiry-date').value;
  const status = document.getElementById('status').value;

  await fetch('http://localhost:5000/api/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bread_id, quantity, baking_date, expiry_date, status })
  });

  await logAction('Recorded batch');
  showToast('Batch recorded');

  batchForm.reset();
  fetchBatches();
});


// ================= INIT =================
fetchIngredients();
fetchBreads();
fetchRecipes();
fetchBatches();
loadDashboard();