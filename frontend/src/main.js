import './style.css';

const API      = 'http://localhost:5000/api';
const role     = localStorage.getItem('role');
const token    = localStorage.getItem('token');
const username = localStorage.getItem('username');

if (!token || !role) window.location.href = '/login.html';

// ── Elements ──────────────────────────────────────────────────
const form             = document.getElementById('ingredient-form-manual');
const breadForm        = document.getElementById('bread-form');
const recipeForm       = document.getElementById('recipe-form');
const batchForm        = document.getElementById('batch-form');
const supplierForm     = document.getElementById('supplier-form');
const breadSelect      = document.getElementById('bread-select');
const ingredientSelect = document.getElementById('ingredient-select');
const batchBreadSelect = document.getElementById('batch-bread-select');
const supplierIdSelect = document.getElementById('supplier_id');
const ingredientList   = document.getElementById('ingredient-list');
const breadList        = document.getElementById('bread-list');
const batchList        = document.getElementById('batch-list');
const supplierList     = document.getElementById('supplier-list');

// Hide add forms for staff
if (role === 'staff') {
  ['ingredient-form-manual','bread-form','recipe-form','supplier-form'].forEach(id => {
    document.getElementById(id)?.closest('.card')?.style.setProperty('display','none');
  });
}

// ── Confirm Modal ─────────────────────────────────────────────
const modal      = document.getElementById('confirm-modal');
const confirmYes = document.getElementById('confirm-yes');
const confirmNo  = document.getElementById('confirm-no');
let   confirmCallback = null;

function openConfirm(message, callback) {
  document.getElementById('confirm-message').textContent = message;
  confirmCallback = callback;
  modal.classList.remove('hidden');
}

confirmYes?.addEventListener('click', () => { confirmCallback?.(); modal.classList.add('hidden'); confirmCallback = null; });
confirmNo?.addEventListener('click',  () => { modal.classList.add('hidden'); confirmCallback = null; });

// ── Toast ─────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 50);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 350); }, 3000);
}

// ── Safe Fetch ────────────────────────────────────────────────
async function safeFetch(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers, 'Authorization': `Bearer ${token}` };
  const res     = await fetch(url, { ...options, headers });
  const data    = await res.json();

  if (res.status === 403) {
    showToast('Session expired. Redirecting…', 'error');
    setTimeout(() => { localStorage.clear(); window.location.href = '/login.html'; }, 1800);
    throw new Error('Token expired');
  }

  if (!res.ok) { showToast(data.error || 'Something went wrong', 'error'); throw new Error(data.error); }
  return data;
}

// ── Log Action ────────────────────────────────────────────────
async function logAction(action) {
  try {
    await fetch(`${API}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ action, role })
    });
  } catch (e) { console.warn('Log failed:', e); }
}

// ── Helpers ───────────────────────────────────────────────────
const formatDate     = d => d ? new Date(d).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }) : '—';
const formatDateTime = d => d ? new Date(d).toLocaleString(undefined, { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
const formatCurrency = v => `₱${Number(v || 0).toFixed(2)}`;

// ── Skeleton ─────────────────────────────────────────────────
function showSkeleton(tbody, cols, rows = 4) {
  tbody.innerHTML = Array(rows).fill(0).map(() => `
    <tr class="skeleton-row">
      ${Array(cols).fill(0).map((_,i) => `<td><div class="skeleton-cell" style="width:${i===cols-1?70:Math.random()*30+55}%"></div></td>`).join('')}
    </tr>
  `).join('');
}

// ── Empty State ───────────────────────────────────────────────
function showEmpty(container, icon, title, subtitle, isDiv = false) {
  const html = `<div class="empty-state"><span class="empty-state-icon">${icon}</span><h4>${title}</h4><p>${subtitle}</p></div>`;
  if (isDiv) { container.innerHTML = html; }
  else { container.innerHTML = `<tr><td colspan="20" style="padding:0;border:none;">${html}</td></tr>`; }
}

// ── Search Utility ────────────────────────────────────────────
function setupSearch(inputId, getRows) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    getRows().forEach(row => { row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none'; });
  });
}

// ══════════════════════════════════════════════════════════════
//  CHARTS
// ══════════════════════════════════════════════════════════════
let batchChartInstance = null;
let stockChartInstance = null;

function getChartColors() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    grid: dark ? 'rgba(200,151,58,0.08)' : 'rgba(0,0,0,0.05)',
    text: dark ? '#A89070' : '#A89880',
    gold: '#C8973A', goldLt: '#E8B86D',
    error: '#B83232', success: '#2D7A50',
  };
}

function renderBatchChart(labels, quantities) {
  const ctx = document.getElementById('batchChart');
  if (!ctx) return;
  const c = getChartColors();
  if (batchChartInstance) batchChartInstance.destroy();
  batchChartInstance = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Qty Produced', data: quantities, backgroundColor: labels.map((_,i) => i%2===0 ? c.gold : c.goldLt), borderRadius: 8, borderSkipped: false }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: c.text, font: { family:'DM Sans', size:12 } } }, y: { grid: { color: c.grid }, ticks: { color: c.text, font: { family:'DM Sans', size:12 } }, beginAtZero: true } } }
  });
}

function renderStockChart(normalCount, lowCount) {
  const ctx = document.getElementById('stockChart');
  if (!ctx) return;
  const c = getChartColors();
  if (stockChartInstance) stockChartInstance.destroy();
  if (normalCount + lowCount === 0) return;
  stockChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: ['Normal Stock','Low Stock'], datasets: [{ data: [normalCount, lowCount], backgroundColor: [c.success, c.error], borderWidth: 0, hoverOffset: 8 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position:'bottom', labels: { color: c.text, font: { family:'DM Sans', size:12 }, padding: 16, usePointStyle: true } } } }
  });
}

window.updateChartTheme = () => {
  if (batchChartInstance) { renderBatchChart(batchChartInstance.data.labels, batchChartInstance.data.datasets[0].data); }
  if (stockChartInstance) { renderStockChart(stockChartInstance.data.datasets[0].data[0], stockChartInstance.data.datasets[0].data[1]); }
};

// ══════════════════════════════════════════════════════════════
//  PREDEFINED INGREDIENTS
// ══════════════════════════════════════════════════════════════
async function loadPredefined() {
  const res  = await fetch(`${API}/ingredients/predefined`);
  const data = await res.json();
  const sel  = document.getElementById('predefined-select');
  if (!sel) return;

  data.forEach(item => {
    const opt = document.createElement('option');
    opt.value       = JSON.stringify(item);
    opt.textContent = `${item.name} (${item.unit}, reorder: ${item.reorder_level}${item.unit})`;
    sel.appendChild(opt);
  });

  sel.addEventListener('change', () => {
    if (!sel.value) return;
    const item = JSON.parse(sel.value);
    document.getElementById('name').value          = item.name;
    document.getElementById('unit').value          = item.unit;
    document.getElementById('reorder_level').value = item.reorder_level;
    document.getElementById('quantity').focus();
  });
}

// ══════════════════════════════════════════════════════════════
//  SUPPLIERS
// ══════════════════════════════════════════════════════════════
supplierForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const name = document.getElementById('supplier_name').value.trim();
    await safeFetch(`${API}/suppliers`, {
      method: 'POST',
      body: JSON.stringify({
        supplier_name: name,
        contact:  document.getElementById('supplier_contact').value.trim(),
        email:    document.getElementById('supplier_email').value.trim(),
        address:  document.getElementById('supplier_address').value.trim()
      })
    });
    await logAction(`Added supplier: ${name}`);
    showToast('Supplier added ✓');
    supplierForm.reset();
    fetchSuppliers();
    loadSupplierOptions();
  } catch (_) {}
});

async function fetchSuppliers() {
  if (!supplierList) return;
  showSkeleton(supplierList, 6);
  const res  = await fetch(`${API}/suppliers`);
  const data = await res.json();

  supplierList.innerHTML = '';

  if (data.length === 0) {
    showEmpty(supplierList, '🚚', 'No suppliers yet', 'Add your first supplier using the form above.');
    return;
  }

  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td contenteditable="${role==='admin'}" style="font-weight:500;">${item.supplier_name}</td>
      <td contenteditable="${role==='admin'}">${item.contact || '—'}</td>
      <td contenteditable="${role==='admin'}">${item.email   || '—'}</td>
      <td contenteditable="${role==='admin'}">${item.address || '—'}</td>
      <td><span class="role-badge">${item.ingredient_count} item${item.ingredient_count !== 1 ? 's' : ''}</span></td>
      <td>
        ${role === 'admin' ? `<button class="edit-btn">Save</button><button class="delete-btn">Delete</button>` : '—'}
      </td>
    `;

    row.querySelector('.edit-btn')?.addEventListener('click', async () => {
      const cells = row.querySelectorAll('td');
      try {
        await safeFetch(`${API}/suppliers/${item.supplier_id}`, {
          method: 'PUT',
          body: JSON.stringify({
            supplier_name: cells[0].innerText.trim(),
            contact:       cells[1].innerText.trim(),
            email:         cells[2].innerText.trim(),
            address:       cells[3].innerText.trim()
          })
        });
        await logAction(`Updated supplier: ${cells[0].innerText.trim()}`);
        showToast('Supplier updated ✓');
        fetchSuppliers();
        loadSupplierOptions();
      } catch (_) {}
    });

    row.querySelector('.delete-btn')?.addEventListener('click', () => {
      openConfirm(`Delete supplier "${item.supplier_name}"?`, async () => {
        try {
          await safeFetch(`${API}/suppliers/${item.supplier_id}`, { method: 'DELETE' });
          await logAction(`Deleted supplier: ${item.supplier_name}`);
          showToast('Supplier deleted');
          fetchSuppliers();
          loadSupplierOptions();
        } catch (_) {}
      });
    });

    supplierList.appendChild(row);
  });

  setupSearch('search-suppliers', () => supplierList.querySelectorAll('tr'));
}

// Load supplier options into ingredient form dropdown
async function loadSupplierOptions() {
  if (!supplierIdSelect) return;
  const res  = await fetch(`${API}/suppliers`);
  const data = await res.json();
  supplierIdSelect.innerHTML = '<option value="">— No supplier —</option>';
  data.forEach(s => {
    supplierIdSelect.appendChild(new Option(s.supplier_name, s.supplier_id));
  });
}

window.fetchSuppliers = fetchSuppliers;

// ══════════════════════════════════════════════════════════════
//  INGREDIENTS
// ══════════════════════════════════════════════════════════════

// Cache recipe costs keyed by bread_id for use in bread table
let recipeCostByBread = {};

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const name = document.getElementById('name').value.trim();
    await safeFetch(`${API}/ingredients`, {
      method: 'POST',
      body: JSON.stringify({
        ingredient_name:    name,
        quantity_available: document.getElementById('quantity').value,
        unit:               document.getElementById('unit').value,
        cost_per_unit:      document.getElementById('cost_per_unit').value,
        reorder_level:      document.getElementById('reorder_level').value,
        supplier_id:        document.getElementById('supplier_id').value || null
      })
    });
    await logAction(`Added ingredient: ${name}`);
    showToast('Ingredient added ✓');
    form.reset();
    document.getElementById('predefined-select').value = '';
    fetchIngredients();
  } catch (_) {}
});

async function fetchIngredients() {
  showSkeleton(ingredientList, 8);
  const res  = await fetch(`${API}/ingredients`);
  const data = await res.json();

  document.getElementById('total-ingredients').textContent = data.length;
  const lowItems = data.filter(i => Number(i.quantity_available) <= Number(i.reorder_level ?? 1000));
  document.getElementById('low-stock').textContent = lowItems.length;

  // Low stock alert panel
  const card   = document.getElementById('low-stock-card');
  const listEl = document.getElementById('low-stock-list');
  if (lowItems.length > 0) {
    card.style.display = 'block';
    listEl.innerHTML   = lowItems.map(i => `
      <div class="low-stock-item">
        <span class="low-stock-item-name">🌾 ${i.ingredient_name}</span>
        <span class="low-stock-item-qty">${i.quantity_available} ${i.unit} left — reorder at ${i.reorder_level} ${i.unit}</span>
      </div>
    `).join('');
  } else { card.style.display = 'none'; }

  renderStockChart(data.length - lowItems.length, lowItems.length);

  ingredientList.innerHTML = '';
  ingredientSelect.innerHTML = '';

  if (data.length === 0) {
    showEmpty(ingredientList, '🌾', 'No ingredients yet', 'Add your first ingredient using the form above.');
    return;
  }

  data.forEach(item => {
    const isLow = Number(item.quantity_available) <= Number(item.reorder_level ?? 1000);
    const row   = document.createElement('tr');

    row.innerHTML = `
      <td contenteditable="${role==='admin'}">${item.ingredient_name}</td>
      <td contenteditable="${role==='admin'}">${item.quantity_available}</td>
      <td>
        ${role === 'admin'
          ? `<select class="unit-select" style="padding:5px 26px 5px 8px;font-size:13px;min-width:unset;flex:none;width:auto;">
               <option value="g"   ${item.unit==='g'   ?'selected':''}>g</option>
               <option value="kg"  ${item.unit==='kg'  ?'selected':''}>kg</option>
               <option value="ml"  ${item.unit==='ml'  ?'selected':''}>ml</option>
               <option value="L"   ${item.unit==='L'   ?'selected':''}>L</option>
               <option value="pcs" ${item.unit==='pcs' ?'selected':''}>pcs</option>
             </select>`
          : item.unit}
      </td>
      <td contenteditable="${role==='admin'}">${Number(item.cost_per_unit || 0).toFixed(2)}</td>
      <td contenteditable="${role==='admin'}">${item.reorder_level ?? 1000}</td>
      <td><span class="status-badge ${isLow ? 'status-sold' : 'status-available'}">${isLow ? '⚠ Low' : '✓ OK'}</span></td>
      <td>${item.supplier_name ? `<span class="supplier-info"><span class="supplier-dot"></span>${item.supplier_name}</span>` : '—'}</td>
      <td>
        ${role === 'admin' ? `<button class="edit-btn">Save</button><button class="delete-btn">Delete</button>` : '—'}
      </td>
    `;

    row.querySelector('.edit-btn')?.addEventListener('click', async () => {
      const cells = row.querySelectorAll('td');
      const unit  = row.querySelector('.unit-select')?.value || item.unit;
      try {
        await safeFetch(`${API}/ingredients/${item.ingredient_id}`, {
          method: 'PUT',
          body: JSON.stringify({
            ingredient_name:    cells[0].innerText.trim(),
            quantity_available: cells[1].innerText.trim(),
            unit,
            cost_per_unit:      cells[3].innerText.trim(),
            reorder_level:      cells[4].innerText.trim(),
            supplier_id:        item.supplier_id
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

    const opt = document.createElement('option');
    opt.value = item.ingredient_id;
    opt.textContent = `${item.ingredient_name} (${item.unit}, ₱${Number(item.cost_per_unit||0).toFixed(2)}/${item.unit})`;
    ingredientSelect.appendChild(opt);
  });

  setupSearch('search-ingredients', () => ingredientList.querySelectorAll('tr'));
}

// ══════════════════════════════════════════════════════════════
//  BREAD
// ══════════════════════════════════════════════════════════════
breadForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const name = document.getElementById('bread_name').value.trim();
    await safeFetch(`${API}/breads`, {
      method: 'POST',
      body: JSON.stringify({ bread_name: name, category: document.getElementById('category').value.trim(), price: document.getElementById('price').value })
    });
    await logAction(`Added bread: ${name}`);
    showToast('Bread added ✓');
    breadForm.reset();
    fetchBreads();
  } catch (_) {}
});

async function fetchBreads() {
  showSkeleton(breadList, 6);
  const res  = await fetch(`${API}/breads`);
  const data = await res.json();

  document.getElementById('total-breads').textContent = data.length;
  breadList.innerHTML = '';
  breadSelect.innerHTML = '';
  batchBreadSelect.innerHTML = '';

  if (data.length === 0) {
    showEmpty(breadList, '🍞', 'No breads yet', 'Add your first bread product using the form above.');
    return;
  }

  data.forEach(item => {
    const cost   = recipeCostByBread[item.bread_id] || 0;
    const profit = Number(item.price) - cost;
    const row    = document.createElement('tr');

    row.innerHTML = `
      <td contenteditable="${role==='admin'}">${item.bread_name}</td>
      <td contenteditable="${role==='admin'}">${item.category || ''}</td>
      <td contenteditable="${role==='admin'}">${Number(item.price).toFixed(2)}</td>
      <td>${cost > 0 ? formatCurrency(cost) : '<span style="color:var(--text-muted);font-size:12px;">Set recipe costs</span>'}</td>
      <td class="${profit >= 0 ? 'profit-positive' : 'profit-negative'}">${cost > 0 ? formatCurrency(profit) : '—'}</td>
      <td>
        ${role === 'admin' ? `<button class="edit-btn">Save</button><button class="delete-btn">Delete</button>` : '—'}
      </td>
    `;

    row.querySelector('.edit-btn')?.addEventListener('click', async () => {
      const cells = row.querySelectorAll('td');
      try {
        await safeFetch(`${API}/breads/${item.bread_id}`, {
          method: 'PUT',
          body: JSON.stringify({ bread_name: cells[0].innerText.trim(), category: cells[1].innerText.trim(), price: cells[2].innerText.trim() })
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
    breadSelect.appendChild(new Option(item.bread_name, item.bread_id));
    batchBreadSelect.appendChild(new Option(item.bread_name, item.bread_id));
  });

  setupSearch('search-breads', () => breadList.querySelectorAll('tr'));
}

// ══════════════════════════════════════════════════════════════
//  RECIPES
// ══════════════════════════════════════════════════════════════
recipeForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await safeFetch(`${API}/recipes`, {
      method: 'POST',
      body: JSON.stringify({
        bread_id:      breadSelect.value,
        ingredient_id: ingredientSelect.value,
        quantity:      document.getElementById('recipe-quantity').value,
        unit:          document.getElementById('recipe-unit').value
      })
    });
    await logAction(`Added recipe ingredient for bread ID ${breadSelect.value}`);
    showToast('Recipe ingredient added ✓');
    recipeForm.reset();
    fetchRecipes();
  } catch (_) {}
});

let allRecipeData = [];

async function fetchRecipes() {
  const container = document.getElementById('recipe-list');
  container.innerHTML = '<div style="padding:20px;color:var(--text-muted);font-size:14px;">Loading recipes…</div>';

  const res  = await fetch(`${API}/recipes`);
  allRecipeData = await res.json();

  // Build recipe cost cache for bread table
  recipeCostByBread = {};
  allRecipeData.forEach(r => {
    if (!recipeCostByBread[r.bread_id]) recipeCostByBread[r.bread_id] = 0;
    recipeCostByBread[r.bread_id] += Number(r.line_cost || 0);
  });

  renderGroupedRecipes(allRecipeData);

  const searchInput = document.getElementById('search-recipes');
  if (searchInput) {
    searchInput.oninput = () => {
      const q = searchInput.value.toLowerCase().trim();
      renderGroupedRecipes(allRecipeData.filter(r => r.bread_name.toLowerCase().includes(q)));
    };
  }
}

function renderGroupedRecipes(data) {
  const container = document.getElementById('recipe-list');
  container.innerHTML = '';

  if (data.length === 0) {
    showEmpty(container, '📋', 'No recipes yet', 'Link ingredients to bread products using the form above.', true);
    return;
  }

  // Group by bread
  const groups = {};
  data.forEach(item => {
    if (!groups[item.bread_id]) groups[item.bread_id] = { bread_name: item.bread_name, ingredients: [], totalCost: 0 };
    groups[item.bread_id].ingredients.push(item);
    groups[item.bread_id].totalCost += Number(item.line_cost || 0);
  });

  Object.entries(groups).forEach(([breadId, group], index) => {
    const el = document.createElement('div');
    el.className = 'recipe-group' + (index === 0 ? ' open' : '');

    el.innerHTML = `
      <div class="recipe-group-header">
        <div class="recipe-group-title">
          🍞 ${group.bread_name}
          <span class="recipe-group-badge">${group.ingredients.length} ingredient${group.ingredients.length!==1?'s':''}</span>
          ${group.totalCost > 0 ? `<span class="recipe-cost-badge">Cost: ${formatCurrency(group.totalCost)}/piece</span>` : ''}
        </div>
        <span class="recipe-group-chevron">▼</span>
      </div>
      <div class="recipe-group-body"></div>
    `;

    el.querySelector('.recipe-group-header').addEventListener('click', () => el.classList.toggle('open'));

    const body = el.querySelector('.recipe-group-body');

    group.ingredients.forEach(item => {
      const row = document.createElement('div');
      row.className = 'recipe-ingredient-row';

      row.innerHTML = `
        <span class="recipe-ingredient-name">
          🌾 ${item.ingredient_name}
          <span class="unit-note">stock: ${item.stock_unit}</span>
        </span>
        <span class="recipe-ingredient-qty view-mode">${item.quantity} ${item.unit}</span>
        ${item.line_cost > 0 ? `<span class="recipe-ingredient-cost view-mode">${formatCurrency(item.line_cost)}</span>` : ''}
        <div class="recipe-ingredient-actions view-mode-actions">
          ${role === 'admin' ? `<button class="edit-btn">Edit</button><button class="delete-btn">Delete</button>` : ''}
        </div>
        <div class="edit-mode" style="display:none;align-items:center;gap:8px;flex:1;justify-content:flex-end;flex-wrap:wrap;">
          <input  class="recipe-edit-qty"  type="number" value="${item.quantity}" step="0.01" min="0"/>
          <select class="recipe-edit-unit">
            <option value="g"   ${item.unit==='g'  ?'selected':''}>g</option>
            <option value="kg"  ${item.unit==='kg' ?'selected':''}>kg</option>
            <option value="ml"  ${item.unit==='ml' ?'selected':''}>ml</option>
            <option value="L"   ${item.unit==='L'  ?'selected':''}>L</option>
            <option value="pcs" ${item.unit==='pcs'?'selected':''}>pcs</option>
          </select>
          <button class="edit-btn save-btn">Save</button>
          <button class="delete-btn cancel-btn" style="background:rgba(0,0,0,0.05);color:var(--text-muted);border-color:var(--border);">Cancel</button>
        </div>
      `;

      row.querySelector('.edit-btn:not(.save-btn)')?.addEventListener('click', () => {
        row.querySelector('.view-mode')?.style.setProperty('display','none');
        row.querySelector('.view-mode-actions')?.style.setProperty('display','none');
        row.querySelector('.edit-mode').style.display = 'flex';
      });

      row.querySelector('.cancel-btn')?.addEventListener('click', () => {
        row.querySelector('.view-mode')?.style.setProperty('display','inline-block');
        row.querySelector('.view-mode-actions')?.style.setProperty('display','flex');
        row.querySelector('.edit-mode').style.display = 'none';
      });

      row.querySelector('.save-btn')?.addEventListener('click', async () => {
        try {
          await safeFetch(`${API}/recipes/${item.recipe_id}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity: row.querySelector('.recipe-edit-qty').value, unit: row.querySelector('.recipe-edit-unit').value })
          });
          await logAction(`Updated recipe: ${item.bread_name} / ${item.ingredient_name}`);
          showToast('Recipe updated ✓');
          fetchRecipes();
        } catch (_) {}
      });

      row.querySelector('.delete-btn:not(.cancel-btn)')?.addEventListener('click', () => {
        openConfirm(`Remove ${item.ingredient_name} from ${item.bread_name}?`, async () => {
          try {
            await safeFetch(`${API}/recipes/${item.recipe_id}`, { method: 'DELETE' });
            await logAction(`Deleted recipe: ${item.bread_name} / ${item.ingredient_name}`);
            showToast('Recipe ingredient removed');
            fetchRecipes();
          } catch (_) {}
        });
      });

      body.appendChild(row);
    });

    container.appendChild(el);
  });
}

// ══════════════════════════════════════════════════════════════
//  BATCH / PRODUCTION
// ══════════════════════════════════════════════════════════════
batchForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await safeFetch(`${API}/batch`, {
      method: 'POST',
      body: JSON.stringify({
        bread_id:    batchBreadSelect.value,
        quantity:    document.getElementById('batch-quantity').value,
        baking_date: document.getElementById('baking-date').value,
        expiry_date: document.getElementById('expiry-date').value
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
  showSkeleton(batchList, 9);
  const res  = await fetch(`${API}/batch`);
  const data = await res.json();

  document.getElementById('total-batches').textContent = data.length;
  batchList.innerHTML = '';

  if (data.length === 0) {
    showEmpty(batchList, '⚙️', 'No batches recorded', 'Record your first production batch using the form above.');
    document.getElementById('batch-cost-summary').style.display = 'none';
    renderBatchChart([], []);
    return;
  }

  // Compute summary totals
  let totalCost    = 0;
  let totalRevenue = 0;

  const breadTotals = {};
  data.forEach(item => {
    breadTotals[item.bread_name] = (breadTotals[item.bread_name] || 0) + Number(item.quantity);
    totalCost    += Number(item.total_batch_cost || 0);
    totalRevenue += Number(item.selling_price || 0) * Number(item.quantity);
  });

  const totalProfit = totalRevenue - totalCost;

  document.getElementById('batch-cost-summary').style.display = 'grid';
  document.getElementById('summary-total-cost').textContent    = formatCurrency(totalCost);
  document.getElementById('summary-total-revenue').textContent = formatCurrency(totalRevenue);
  document.getElementById('summary-total-profit').textContent  = formatCurrency(totalProfit);

  const profitCard = document.getElementById('summary-profit-card');
  profitCard.classList.toggle('loss', totalProfit < 0);

  renderBatchChart(Object.keys(breadTotals), Object.values(breadTotals));

  data.forEach(item => {
    const profit = Number(item.selling_price || 0) - Number(item.cost_per_bread || 0);
    const row    = document.createElement('tr');

    row.innerHTML = `
      <td>${item.bread_name}</td>
      <td>${item.quantity}</td>
      <td>${formatDate(item.baking_date)}</td>
      <td>${formatDate(item.expiry_date)}</td>
      <td>${item.cost_per_bread > 0 ? formatCurrency(item.cost_per_bread) : '—'}</td>
      <td>${item.total_batch_cost > 0 ? formatCurrency(item.total_batch_cost) : '—'}</td>
      <td class="${profit >= 0 ? 'profit-positive' : 'profit-negative'}">${item.cost_per_bread > 0 ? formatCurrency(profit) : '—'}</td>
      <td><span class="status-badge ${item.status==='Available'?'status-available':'status-sold'}">${item.status}</span></td>
      <td>
        ${item.status === 'Available'
          ? `<button class="sold-btn" data-id="${item.batch_id}">Mark Sold</button>`
          : '<span style="font-size:12px;color:var(--text-muted);">Sold</span>'}
      </td>
    `;

    // Mark as Sold
    row.querySelector('.sold-btn')?.addEventListener('click', async function() {
      const id = this.dataset.id;
      try {
        await safeFetch(`${API}/batch/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'Sold' })
        });
        await logAction(`Marked batch #${id} as Sold`);
        showToast('Batch marked as Sold ✓');
        fetchBatches();
      } catch (_) {}
    });

    batchList.appendChild(row);
  });

  setupSearch('search-batch', () => batchList.querySelectorAll('tr'));
}

// ══════════════════════════════════════════════════════════════
//  LOGS
// ══════════════════════════════════════════════════════════════
async function fetchLogs() {
  const logList = document.getElementById('log-list');
  if (!logList) return;
  showSkeleton(logList, 3);
  const res  = await fetch(`${API}/logs`);
  const data = await res.json();
  logList.innerHTML = '';

  if (data.length === 0) {
    showEmpty(logList, '📝', 'No activity yet', 'Actions taken in the system will appear here.');
    return;
  }

  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${item.action}</td><td><span class="role-badge">${item.role}</span></td><td>${formatDateTime(item.created_at)}</td>`;
    logList.appendChild(row);
  });

  setupSearch('search-logs', () => logList.querySelectorAll('tr'));
}

// ══════════════════════════════════════════════════════════════
//  USERS
// ══════════════════════════════════════════════════════════════
document.getElementById('add-user-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const newUsername = document.getElementById('new-username').value.trim();
    const newPassword = document.getElementById('new-password').value;
    const newRole     = document.getElementById('new-role').value;
    await safeFetch(`${API}/auth/register`, { method: 'POST', body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole }) });
    await logAction(`Created user: ${newUsername} (${newRole})`);
    showToast(`User "${newUsername}" created ✓`);
    document.getElementById('add-user-form').reset();
    fetchUsers();
  } catch (_) {}
});

async function fetchUsers() {
  const userList = document.getElementById('user-list');
  if (!userList) return;
  showSkeleton(userList, 3);
  try {
    const data = await safeFetch(`${API}/users`);
    userList.innerHTML = '';
    if (data.length === 0) { showEmpty(userList, '👥', 'No users found', ''); return; }
    data.forEach(item => {
      const isMe = item.username === username;
      const row  = document.createElement('tr');
      row.innerHTML = `
        <td>${item.username} ${isMe ? '<span class="role-badge">You</span>' : ''}</td>
        <td><span class="role-badge">${item.role}</span></td>
        <td>${!isMe ? `<button class="delete-btn">Delete</button>` : '—'}</td>
      `;
      row.querySelector('.delete-btn')?.addEventListener('click', () => {
        openConfirm(`Delete user "${item.username}"?`, async () => {
          try {
            await safeFetch(`${API}/users/${item.user_id}`, { method: 'DELETE' });
            await logAction(`Deleted user: ${item.username}`);
            showToast('User deleted');
            fetchUsers();
          } catch (_) {}
        });
      });
      userList.appendChild(row);
    });
  } catch (_) {}
}

// Expose to inline scripts
window.fetchLogs      = fetchLogs;
window.fetchUsers     = fetchUsers;
window.fetchSuppliers = fetchSuppliers;

// ── Init ──────────────────────────────────────────────────────
loadPredefined();
loadSupplierOptions();
fetchIngredients();
fetchBreads();
fetchRecipes();
fetchBatches();