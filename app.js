const CART_KEY = "restaurant_cart_v1";
const SALES_KEY = "restaurant_sales_v1";

const menuItems = [
  {
    id: "idly",
    name: "Idly",
    price: 40,
    image:
      "https://images.unsplash.com/photo-1668236543090-f782fdb6c8af?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "dosa",
    name: "Dosa",
    price: 70,
    image:
      "https://images.unsplash.com/photo-1630409351217-bc4fa6422075?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "noodles",
    name: "Noodles",
    price: 90,
    image:
      "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "coffee",
    name: "Coffee",
    price: 35,
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "veg-noodles",
    name: "Veg Noodles",
    price: 100,
    image:
      "https://images.unsplash.com/photo-1512003867696-6d5ce6835040?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "vada",
    name: "Vada",
    price: 30,
    image:
      "https://images.unsplash.com/photo-1631452180539-96aca7d48617?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "pongal",
    name: "Pongal",
    price: 80,
    image:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "masala-vada",
    name: "Masala Vada",
    price: 45,
    image:
      "https://images.unsplash.com/photo-1604908176997-431451f84d77?auto=format&fit=crop&w=800&q=80"
  }
];

const menuGrid = document.getElementById("menuGrid");
const cartList = document.getElementById("cartList");
const subtotalAmount = document.getElementById("subtotalAmount");
const totalAmount = document.getElementById("totalAmount");
const clearCartBtn = document.getElementById("clearCartBtn");
const payNowBtn = document.getElementById("payNowBtn");
const paymentContent = document.getElementById("paymentContent");
const printBillBtn = document.getElementById("printBillBtn");
const invoicePrintArea = document.getElementById("invoicePrintArea");
const monthFilter = document.getElementById("monthFilter");
const monthlyReport = document.getElementById("monthlyReport");
const menuCardTemplate = document.getElementById("menuCardTemplate");

let cart = loadStorageArray(CART_KEY);
let sales = loadStorageArray(SALES_KEY);
let latestInvoice = null;

init();

function init() {
  renderMenu();
  renderCart();
  updateSummary();
  setDefaultMonthFilter();
  renderMonthlyReport(monthFilter.value);
  bindEvents();
}

function bindEvents() {
  clearCartBtn.addEventListener("click", clearCart);
  payNowBtn.addEventListener("click", showPayNow);
  printBillBtn.addEventListener("click", () => window.print());
  monthFilter.addEventListener("change", (event) => {
    renderMonthlyReport(event.target.value);
  });
}

function renderMenu() {
  menuGrid.innerHTML = "";

  menuItems.forEach((item) => {
    const card = menuCardTemplate.content.firstElementChild.cloneNode(true);
    const image = card.querySelector(".menu-image");
    const name = card.querySelector(".menu-name");
    const price = card.querySelector(".menu-price");
    const addButton = card.querySelector(".add-to-cart-btn");

    image.src = item.image;
    image.alt = item.name;
    name.textContent = item.name;
    price.textContent = formatMoney(item.price);
    addButton.addEventListener("click", () => addToCart(item.id));

    menuGrid.appendChild(card);
  });
}

function renderCart() {
  cartList.innerHTML = "";

  if (cart.length === 0) {
    cartList.innerHTML = '<p class="muted">Your cart is empty.</p>';
    return;
  }

  cart.forEach((item) => {
    const row = document.createElement("article");
    row.className = "cart-item";

    const info = document.createElement("div");
    info.innerHTML = `
      <h4 class="cart-item-name">${item.name}</h4>
      <p class="cart-item-meta">${formatMoney(item.price)} each | Line Total: ${formatMoney(item.price * item.qty)}</p>
    `;

    const controls = document.createElement("div");
    controls.className = "cart-qty-controls";
    controls.innerHTML = `
      <button class="btn btn-secondary" data-action="decrease">-</button>
      <span class="qty-badge">${item.qty}</span>
      <button class="btn btn-secondary" data-action="increase">+</button>
      <button class="btn btn-danger" data-action="remove">Remove</button>
    `;

    controls.addEventListener("click", (event) => {
      if (!(event.target instanceof HTMLElement)) {
        return;
      }

      const action = event.target.dataset.action;
      if (!action) {
        return;
      }

      if (action === "decrease") {
        updateQuantity(item.id, item.qty - 1);
      } else if (action === "increase") {
        updateQuantity(item.id, item.qty + 1);
      } else if (action === "remove") {
        removeFromCart(item.id);
      }
    });

    row.append(info, controls);
    cartList.appendChild(row);
  });
}

function addToCart(menuItemId) {
  const selected = menuItems.find((item) => item.id === menuItemId);
  if (!selected) {
    return;
  }

  const existing = cart.find((item) => item.id === menuItemId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: selected.id,
      name: selected.name,
      price: selected.price,
      image: selected.image,
      qty: 1
    });
  }

  syncCartState();
}

function updateQuantity(itemId, nextQty) {
  if (nextQty <= 0) {
    removeFromCart(itemId);
    return;
  }

  cart = cart.map((item) => {
    if (item.id === itemId) {
      return { ...item, qty: nextQty };
    }
    return item;
  });

  syncCartState();
}

function removeFromCart(itemId) {
  cart = cart.filter((item) => item.id !== itemId);
  syncCartState();
}

function clearCart() {
  cart = [];
  saveStorageArray(CART_KEY, cart);
  renderCart();
  updateSummary();
  paymentContent.innerHTML = '<p class="muted">Click "Pay Now" to show QR code.</p>';
}

function syncCartState() {
  saveStorageArray(CART_KEY, cart);
  renderCart();
  updateSummary();
}

function updateSummary() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal;

  subtotalAmount.textContent = formatMoney(subtotal);
  totalAmount.textContent = formatMoney(total);
}

function showPayNow() {
  if (cart.length === 0) {
    paymentContent.innerHTML = '<p class="muted">Cart is empty. Add items first.</p>';
    return;
  }

  const total = calculateTotals().total;
  const fakeUpiText = `upi://pay?pa=restaurant@upi&pn=Restaurant&am=${total.toFixed(2)}&cu=INR`;
  const qrSource = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(fakeUpiText)}`;

  paymentContent.innerHTML = `
    <div class="qr-wrap">
      <img src="${qrSource}" alt="Payment QR Code">
      <div>
        <p>Scan this QR code to pay ${formatMoney(total)}.</p>
        <p class="muted">After payment, click Complete Payment.</p>
        <button id="completePaymentBtn" class="btn btn-primary">Complete Payment</button>
      </div>
    </div>
  `;

  const completePaymentBtn = document.getElementById("completePaymentBtn");
  completePaymentBtn.addEventListener("click", completePayment);
}

function completePayment() {
  if (cart.length === 0) {
    return;
  }

  const totals = calculateTotals();
  const paidAt = new Date();
  const saleRecord = {
    saleId: `SALE-${Date.now()}`,
    items: cart.map((item) => ({ ...item })),
    subtotal: totals.subtotal,
    total: totals.total,
    paidAt: paidAt.toISOString()
  };

  sales.push(saleRecord);
  saveStorageArray(SALES_KEY, sales);

  latestInvoice = saleRecord;
  renderInvoice(saleRecord);
  printBillBtn.disabled = false;

  paymentContent.innerHTML = `
    <p><strong>Payment successful.</strong> Order ${saleRecord.saleId} is completed.</p>
    <p class="muted">You can now print the bill.</p>
  `;

  cart = [];
  saveStorageArray(CART_KEY, cart);
  renderCart();
  updateSummary();
  renderMonthlyReport(monthFilter.value);
}

function renderInvoice(sale) {
  const orderDate = new Date(sale.paidAt);

  const tableRows = sale.items
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.qty}</td>
        <td>${formatMoney(item.price)}</td>
        <td>${formatMoney(item.price * item.qty)}</td>
      </tr>
    `
    )
    .join("");

  invoicePrintArea.innerHTML = `
    <h3>Restaurant Bill</h3>
    <p><strong>Bill No:</strong> ${sale.saleId}</p>
    <p><strong>Date:</strong> ${orderDate.toLocaleString()}</p>
    <table class="invoice-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
    <p><strong>Subtotal:</strong> ${formatMoney(sale.subtotal)}</p>
    <p><strong>Total:</strong> ${formatMoney(sale.total)}</p>
    <p>Thank you. Visit again!</p>
  `;
}

function renderMonthlyReport(monthValue) {
  if (!monthValue) {
    monthlyReport.innerHTML = '<p class="muted">Select a month to view report.</p>';
    return;
  }

  const selectedSales = sales.filter((sale) => sale.paidAt.startsWith(monthValue));

  if (selectedSales.length === 0) {
    monthlyReport.innerHTML = "<p>No sales data for this month.</p>";
    return;
  }

  const totalOrders = selectedSales.length;
  const grossSales = selectedSales.reduce((sum, sale) => sum + sale.total, 0);
  const itemCountMap = {};

  selectedSales.forEach((sale) => {
    sale.items.forEach((item) => {
      itemCountMap[item.name] = (itemCountMap[item.name] || 0) + item.qty;
    });
  });

  const itemLines = Object.entries(itemCountMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, qty]) => `<li>${name}: ${qty}</li>`)
    .join("");

  monthlyReport.innerHTML = `
    <p><strong>Month:</strong> ${monthValue}</p>
    <p><strong>Total Orders:</strong> ${totalOrders}</p>
    <p><strong>Gross Sales:</strong> ${formatMoney(grossSales)}</p>
    <h4>Item-wise Quantity</h4>
    <ul class="item-qty-list">${itemLines}</ul>
  `;
}

function calculateTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  return {
    subtotal,
    total: subtotal
  };
}

function setDefaultMonthFilter() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  monthFilter.value = `${now.getFullYear()}-${month}`;
}

function loadStorageArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveStorageArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatMoney(value) {
  return `Rs ${value.toFixed(2)}`;
}
