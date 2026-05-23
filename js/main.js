// ===== PRODUCT DATA =====
let PRODUCTS = [
  {
    id: 1,
    name: 'Artisan Leather Wallet',
    category: 'Accessories',
    price: 89.00,
    stock: 15,
    lastUpdated: new Date().toISOString(),
    description: 'Hand-stitched Italian full-grain leather wallet with RFID protection. Ages beautifully over time.',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&h=700&fit=crop',
    badge: 'Bestseller'
  },
  {
    id: 2,
    name: 'Premium Silk Scarf',
    category: 'Apparel',
    price: 129.00,
    stock: 8,
    lastUpdated: new Date().toISOString(),
    description: 'Luxurious 100% mulberry silk scarf with hand-rolled edges. A timeless addition to any wardrobe.',
    image: 'https://images.unsplash.com/photo-1520903920243-00d4153b3ee6?w=600&h=700&fit=crop',
    badge: 'New'
  },
  {
    id: 3,
    name: 'Handcrafted Timepiece',
    category: 'Watches',
    price: 349.00,
    stock: 5,
    lastUpdated: new Date().toISOString(),
    description: 'Swiss quartz movement encased in polished stainless steel with sapphire crystal glass.',
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&h=700&fit=crop',
    badge: 'Premium'
  },
  {
    id: 4,
    name: 'Crystal Perfume Bottle',
    category: 'Home',
    price: 199.00,
    stock: 3,
    lastUpdated: new Date().toISOString(),
    description: 'Hand-blown crystal bottle with 24k gold-plated accents. Each piece is uniquely crafted.',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=700&fit=crop',
    badge: 'Limited'
  },
  {
    id: 5,
    name: 'Italian Leather Belt',
    category: 'Accessories',
    price: 159.00,
    stock: 12,
    lastUpdated: new Date().toISOString(),
    description: 'Full-grain Italian leather belt with a brushed gold-plated buckle. Width: 35mm.',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=700&fit=crop',
    badge: null
  },
  {
    id: 6,
    name: 'Cashmere Throw Blanket',
    category: 'Home',
    price: 279.00,
    stock: 6,
    lastUpdated: new Date().toISOString(),
    description: 'Pure Mongolian cashmere throw in a heritage twill weave. Exceptionally soft and warm.',
    image: 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=600&h=700&fit=crop',
    badge: 'Luxury'
  }
];

// ===== STATE =====
let cart = [];
let orders = [];
let _lastChangedQtyItem = null;
let _shakeTimeout = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initLoadingScreen();
  initNavbar();
  initScrollAnimations();
  renderCurrentPage();
});

function loadState() {
  try {
    const savedProducts = localStorage.getItem('luxe_products');
    if (savedProducts) PRODUCTS = JSON.parse(savedProducts);

    const savedCart = localStorage.getItem('luxe_cart');
    if (savedCart) cart = JSON.parse(savedCart);

    const savedOrders = localStorage.getItem('luxe_orders');
    if (savedOrders) orders = JSON.parse(savedOrders);
  } catch (e) {
    console.warn('Failed to load state:', e);
  }
}

function saveState() {
  try {
    localStorage.setItem('luxe_products', JSON.stringify(PRODUCTS));
    localStorage.setItem('luxe_cart', JSON.stringify(cart));
    localStorage.setItem('luxe_orders', JSON.stringify(orders));
  } catch (e) {
    console.warn('Failed to save state:', e);
  }
}

function initLoadingScreen() {
  const loader = document.getElementById('loading-screen');
  if (loader) {
    setTimeout(() => loader.classList.add('hidden'), 600);
  }
}

// ===== NAVBAR =====
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  // Scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  });

  // Hamburger toggle
  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks?.classList.toggle('active');
  });

  // Close menu on link click
  navLinks?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger?.classList.remove('active');
      navLinks?.classList.remove('active');
    });
  });

  // Cart dropdown
  const cartIcon = document.querySelector('.cart-icon');
  const cartDropdown = document.querySelector('.cart-dropdown');

  cartIcon?.addEventListener('click', (e) => {
    e.stopPropagation();
    cartDropdown?.classList.toggle('active');
    if (cartDropdown?.classList.contains('active')) {
      renderCartDropdown();
    }
  });

  document.addEventListener('click', () => {
    cartDropdown?.classList.remove('active');
  });

  cartDropdown?.addEventListener('click', (e) => e.stopPropagation());
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '✓',
    error: '✕',
    info: '●'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== CART FUNCTIONS =====
function getAvailableStock(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return 0;
  const inCart = cart.find(i => i.productId === productId);
  const cartQty = inCart ? inCart.quantity : 0;
  return Math.max(0, product.stock - cartQty);
}

function addToCart(productId, quantity = 1) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const available = getAvailableStock(productId);
  if (available < quantity) {
    showToast(`Sorry, only ${product.stock} units in stock. You already have ${product.stock - available} in cart.`, 'error');
    return;
  }

  const existing = cart.find(item => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
    _lastChangedQtyItem = productId;
  } else {
    cart.push({ productId, quantity });
  }

  saveState();
  updateCartCount();
  renderCartDropdown();
  renderOrderSummary();
  showToast(`${product.name} added to cart`, 'success');
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.productId !== productId);
  saveState();
  updateCartCount();
  renderCartDropdown();
  renderOrderSummary();
}

function updateCartQuantity(productId, delta) {
  const item = cart.find(i => i.productId === productId);
  const product = PRODUCTS.find(p => p.id === productId);
  if (!item || !product) return;

  if (delta > 0) {
    if (item.quantity >= product.stock) {
      showToast(`Maximum stock (${product.stock}) reached for ${product.name}`, 'warning');
      return;
    }
  }

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  _lastChangedQtyItem = productId;
  saveState();
  updateCartCount();
  renderCartDropdown();
  renderOrderSummary();
}

function getCartTotal() {
  return cart.reduce((sum, item) => {
    const product = PRODUCTS.find(p => p.id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartCount() {
  const badges = document.querySelectorAll('.cart-count');
  const count = getCartCount();
  badges.forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  });
}

function clearCart() {
  cart = [];
  saveState();
  updateCartCount();
  renderCartDropdown();
  renderOrderSummary();
}

// ===== RENDER FUNCTIONS =====
function renderCurrentPage() {
  updateCartCount();

  if (document.getElementById('products-grid')) {
    renderProducts();
  }
  if (document.getElementById('cart-dropdown-items')) {
    renderCartDropdown();
  }
  if (document.getElementById('order-summary-items')) {
    renderOrderSummary();
    setupOrderForm();
  }
  if (document.getElementById('track-form')) {
    initTrackPage();
  }
  if (document.getElementById('admin-orders-body')) {
    initAdminPage();
  }
  if (document.getElementById('login-form')) {
    initLoginForm();
  }
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  const template = document.getElementById('product-template');
  if (!grid || !template) return;

  grid.innerHTML = '';

  PRODUCTS.forEach((product, index) => {
    const card = template.content.cloneNode(true);

    card.querySelector('.product-card').dataset.productId = product.id;
    card.querySelector('.product-card-image img').src = product.image;
    card.querySelector('.product-card-image img').alt = product.name;
    card.querySelector('.product-card-image img').loading = 'lazy';

    const badge = card.querySelector('.product-card-badge');
    if (product.badge) {
      badge.textContent = product.badge;
    } else {
      badge.remove();
    }

    card.querySelector('.product-card-category').textContent = product.category;
    card.querySelector('.product-card h3').textContent = product.name;
    card.querySelector('.product-card-description').textContent = product.description;
    card.querySelector('.product-card-price').textContent = `₹${product.price.toFixed(2)}`;

    // Stock Status
    const footer = card.querySelector('.product-card-footer');
    const stockBadge = document.createElement('span');
    if (product.stock <= 0) {
      stockBadge.className = 'stock-badge empty';
      stockBadge.textContent = 'Out of Stock';
      card.querySelector('.btn-add').disabled = true;
      card.querySelector('.btn-add').textContent = 'Sold Out';
    } else if (product.stock <= 3) {
      stockBadge.className = 'stock-badge low';
      stockBadge.textContent = `Only ${product.stock} left`;
    } else {
      stockBadge.className = 'stock-badge in-stock';
      stockBadge.textContent = 'In Stock';
    }
    footer.insertBefore(stockBadge, card.querySelector('.btn-add'));

    const addBtn = card.querySelector('.btn-add');
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(product.id);
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'fade-in visible'; // Force visible for catalogue refresh
    wrapper.style.transitionDelay = `${index * 0.1}s`;
    wrapper.appendChild(card);
    grid.appendChild(wrapper);
  });
}

let _prevCartIds = null;
let _cartRemoveTimer = null;

function renderCartDropdown() {
  const container = document.getElementById('cart-dropdown-items');
  const template = document.getElementById('cart-item-template');
  const totalEl = document.getElementById('cart-dropdown-total');
  if (!container || !template) return;

  const prevIds = _prevCartIds || new Set();
  const currIds = new Set(cart.map(i => i.productId));

  // If an item was removed, animate it out before rebuilding
  const removedIds = [...prevIds].filter(id => !currIds.has(id));
  if (removedIds.length > 0) {
    removedIds.forEach(id => {
      const el = container.querySelector(`[data-product-id="${id}"]`);
      if (el) el.classList.add('removing');
    });
    clearTimeout(_cartRemoveTimer);
    _cartRemoveTimer = setTimeout(() => {
      _prevCartIds = currIds;
      renderCartContent(container, template, totalEl, currIds);
    }, 350);
    return;
  }

  _prevCartIds = currIds;
  renderCartContent(container, template, totalEl, currIds);
}

function renderCartContent(container, template, totalEl, currIds) {
  const prevIds = _prevCartIds || new Set();
  container.innerHTML = '';

  if (cart.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 24px 0;">Your cart is empty</p>';
    if (totalEl) totalEl.textContent = '₹0.00';
    _prevCartIds = new Set();
    return;
  }

  cart.forEach(item => {
    const product = PRODUCTS.find(p => p.id === item.productId);
    if (!product) return;

    const isNew = !prevIds.has(item.productId);
    const el = template.content.cloneNode(true);
    const itemDiv = el.querySelector('.cart-dropdown-item');
    itemDiv.dataset.productId = item.productId;
    if (isNew) itemDiv.classList.add('new-item');
    el.querySelector('img').src = product.image;
    el.querySelector('img').alt = product.name;
    el.querySelector('h5').textContent = product.name;
    el.querySelector('p').textContent = `Qty: ${item.quantity} × ₹${product.price.toFixed(2)}`;
    el.querySelector('.cart-dropdown-item-remove').addEventListener('click', () => {
      removeFromCart(product.id);
    });
    container.appendChild(el);
  });

  _prevCartIds = currIds;

  if (totalEl) totalEl.textContent = `₹${getCartTotal().toFixed(2)}`;
}

function renderOrderSummary() {
  const container = document.getElementById('order-summary-items');
  const subtotalEl = document.getElementById('summary-subtotal');
  const totalEl = document.getElementById('summary-total');
  const shippingEl = document.getElementById('summary-shipping');
  if (!container) return;

  const animateId = _lastChangedQtyItem;
  _lastChangedQtyItem = null;

  container.innerHTML = '';

  if (cart.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 24px 0;">No items selected</p>';
    if (subtotalEl) subtotalEl.textContent = '₹0.00';
    if (shippingEl) shippingEl.textContent = '₹0.00';
    if (totalEl) totalEl.textContent = '₹0.00';
    return;
  }

  cart.forEach(item => {
    const product = PRODUCTS.find(p => p.id === item.productId);
    if (!product) return;

    const div = document.createElement('div');
    div.className = 'order-summary-item';
    div.innerHTML = `
      <img src="${product.image}" alt="${product.name}" loading="lazy">
      <div class="order-summary-item-info">
        <h4>${product.name}</h4>
        <div class="qty-selector" style="margin-top: 8px;" role="group" aria-label="Quantity selector for ${product.name}">
          <button class="qty-minus" aria-label="Decrease quantity of ${product.name}">−</button>
          <span class="qty-value${animateId === product.id ? ' pulse' : ''}" aria-live="polite" aria-atomic="true">${item.quantity}</span>
          <button class="qty-plus" aria-label="Increase quantity of ${product.name}">+</button>
        </div>
      </div>
      <div class="order-summary-item-price" style="text-align: right;">
        <div>₹${(product.price * item.quantity).toFixed(2)}</div>
        <button class="btn-remove-item" style="background:none; border:none; color:var(--error); font-size:0.7rem; cursor:pointer; margin-top:4px;">Remove</button>
      </div>
    `;

    const qtyMinus = div.querySelector('.qty-minus');
    const qtyPlus = div.querySelector('.qty-plus');

    function inc() { updateCartQuantity(product.id, 1); }
    function dec() { updateCartQuantity(product.id, -1); }

    qtyMinus.addEventListener('click', dec);
    qtyPlus.addEventListener('click', inc);

    // Keyboard: arrow up/down adjust, left/right navigate between buttons
    qtyMinus.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); inc(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); dec(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); qtyPlus.focus(); }
    });

    qtyPlus.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); inc(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); dec(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); qtyMinus.focus(); }
    });

    div.querySelector('.btn-remove-item').addEventListener('click', () => {
      removeFromCart(product.id);
    });

    container.appendChild(div);
  });

  const subtotal = getCartTotal();
  const shipping = subtotal >= 200 ? 0 : 12.00;
  const total = subtotal + shipping;

  if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
  if (shippingEl) shippingEl.textContent = shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `₹${total.toFixed(2)}`;
}

// ===== ORDER FORM =====
function setupOrderForm() {
  const form = document.getElementById('order-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitOrder();
  });
}

function generateOrderId() {
  const prefix = 'ORD';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function validateForm() {
  let isValid = true;
  const fields = [
    { id: 'full-name', label: 'Full Name' },
    { id: 'email', label: 'Email Address' },
    { id: 'phone', label: 'Phone Number' },
    { id: 'address', label: 'Street Address' },
    { id: 'city', label: 'City / Town' },
    { id: 'state', label: 'State / UT' },
    { id: 'zip-code', label: 'PIN Code' },
    { id: 'country', label: 'Country' },
    { id: 'transaction-id', label: 'Transaction ID' }
  ];

  fields.forEach(field => {
    const input = document.getElementById(field.id);
    const error = document.getElementById(`${field.id}-error`);
    if (!input) return;

    input.classList.remove('error');
    if (error) error.classList.remove('visible');

    const value = input.value.trim();

    if (!value) {
      input.classList.add('error');
      if (error) {
        error.textContent = `${field.label} is required`;
        error.classList.add('visible');
      }
      isValid = false;
      return;
    }

    if (field.id === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        input.classList.add('error');
        if (error) {
          error.textContent = 'Please enter a valid email address';
          error.classList.add('visible');
        }
        isValid = false;
      }
    } else if (field.id === 'phone') {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(value)) {
        input.classList.add('error');
        if (error) {
          error.textContent = 'Please enter a valid 10-digit phone number';
          error.classList.add('visible');
        }
        isValid = false;
      }
    } else if (field.id === 'zip-code') {
      const pinRegex = /^\d{6}$/;
      if (!pinRegex.test(value)) {
        input.classList.add('error');
        if (error) {
          error.textContent = 'PIN Code must be exactly 6 digits';
          error.classList.add('visible');
        }
        isValid = false;
      }
    }
  });

  if (!isValid) {
    const firstError = document.querySelector('.form-error.visible');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  return isValid;
}

function submitOrder() {
  if (cart.length === 0) {
    showToast('Your cart is empty. Please add items to your order.', 'error');
    return;
  }

  if (!validateForm()) {
    const btn = document.getElementById('submit-order-btn');
    if (btn) {
      clearTimeout(_shakeTimeout);
      btn.classList.remove('shake');
      void btn.offsetWidth;
      btn.classList.add('shake');
      _shakeTimeout = setTimeout(() => btn.classList.remove('shake'), 600);
    }
    showToast('Please fix the errors in the form.', 'error');
    return;
  }

  // Final inventory check
  const stockCheckFailed = [];
  cart.forEach(item => {
    const product = PRODUCTS.find(p => p.id === item.productId);
    if (product && product.stock < item.quantity) {
      stockCheckFailed.push(product.name);
    }
  });

  if (stockCheckFailed.length > 0) {
    showToast(`Sorry, items sold out: ${stockCheckFailed.join(', ')}`, 'error');
    return;
  }

  // Create order object
  const order = {
    id: generateOrderId(),
    date: new Date().toISOString(),
    status: 'pending',
    items: [...cart],
    total: getCartTotal(),
    shipping: getCartTotal() >= 200 ? 0 : 12.00,
    grandTotal: getCartTotal() + (getCartTotal() >= 200 ? 0 : 12.00),
    customer: {
      name: document.getElementById('full-name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      address: document.getElementById('address').value.trim(),
      city: document.getElementById('city').value.trim(),
      state: document.getElementById('state').value.trim(),
      zip: document.getElementById('zip-code').value.trim(),
      country: document.getElementById('country').value.trim()
    },
    transactionId: document.getElementById('transaction-id').value.trim(),
    notes: document.getElementById('notes').value.trim()
  };

  // Deduct stock globally
  cart.forEach(item => {
    const product = PRODUCTS.find(p => p.id === item.productId);
    if (product) {
      product.stock -= item.quantity;
      product.lastUpdated = new Date().toISOString();
    }
  });

  orders.push(order);
  saveState();
  clearCart();

  window.location.href = `confirmation.html?id=${order.id}`;
}

// ===== CONFIRMATION PAGE =====
function renderConfirmation() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('id');
  const order = orders.find(o => o.id === orderId);

  if (!order) {
    document.getElementById('confirmation-content').innerHTML = `
      <div class="confirmation-card">
        <h1>Order Not Found</h1>
        <p>We couldn't find your order. Please check your order ID.</p>
        <div class="confirmation-actions" style="margin-top: 24px;">
          <a href="index.html" class="btn btn-primary">Return to Store</a>
        </div>
      </div>
    `;
    return;
  }

  document.getElementById('order-id-display').textContent = order.id;
  document.getElementById('order-email').textContent = order.customer.email;
  document.getElementById('order-name').textContent = order.customer.name;
  document.getElementById('order-address').textContent =
    `${order.customer.address}, ${order.customer.city}, ${order.customer.state} ${order.customer.zip}, ${order.customer.country}`;
  document.getElementById('order-phone').textContent = order.customer.phone;
  document.getElementById('order-transaction-id').textContent = order.transactionId;
  document.getElementById('order-total').textContent = `₹${order.grandTotal.toFixed(2)}`;
}

// ===== TRACK PAGE =====
function initTrackPage() {
  const form = document.getElementById('track-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    searchOrders();
  });
}

function searchOrders() {
  const phone = document.getElementById('track-phone').value.trim();
  const resultsDiv = document.getElementById('track-results');
  const listDiv = document.getElementById('track-orders-list');
  const errorDiv = document.getElementById('track-phone-error');
  const inputEl = document.getElementById('track-phone');

  if (!phone) {
    inputEl.classList.add('error');
    if (errorDiv) {
      errorDiv.textContent = 'Please enter your phone number';
      errorDiv.classList.add('visible');
    }
    return;
  }

  if (!/^\d{10}$/.test(phone)) {
    inputEl.classList.add('error');
    if (errorDiv) {
      errorDiv.textContent = 'Please enter a valid 10-digit phone number';
      errorDiv.classList.add('visible');
    }
    return;
  }

  // Clear errors
  inputEl.classList.remove('error');
  if (errorDiv) errorDiv.classList.remove('visible');

  const foundOrders = orders.filter(order => {
    const cleanOrderPhone = order.customer.phone.replace(/[^\d]/g, '');
    return cleanOrderPhone === phone;
  });

  resultsDiv.style.display = 'block';
  listDiv.innerHTML = '';

  if (foundOrders.length === 0) {
    listDiv.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px 0;">No orders found for this phone number.</p>';
    return;
  }

  foundOrders.sort((a, b) => new Date(b.date) - new Date(a.date));

  foundOrders.forEach(order => {
    const div = document.createElement('div');
    div.className = 'admin-stat-card';
    div.style.textAlign = 'left';
    div.style.marginBottom = '20px';
    div.style.cursor = 'pointer';
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
        <div>
          <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">Order ID</span>
          <h4 style="font-family: var(--font-serif); font-size: 1.1rem; margin-top: 4px;">${order.id}</h4>
        </div>
        <span class="status-badge ${order.status}">
          ${order.status === 'pending' ? '⏳' : order.status === 'approved' ? '✓' : '✕'} ${order.status}
        </span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: end;">
        <div>
          <p style="font-size: 0.8rem; color: var(--text-muted);">${new Date(order.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <p style="font-size: 0.85rem; font-weight: 500; margin-top: 4px;">${order.items.length} ${order.items.length === 1 ? 'item' : 'items'}</p>
        </div>
        <div style="text-align: right;">
          <span style="font-family: var(--font-serif); font-size: 1.2rem; font-weight: 600; color: var(--gold-dark);">₹${order.grandTotal.toFixed(2)}</span>
        </div>
      </div>
    `;

    div.addEventListener('click', () => openOrderDetail(order.id));
    listDiv.appendChild(div);
  });

  showToast(`Found ${foundOrders.length} order(s)`, 'success');
}

// ===== ADMIN AUTH =====
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

function isAuthenticated() { return sessionStorage.getItem('luxe_admin_auth') === 'true'; }

function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;
  if (isAuthenticated()) { window.location.href = 'admin.html'; return; }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const uInput = document.getElementById('login-username');
    const pInput = document.getElementById('login-password');
    const u = uInput.value.trim();
    const p = pInput.value.trim();

    // Reset styles
    uInput.classList.remove('error');
    pInput.classList.remove('error');

    let valid = true;
    if (!u) {
      uInput.classList.add('error');
      valid = false;
    }
    if (!p) {
      pInput.classList.add('error');
      valid = false;
    }

    if (!valid) {
      showToast('Username and password are required', 'error');
      return;
    }

    if (u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password) {
      sessionStorage.setItem('luxe_admin_auth', 'true');
      showToast('Login successful', 'success');
      setTimeout(() => window.location.href = 'admin.html', 500);
    } else {
      uInput.classList.add('error');
      pInput.classList.add('error');
      showToast('Invalid credentials', 'error');
    }
  });
}

function initAdminPage() {
  if (!requireAuth()) return;

  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(`${tab}-tab`).classList.add('active');
    });
  });

  renderAdminOrders();
  renderAdminCatalogue();
  setupAdminFilters();
  document.getElementById('btn-add-product')?.addEventListener('click', () => openProductModal());
}

function renderAdminOrders(filter = 'all') {
  const tbody = document.getElementById('admin-orders-body');
  if (!tbody) return;

  let f = orders;
  if (filter !== 'all') f = orders.filter(o => o.status === filter);
  f.sort((a, b) => new Date(b.date) - new Date(a.date));

  document.getElementById('stat-total').textContent = orders.length;
  document.getElementById('stat-pending').textContent = orders.filter(o => o.status === 'pending').length;
  document.getElementById('stat-approved').textContent = orders.filter(o => o.status === 'approved').length;

  tbody.innerHTML = '';
  if (f.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="admin-empty">No orders found.</td></tr>';
    return;
  }

  f.forEach(order => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${order.id}</strong></td>
      <td>${new Date(order.date).toLocaleDateString()}</td>
      <td>${order.customer.name}</td>
      <td>${order.items.length} items</td>
      <td>₹${order.grandTotal.toFixed(2)}</td>
      <td><span class="status-badge ${order.status}">${order.status}</span></td>
      <td>${order.transactionId}</td>
      <td><button class="btn btn-dark btn-view" data-id="${order.id}">View</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.btn-view').forEach(btn => {
    btn.addEventListener('click', () => openOrderDetail(btn.dataset.id));
  });
}

let _prevStock = null;

function renderAdminCatalogue() {
  const tbody = document.getElementById('admin-catalogue-body');
  if (!tbody) return;

  // Snapshot previous stock before rebuilding
  const prev = _prevStock || {};
  tbody.innerHTML = '';

  PRODUCTS.forEach(p => {
    const changed = prev[p.id] !== undefined && prev[p.id] !== p.stock;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${p.image}" width="40"></td>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>₹${p.price.toFixed(2)}</td>
      <td>${p.badge || '—'}</td>
      <td><span class="stock-indicator ${p.stock <= 3 ? 'low-stock' : ''}${changed ? ' flash' : ''}">${p.stock} units</span></td>
      <td>
        <button class="btn btn-dark btn-edit" data-id="${p.id}">Edit</button>
        <button class="btn btn-danger btn-delete" data-id="${p.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Update snapshot for next comparison
  _prevStock = {};
  PRODUCTS.forEach(p => { _prevStock[p.id] = p.stock; });

  tbody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openProductModal(parseInt(btn.dataset.id)));
  });
  tbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteProduct(parseInt(btn.dataset.id)));
  });
}

function openProductModal(productId = null) {
  const product = productId ? PRODUCTS.find(p => p.id === productId) : null;
  let modal = document.getElementById('product-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'product-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h2>${product ? 'Edit Product' : 'Add New Product'}</h2>
        <button class="modal-close">✕</button>
      </div>
      <div class="modal-body">
        <form id="product-form">
          <input type="hidden" id="prod-id" value="${product ? product.id : ''}">
          <div class="form-group"><label>Name</label><input type="text" id="prod-name" value="${product ? product.name : ''}" required></div>
          <div class="form-group"><label>Category</label><input type="text" id="prod-category" value="${product ? product.category : ''}" required></div>
          <div class="form-group"><label>Price (₹)</label><input type="number" id="prod-price" step="0.01" value="${product ? product.price : ''}" required></div>
          <div class="form-group"><label>Stock</label><input type="number" id="prod-stock" value="${product ? product.stock : '10'}" required></div>
          <div class="form-group"><label>Image URL</label><input type="url" id="prod-image" value="${product ? product.image : ''}" required></div>
          <div class="form-group"><label>Description</label><textarea id="prod-desc" required>${product ? product.description : ''}</textarea></div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">${product ? 'Update' : 'Add'}</button>
        </form>
      </div>
    </div>
  `;

  modal.querySelector('.modal-close').addEventListener('click', () => modal.classList.remove('active'));
  modal.querySelector('#product-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveProduct();
  });
  modal.classList.add('active');
}

function saveProduct() {
  const id = document.getElementById('prod-id').value;
  const name = document.getElementById('prod-name').value.trim();
  const category = document.getElementById('prod-category').value.trim();
  const priceVal = document.getElementById('prod-price').value;
  const stockVal = document.getElementById('prod-stock').value;
  const image = document.getElementById('prod-image').value.trim();
  const desc = document.getElementById('prod-desc').value.trim();

  // Basic Validations
  if (!name || !category || !priceVal || !stockVal || !image || !desc) {
    showToast('All fields are required', 'error');
    return;
  }

  const price = parseFloat(priceVal);
  const stock = parseInt(stockVal);

  if (isNaN(price) || price <= 0) {
    showToast('Please enter a valid positive price', 'error');
    return;
  }

  if (isNaN(stock) || stock < 0) {
    showToast('Stock cannot be negative', 'error');
    return;
  }

  const p = {
    id: id ? parseInt(id) : Date.now(),
    name,
    category,
    price,
    stock,
    image,
    description: desc,
    lastUpdated: new Date().toISOString()
  };

  if (id) {
    const idx = PRODUCTS.findIndex(x => x.id === parseInt(id));
    if (idx !== -1) PRODUCTS[idx] = p;
  } else {
    PRODUCTS.push(p);
  }

  saveState();
  renderAdminCatalogue();
  document.getElementById('product-modal').classList.remove('active');
  showToast(id ? 'Product updated' : 'Product added', 'success');
  if (document.getElementById('products-grid')) renderProducts();
}

function deleteProduct(productId) {
  if (confirm('Delete this product?')) {
    PRODUCTS = PRODUCTS.filter(p => p.id !== productId);
    saveState();
    renderAdminCatalogue();
    if (document.getElementById('products-grid')) renderProducts();
  }
}

function updateOrderStatus(orderId, status) {
  const o = orders.find(x => x.id === orderId);
  if (!o) return;
  
  // If rejecting, restore stock
  if (status === 'rejected' && o.status !== 'rejected') {
    o.items.forEach(item => {
      const p = PRODUCTS.find(x => x.id === item.productId);
      if (p) p.stock += item.quantity;
    });
  }
  
  o.status = status;
  saveState();
  renderAdminOrders();
  renderAdminCatalogue();
}

function setupAdminFilters() {
  document.querySelectorAll('.admin-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAdminOrders(btn.dataset.filter);
    });
  });
}

function openOrderDetail(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  let modal = document.getElementById('order-detail-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'order-detail-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  const itemsRows = order.items.map(item => {
    const p = PRODUCTS.find(x => x.id === item.productId);
    return `<tr><td>${p ? p.name : 'Item'}</td><td>${item.quantity}</td><td>₹${order.total.toFixed(2)}</td></tr>`;
  }).join('');

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header"><h2>Order ${order.id}</h2><button class="modal-close">✕</button></div>
      <div class="modal-body">
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Customer:</strong> ${order.customer.name}</p>
        <p><strong>Address:</strong> ${order.customer.address}, ${order.customer.city}</p>
        <table><thead><tr><th>Item</th><th>Qty</th><th>Total</th></tr></thead><tbody>${itemsRows}</tbody></table>
        ${isAuthenticated() && order.status === 'pending' ? `
          <div style="margin-top:20px; display:flex; gap:10px;">
            <button class="btn btn-success" onclick="updateOrderStatus('${order.id}', 'approved')">Approve</button>
            <button class="btn btn-danger" onclick="updateOrderStatus('${order.id}', 'rejected')">Reject</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
  modal.querySelector('.modal-close').addEventListener('click', () => modal.classList.remove('active'));
  modal.classList.add('active');
}
