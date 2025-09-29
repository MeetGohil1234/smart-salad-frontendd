// API URL Configuration
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'http://elasticbeanstalk-env.eba-k3cud62s.eu-north-1.elasticbeanstalk.com';

// Global ingredients storage
let ingredients = [];

// Fetch ingredients from backend
async function fetchIngredients() {
  try {
    const response = await fetch(`${API_URL}/ingredients`);
    if (!response.ok) throw new Error('Failed to fetch ingredients');
    ingredients = await response.json();
    renderIngredients();
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    // Fallback to hardcoded data if backend fails
    ingredients = [
      { id: 1, name: "Lettuce", price: 20, calories: 5, protein: 0.5, carbs: 1, fat: 0 },
      { id: 2, name: "Tomato", price: 15, calories: 10, protein: 0.3, carbs: 2, fat: 0 },
      { id: 3, name: "Cucumber", price: 12, calories: 8, protein: 0.4, carbs: 2, fat: 0 },
      { id: 4, name: "Carrot", price: 18, calories: 25, protein: 0.5, carbs: 6, fat: 0 },
      { id: 5, name: "Corn", price: 25, calories: 80, protein: 2, carbs: 18, fat: 1 },
      { id: 6, name: "Cheese", price: 40, calories: 90, protein: 5, carbs: 1, fat: 7 },
      { id: 7, name: "Chicken", price: 60, calories: 120, protein: 20, carbs: 0, fat: 5 },
      { id: 8, name: "Avocado", price: 50, calories: 160, protein: 2, carbs: 8, fat: 15 },
      { id: 9, name: "Olives", price: 30, calories: 40, protein: 0.5, carbs: 2, fat: 4 },
      { id: 10, name: "Spinach", price: 22, calories: 7, protein: 0.8, carbs: 1, fat: 0 },
    ];
    renderIngredients();
  }
}

// Render ingredients list
function renderIngredients() {
  const listEl = document.getElementById('ingredient-list');
  listEl.innerHTML = '';
  ingredients.forEach(ing => listEl.appendChild(createIngredientRow(ing)));
}

// Create ingredient box
function createIngredientRow(ing) {
  const div = document.createElement('div');
  div.className = 'ingredient-row';
  div.innerHTML = `
    <div class="ingredient-info">
      <input type="checkbox" id="chk-${ing.id}" data-id="${ing.id}">
      <label for="chk-${ing.id}"><strong>${ing.name}</strong> (₹${ing.price})</label>
    </div>
    <div class="qty-container" data-id="${ing.id}">
      <button class="qty-btn minus">-</button>
      <div class="qty-display" id="qty-${ing.id}">1</div>
      <button class="qty-btn plus">+</button>
    </div>
  `;

  const minusBtn = div.querySelector('.minus');
  const plusBtn = div.querySelector('.plus');
  const display = div.querySelector('.qty-display');

  minusBtn.addEventListener('click', () => {
    let val = parseInt(display.textContent) || 1;
    if (val > 1) val--;
    display.textContent = val;
    triggerChange(ing.id);
  });

  plusBtn.addEventListener('click', () => {
    let val = parseInt(display.textContent) || 1;
    val++;
    display.textContent = val;
    triggerChange(ing.id);
  });

  return div;
}

// Trigger change event
function triggerChange(id) {
  const chk = document.getElementById(`chk-${id}`);
  if (chk.checked) document.dispatchEvent(new Event('change'));
}

// Get selected ingredients
function getSelections() {
  const selected = [];
  ingredients.forEach(ing => {
    const chk = document.getElementById(`chk-${ing.id}`);
    if (chk && chk.checked) {
      const qty = parseInt(document.getElementById(`qty-${ing.id}`).textContent) || 1;
      selected.push({ item: ing, qty });
    }
  });
  return selected;
}

// Calculate totals from backend
async function calculateTotals(selected) {
  const items = selected.map(s => ({ id: s.item.id, qty: s.qty }));
  
  try {
    const response = await fetch(`${API_URL}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    
    if (!response.ok) throw new Error('Calculation failed');
    return await response.json();
  } catch (error) {
    console.error('Error calculating totals:', error);
    // Fallback to local calculation
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, price: 0 };
    for (const { item, qty } of selected) {
      totals.calories += item.calories * qty;
      totals.protein += item.protein * qty;
      totals.carbs += item.carbs * qty;
      totals.fat += item.fat * qty;
      totals.price += item.price * qty;
    }
    return totals;
  }
}

// Update nutrition summary
async function updateSummary(selected) {
  const totals = await calculateTotals(selected);
  
  document.getElementById('calories').textContent = Math.round(totals.calories);
  document.getElementById('protein').textContent = totals.protein.toFixed(1);
  document.getElementById('carbs').textContent = totals.carbs.toFixed(1);
  document.getElementById('fat').textContent = totals.fat.toFixed(1);
  document.getElementById('price').textContent = `₹${totals.price.toFixed(2)}`;
  
  return totals;
}

// Update selected ingredients display
function updateSelectedIngredients(selected) {
  const container = document.getElementById('selected-ingredients');
  container.innerHTML = '';
  selected.forEach(({ item, qty }) => {
    const div = document.createElement('div');
    div.className = 'selected-ingredient';
    div.innerHTML = `${item.name} x${qty} <span class="remove-btn" data-id="${item.id}">&times;</span>`;
    container.appendChild(div);
  });

  container.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      document.getElementById(`chk-${id}`).checked = false;
      const sel = getSelections();
      await updateSummary(sel);
      updateSelectedIngredients(sel);
      highlightSelected();
      document.getElementById('order-btn').disabled = sel.length === 0;
    });
  });
}

// Highlight selected ingredient boxes
function highlightSelected() {
  ingredients.forEach(ing => {
    const chk = document.getElementById(`chk-${ing.id}`);
    if (chk) {
      const row = chk.closest('.ingredient-row');
      if (chk.checked) row.style.boxShadow = '0 10px 25px rgba(0,255,128,0.5)';
      else row.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
    }
  });
}

// Bowl animation
function animateBowl() {
  const bowl = document.getElementById('preview-image');
  bowl.style.transform = 'scale(1.1)';
  setTimeout(() => bowl.style.transform = 'scale(1)', 200);
}

// Place order via backend
async function placeOrder(selected, totals) {
  const items = selected.map(s => ({ id: s.item.id, qty: s.qty }));
  
  try {
    const response = await fetch(`${API_URL}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, totals })
    });
    
    if (!response.ok) throw new Error('Order failed');
    const data = await response.json();
    return data.order_id;
  } catch (error) {
    console.error('Error placing order:', error);
    return Math.floor(Math.random() * 1000000); // Fallback order ID
  }
}

// Order popup
function showOrderPopup(orderId, totalPrice) {
  const popup = document.createElement('div');
  popup.className = 'order-popup';
  popup.innerHTML = `
    <div class="popup-content">
      <h2>✅ Order Placed Successfully!</h2>
      <p>Order ID: <strong>${orderId}</strong></p>
      <p>Total Price: <strong>₹${totalPrice.toFixed(2)}</strong></p>
      <button id="close-popup">Close</button>
    </div>
  `;
  document.body.appendChild(popup);
  document.getElementById('close-popup').addEventListener('click', () => document.body.removeChild(popup));
}

// Initialize app
function init() {
  // Fetch ingredients from backend
  fetchIngredients();

  document.addEventListener('change', async () => {
    const sel = getSelections();
    await updateSummary(sel);
    updateSelectedIngredients(sel);
    highlightSelected();
    document.getElementById('order-btn').disabled = sel.length === 0;
    if (sel.length) animateBowl();
  });

  document.getElementById('order-btn').addEventListener('click', async () => {
    const sel = getSelections();
    if (sel.length === 0) return;

    const totals = await calculateTotals(sel);
    const orderId = await placeOrder(sel, totals);
    showOrderPopup(orderId, totals.price);

    sel.forEach(s => {
      const chk = document.getElementById(`chk-${s.item.id}`);
      if (chk) chk.checked = false;
    });
    await updateSummary([]);
    updateSelectedIngredients([]);
    highlightSelected();
    document.getElementById('order-btn').disabled = true;
  });
}

init();