import './style.css';

const API      = 'http://localhost:5000/api';
const role     = localStorage.getItem('role');
const token    = localStorage.getItem('token');
const username = localStorage.getItem('username');

// ── Auth guard ────────────────────────────────────────────────
if (!token || !role) {
  window.location.href = '/login.html';
}

// ── Show username in sidebar ──────────────────────────────────
const userRoleEl = document.getElementById('user-role');
if (userRoleEl) userRoleEl.textContent = role.toUpperCase();

const userNameEl = document.getElementById('user-name');
if (userNameEl) userNameEl.textContent = username || '';

// ── Show/hide admin-only nav items ────────────────────────────
if (role !== 'admin') {
  document.querySelectorAll('.admin-only').forEach(el => el.remove());
}

// ================= ELEMENTS =================
const form             = document.getElementById('ingredient-form');
const breadForm        = document.getElementById('bread-form');
const recipeForm       = document.getElementById('recipe-form');
const batchForm        = document.getElementById('batch-form');
const breadSelect      = document.getElementById('bread-select');
const ingredientSelect = document.getElementById('ingredient-select');
const batchBreadSelect = document.getElementById('batch-bread-select');
const ingredientList   = document.getElementById('ingredient-list');
const breadList        = document.getElementById('bread-list');
const recipeList       = document.getElementById('recipe-list');
const batchList        = document.getElementById('batch-list');

// ── Role guard — hide add-forms for staff ─────────────────────
if (role === 'staff') {
  [form, breadForm, recipeForm].forEach(f => {
    if (f) f.style.display = 'none';
  });
}

// ================= CONFIRM MODAL =================
const modal      = document.getElementById('confirm-modal');
const confirmYes = document.getElementById('confirm-yes');
const confirmNo  = document.getElementById('confirm-no');
let   confirmCallback = null;

function openConfirm(message, callback) {
  const msg = document.getElementById('confirm-message');
  if (msg) msg.textContent = message;
  confirmCallback = callback;
  modal.classList.remove('hidden');
}

confirmYes?.addEventListener('click', () => {
  if (confirmCallback) confirmCallback();
  modal.classList.add('hidden');
  confirmCallback = null;
});

confirmNo?.addEventListener('click', () => {
  modal.classList.add('hidden');
  confirmCallback = null;
});

// ================= TOAST =================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className   = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 50);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, 3000);
}

// ================= SAFE FETCH (with JWT) =================
async function safeFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    'Authorization': `Bearer ${token}`       // ← JWT on every request
  };

  const res  = await fetch(url, { ...options, headers });
  const data = await res.json();

  // Session expired
  if (res.status === 403) {
    showToast('Session expired. Redirecting to login…', 'error');
    setTimeout(() => {
      localStorage.clear();
      window.location.href = '/login.html';
    }, 1800);
    throw new Error('Token expired');
  }

  if (!res.ok) {
    showToast(data.error || 'Something went wrong', 'error');
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// ================= ACTIVITY LOG =================
async function logAction(action) {
  try {
    await fetch(`${API}/logs`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action, role })
    });
  } catch (err) {
    console.warn('Log failed:', err);
  }
}

// ================= HELPERS =================
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ================================================================
//  INGREDIENTS
// ================================================================
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const name = document.getElementById('name').value.trim();
    await safeFetch(`${API}/ingredients`, {
      method: 'POST',
      body: JSON.stringify({
        ingredient_name:    name,
        quantity_available: document.getElementById('quantity').value,
        unit:               document.getElementById('unit').value.trim()
      })
    });
    await logAction(`Added ingredient: ${name}`);
    showToast('Ingredient added ✓');
    form.reset();
    fetchIngredients();
  } catch (_) {}
});

async function fetchIngredients() {
  const res  = await fetch(`${API}/ingredients`);
  const data = await res.json();

  document.getElementById('total-ingredients').textContent = data.length;
  const lowCount = data.filter(i => Number(i.quantity_available) <= Number(i.reorder_level ?? 100)).length;
  document.getElementById('low-stock').textContent = lowCount;

  ingredientList.innerHTML = '';
  ingredientSelect.innerHTML = '';

  data.forEach(item => {
    const isLow = Number(item.quantity_available) <= Number(item.reorder_level ?? 100);
    const row   = document.createElement('tr');

    row.innerHTML = `
      <td contenteditable="${role === 'admin'}">${item.ingredient_name}</td>
      <td contenteditable="${role === 'admin'}" style="color:${isLow ? 'var(--error)' : 'inherit'}">
        ${item.quantity_available}${isLow ? ' ⚠' : ''}
      </td>
      <td contenteditable="${role === 'admin'}">${item.unit}</td>
      <td>
        ${role === 'admin' ? `
          <button class="edit-btn">Save</button>
          <button class="delete-btn">Delete</button>` : '—'}
      </td>
    `;

    row.querySelector('.edit-btn')?.addEventListener('click', async () => {
      const cells  = row.querySelectorAll('td');
      const rawQty = cells[1].innerText.replace(/\s*⚠.*/, '').trim();
      try {
        await safeFetch(`${API}/ingredients/${item.ingredient_id}`, {
          method: 'PUT',
          body: JSON.stringify({
            ingredient_name:    cells[0].innerText.trim(),
            quantity_available: rawQty,
            unit:               cells[2].innerText.trim()
          })
        });
        await logAction(`Updated ingredient: ${cells[0].innerText.trim()}`);
        showToast('Ingredient updated ✓');
        fetchIngredients();
      } catch (_) {}
    });

    row.querySelector('.delete-btn')?.addEventListener('click', () => {
      openConfirm(`Delete "${item.ingredient_name}"?`, async () => {
        try {
          await safeFetch(`${API}/ingredients/${item.ingredient_id}`, { method: 'DELETE' });
          await logAction(`Deleted ingredient: ${item.ingredient_name}`);
          showToast('Ingredient deleted');
          fetchIngredients();
        } catch (_) {}
      });
    });

    ingredientList.appendChild(row);

    const option = document.createElement('option');
    option.value       = item.ingredient_id;
    option.textContent = item.ingredient_name;
    ingredientSelect.appendChild(option);
  });
}

// ================================================================
//  BREAD
// ================================================================
breadForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const name = document.getElementById('bread_name').value.trim();
    await safeFetch(`${API}/breads`, {
      method: 'POST',
      body: JSON.stringify({
        bread_name: name,
        category:   document.getElementById('category').value.trim(),
        price:      document.getElementById('price').value
      })
    });
    await logAction(`Added bread: ${name}`);
    showToast('Bread added ✓');
    breadForm.reset();
    fetchBreads();
  } catch (_) {}
});

async function fetchBreads() {
  const res  = await fetch(`${API}/breads`);
  const data = await res.json();

  document.getElementById('total-breads').textContent = data.length;
  breadList.innerHTML      = '';
  breadSelect.innerHTML    = '';
  batchBreadSelect.innerHTML = '';

  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td contenteditable="${role === 'admin'}">${item.bread_name}</td>
      <td contenteditable="${role === 'admin'}">${item.category || ''}</td>
      <td contenteditable="${role === 'admin'}">${item.price}</td>
      <td>
        ${role === 'admin' ? `
          <button class="edit-btn">Save</button>
          <button class="delete-btn">Delete</button>` : '—'}
      </td>
    `;

    row.querySelector('.edit-btn')?.addEventListener('click', async () => {
      const cells = row.querySelectorAll('td');
      try {
        await safeFetch(`${API}/breads/${item.bread_id}`, {
          method: 'PUT',
          body: JSON.stringify({
            bread_name: cells[0].innerText.trim(),
            category:   cells[1].innerText.trim(),
            price:      cells[2].innerText.trim()
          })
        });
        await logAction(`Updated bread: ${cells[0].innerText.trim()}`);
        showToast('Bread updated ✓');
        fetchBreads();
      } catch (_) {}
    });

    row.querySelector('.delete-btn')?.addEventListener('click', () => {
      openConfirm(`Delete "${item.bread_name}"?`, async () => {
        try {
          await safeFetch(`${API}/breads/${item.bread_id}`, { method: 'DELETE' });
          await logAction(`Deleted bread: ${item.bread_name}`);
          showToast('Bread deleted');
          fetchBreads();
        } catch (_) {}
      });
    });

    breadList.appendChild(row);
    const opt = new Option(item.bread_name, item.bread_id);
    breadSelect.appendChild(opt);
    batchBreadSelect.appendChild(opt.cloneNode(true));
  });
}

// ================================================================
//  RECIPES
// ================================================================
recipeForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await safeFetch(`${API}/recipes`, {
      method: 'POST',
      body: JSON.stringify({
        bread_id:      breadSelect.value,
        ingredient_id: ingredientSelect.value,
        quantity:      document.getElementById('recipe-quantity').value
      })
    });
    await logAction(`Added recipe for bread ID ${breadSelect.value}`);
    showToast('Recipe added ✓');
    recipeForm.reset();
    fetchRecipes();
  } catch (_) {}
});

async function fetchRecipes() {
  const res  = await fetch(`${API}/recipes`);
  const data = await res.json();
  recipeList.innerHTML = '';

  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.bread_name}</td>
      <td>${item.ingredient_name}</td>
      <td contenteditable="${role === 'admin'}">${item.quantity}</td>
      <td>
        ${role === 'admin' ? `
          <button class="edit-btn">Save</button>
          <button class="delete-btn">Delete</button>` : '—'}
      </td>
    `;

    row.querySelector('.edit-btn')?.addEventListener('click', async () => {
      const cells = row.querySelectorAll('td');
      try {
        await safeFetch(`${API}/recipes/${item.recipe_id}`, {
          method: 'PUT',
          body: JSON.stringify({ quantity: cells[2].innerText.trim() })
        });
        await logAction(`Updated recipe: ${item.bread_name} / ${item.ingredient_name}`);
        showToast('Recipe updated ✓');
        fetchRecipes();
      } catch (_) {}
    });

    row.querySelector('.delete-btn')?.addEventListener('click', () => {
      openConfirm(
        `Remove ${item.ingredient_name} from ${item.bread_name}?`,
        async () => {
          try {
            await safeFetch(`${API}/recipes/${item.recipe_id}`, { method: 'DELETE' });
            await logAction(`Deleted recipe: ${item.bread_name} / ${item.ingredient_name}`);
            showToast('Recipe deleted');
            fetchRecipes();
          } catch (_) {}
        }
      );
    });

    recipeList.appendChild(row);
  });
}

// ================================================================
//  BATCH / PRODUCTION
// ================================================================
batchForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await safeFetch(`${API}/batch`, {
      method: 'POST',
      body: JSON.stringify({
        bread_id:    batchBreadSelect.value,
        quantity:    document.getElementById('batch-quantity').value,
        baking_date: document.getElementById('baking-date').value,
        expiry_date: document.getElementById('expiry-date').value,
        status:      document.getElementById('status').value
      })
    });
    await logAction('Recorded production batch');
    showToast('Batch recorded ✓');
    batchForm.reset();
    fetchBatches();
    fetchIngredients();
  } catch (_) {}
});

async function fetchBatches() {
  const res  = await fetch(`${API}/batch`);
  const data = await res.json();

  document.getElementById('total-batches').textContent = data.length;
  batchList.innerHTML = '';

  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.bread_name}</td>
      <td>${item.quantity}</td>
      <td>${formatDate(item.baking_date)}</td>
      <td>${formatDate(item.expiry_date)}</td>
      <td>
        <span class="status-badge ${item.status === 'Available' ? 'status-available' : 'status-sold'}">
          ${item.status}
        </span>
      </td>
    `;
    batchList.appendChild(row);
  });
}

// ================================================================
//  ACTIVITY LOGS
// ================================================================
async function fetchLogs() {
  const res  = await fetch(`${API}/logs`);
  const data = await res.json();
  const logList = document.getElementById('log-list');
  if (!logList) return;
  logList.innerHTML = '';

  if (data.length === 0) {
    logList.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:28px;">No activity recorded yet.</td></tr>`;
    return;
  }

  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.action}</td>
      <td><span class="role-badge">${item.role}</span></td>
      <td>${formatDateTime(item.created_at)}</td>
    `;
    logList.appendChild(row);
  });
}

// ================================================================
//  USERS (Admin only)
// ================================================================
const addUserForm = document.getElementById('add-user-form');

addUserForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const newUsername = document.getElementById('new-username').value.trim();
    const newPassword = document.getElementById('new-password').value;
    const newRole     = document.getElementById('new-role').value;

    await safeFetch(`${API}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole })
    });

    await logAction(`Created new user account: ${newUsername} (${newRole})`);
    showToast(`User "${newUsername}" created ✓`);
    addUserForm.reset();
    fetchUsers();
  } catch (_) {}
});

async function fetchUsers() {
  const userList = document.getElementById('user-list');
  if (!userList) return;

  try {
    const data = await safeFetch(`${API}/users`);
    userList.innerHTML = '';

    data.forEach(item => {
      const isMe = item.username === username;
      const row  = document.createElement('tr');

      row.innerHTML = `
        <td>${item.username} ${isMe ? '<span class="role-badge">You</span>' : ''}</td>
        <td><span class="role-badge">${item.role}</span></td>
        <td>
          ${!isMe ? `<button class="delete-btn">Delete</button>` : '—'}
        </td>
      `;

      row.querySelector('.delete-btn')?.addEventListener('click', () => {
        openConfirm(`Delete user "${item.username}"?`, async () => {
          try {
            await safeFetch(`${API}/users/${item.user_id}`, { method: 'DELETE' });
            await logAction(`Deleted user account: ${item.username}`);
            showToast('User deleted');
            fetchUsers();
          } catch (_) {}
        });
      });

      userList.appendChild(row);
    });
  } catch (_) {}
}

// Expose fetchLogs globally for inline showSection() in index.html
window.fetchLogs  = fetchLogs;
window.fetchUsers = fetchUsers;

// ================================================================
//  INIT
// ================================================================
fetchIngredients();
fetchBreads();
fetchRecipes();
fetchBatches();