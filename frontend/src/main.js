import './style.css';

const form = document.getElementById('ingredient-form');
const list = document.getElementById('ingredient-list');

//Load ingredients (READ)
async function fetchIngredients() {
  const res = await fetch('http://localhost:5000/api/ingredients');
  const data = await res.json();

  list.innerHTML = '';

  data.forEach(item => {
  const li = document.createElement('li');

  li.textContent = `${item.ingredient_name} - ${item.quantity_available} ${item.unit}`;

  // Delete button
  const btn = document.createElement('button');
  btn.textContent = 'Delete';

  btn.addEventListener('click', async () => {
    await fetch(`http://localhost:5000/api/ingredients/${item.ingredient_id}`, {
      method: 'DELETE'
    });

    fetchIngredients();
  });

  li.appendChild(btn);
  list.appendChild(li);
});
}

//Add ingredient (CREATE)
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const quantity = document.getElementById('quantity').value;
  const unit = document.getElementById('unit').value.trim();

  //Validation
  if (!name || !quantity || !unit) {
    alert('Please fill in all fields');
    return;
  }

  if (quantity <= 0) {
    alert('Quantity must be greater than 0');
    return;
  }

  const ingredient = {
    ingredient_name: name,
    quantity_available: quantity,
    unit: unit
  };

  await fetch('http://localhost:5000/api/ingredients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(ingredient)
  });

  form.reset();
  fetchIngredients();
});

// 🔹 Load on start
fetchIngredients();