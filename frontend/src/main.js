import './style.css';

const form = document.getElementById('ingredient-form');
const list = document.getElementById('ingredient-list');




// LOAD INGREDIENTS (GET - READ/display)
async function fetchIngredients() {
  const res = await fetch('http://localhost:5000/api/ingredients');
  const data = await res.json();

  list.innerHTML = '';





  data.forEach(item => {
    const li = document.createElement('li');

    const text = document.createElement('span');
    text.textContent = `${item.ingredient_name} - ${item.quantity_available} ${item.unit}`;

    


    // EDIT BUTTON
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';

    editBtn.addEventListener('click', () => {
      const newName = prompt('Enter new name:', item.ingredient_name);
      const newQuantity = prompt('Enter new quantity:', item.quantity_available);
      const newUnit = prompt('Enter new unit:', item.unit);

      if (!newName || !newQuantity || !newUnit) {
        alert('All fields are required');
        return;
      }

      if (newQuantity <= 0) {
        alert('Quantity must be greater than 0');
        return;
      }

      updateIngredient(item.ingredient_id, newName, newQuantity, newUnit);
    });



    // DELETE BUTTON
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';

    deleteBtn.addEventListener('click', async () => {
      await fetch(`http://localhost:5000/api/ingredients/${item.ingredient_id}`, {
        method: 'DELETE'
      });

      fetchIngredients();
    });

    li.appendChild(text);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    list.appendChild(li);
  });
}



// CREATE INGREDIENT (Postt)
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const quantity = document.getElementById('quantity').value;
  const unit = document.getElementById('unit').value.trim();

  // VALIDATION
  if (!name || !quantity || !unit) {
    alert('Please fill in all fields');
    return;
  }

  if (quantity <= 0) {
    alert('Quantity must be greater than 0');
    return;
  }


  //fetch api(HTTP GET requestt) - for create ingredient
  await fetch('http://localhost:5000/api/ingredients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ingredient_name: name,
      quantity_available: quantity,
      unit: unit
    })
  });

  form.reset();
  fetchIngredients();
});


// UPDATE INGREDIENT (Functionnnn)
async function updateIngredient(id, name, quantity, unit) {
  await fetch(`http://localhost:5000/api/ingredients/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ingredient_name: name,
      quantity_available: quantity,
      unit: unit
    })
  });

  fetchIngredients();
}

// INITIAL LOAD
fetchIngredients();