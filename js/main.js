// ===== XSS SANITIZATION UTILITY =====
function sanitizeHTML(str) {
  if (typeof str !== 'string') return str;
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
}

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
    const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.classList.toggle('active');
    navLinks?.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', !isExpanded);
  });

  // Close menu on link click
  navLinks?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger?.classList.remove('active');
      navLinks?.classList.remove('active');
      hamburger?.setAttribute('aria-expanded', 'false');
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

function calculateShipping(subtotal) {
  return subtotal >= 200 ? 0 : 12.00;
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

const renderCartDropdown = (() => {
  let prevIds = null;
  let removeTimer = null;

  function renderCartContent(container, template, totalEl, currIds) {
    const currentPrevIds = prevIds || new Set();
    container.innerHTML = '';

    if (cart.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 24px 0;">Your cart is empty</p>';
      if (totalEl) totalEl.textContent = '₹0.00';
      prevIds = new Set();
      return;
    }

    cart.forEach(item => {
      const product = PRODUCTS.find(p => p.id === item.productId);
      if (!product) return;

      const isNew = !currentPrevIds.has(item.productId);
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

    prevIds = currIds;

    if (totalEl) totalEl.textContent = `₹${getCartTotal().toFixed(2)}`;
  }

  return function renderCartDropdown() {
    const container = document.getElementById('cart-dropdown-items');
    const template = document.getElementById('cart-item-template');
    const totalEl = document.getElementById('cart-dropdown-total');
    if (!container || !template) return;

    const currIds = new Set(cart.map(i => i.productId));
    const removedIds = [...(prevIds || new Set())].filter(id => !currIds.has(id));

    if (removedIds.length > 0) {
      removedIds.forEach(id => {
        const el = container.querySelector(`[data-product-id="${id}"]`);
        if (el) el.classList.add('removing');
      });
      clearTimeout(removeTimer);
      removeTimer = setTimeout(() => {
        prevIds = currIds;
        removeTimer = null;
        renderCartContent(container, template, totalEl, currIds);
      }, 350);
      return;
    }

    renderCartContent(container, template, totalEl, currIds);
  };
})();

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
    container.innerHTML = `
      <div style="text-align: center; padding: 24px 0;">
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 16px;">Your cart is empty</p>
        <a href="catalogue.html" class="btn btn-dark">Browse Catalogue</a>
      </div>
    `;
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
  const shipping = calculateShipping(subtotal);
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
  const subtotal = getCartTotal();
  const shipping = calculateShipping(subtotal);
  const order = {
    id: generateOrderId(),
    date: new Date().toISOString(),
    status: 'pending',
    items: [...cart],
    total: subtotal,
    shipping,
    grandTotal: subtotal + shipping,
    customer: {
      name: sanitizeInput(document.getElementById('full-name').value),
      email: sanitizeInput(document.getElementById('email').value),
      phone: sanitizeInput(document.getElementById('phone').value),
      address: sanitizeInput(document.getElementById('address').value),
      city: sanitizeInput(document.getElementById('city').value),
      state: sanitizeInput(document.getElementById('state').value),
      zip: sanitizeInput(document.getElementById('zip-code').value),
      country: sanitizeInput(document.getElementById('country').value)
    },
    transactionId: sanitizeInput(document.getElementById('transaction-id').value),
    notes: sanitizeInput(document.getElementById('notes').value)
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

  // Ensure localStorage is updated before redirecting
  setTimeout(() => {
    window.location.href = `confirmation.html?id=${order.id}`;
  }, 100);
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

  document.getElementById('order-id-display').textContent = sanitizeHTML(order.id);
  document.getElementById('order-email').textContent = sanitizeHTML(order.customer.email);
  document.getElementById('order-name').textContent = sanitizeHTML(order.customer.name);
  document.getElementById('order-address').textContent = sanitizeHTML(
    `${order.customer.address}, ${order.customer.city}, ${order.customer.state} ${order.customer.zip}, ${order.customer.country}`
  );
  document.getElementById('order-phone').textContent = sanitizeHTML(order.customer.phone);
  document.getElementById('order-transaction-id').textContent = sanitizeHTML(order.transactionId);
  document.getElementById('order-total').textContent = `₹${order.grandTotal.toFixed(2)}`;
}

// ===== TRACK PAGE =====
function initTrackPage() {
  const form = document.getElementById('track-form');
  if (!form) return;

  // Radio toggle
  const radios = document.querySelectorAll('input[name="track-method"]');
  const orderIdGroup = document.getElementById('track-order-id-group');
  const phoneGroup = document.getElementById('track-phone-group');

  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      const method = document.querySelector('input[name="track-method"]:checked')?.value;
      orderIdGroup.style.display = method === 'order-id' ? 'block' : 'none';
      phoneGroup.style.display = method === 'phone' ? 'block' : 'none';
      // Update radio label active states
      document.querySelectorAll('.track-radio').forEach(l => l.classList.remove('active'));
      radio.closest('.track-radio')?.classList.add('active');
      // Clear previous results & errors
      document.getElementById('track-results').style.display = 'none';
      document.querySelectorAll('.form-error').forEach(e => e.classList.remove('visible'));
      document.querySelectorAll('.error').forEach(e => e.classList.remove('error'));
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    searchOrders();
  });
}

function searchOrders() {
  const method = document.querySelector('input[name="track-method"]:checked')?.value || 'order-id';
  const resultsDiv = document.getElementById('track-results');
  const listDiv = document.getElementById('track-orders-list');

  let foundOrders = [];

  if (method === 'order-id') {
    const orderId = document.getElementById('track-order-id').value.trim();
    const errorDiv = document.getElementById('track-order-id-error');
    const inputEl = document.getElementById('track-order-id');

    // Clear errors
    inputEl.classList.remove('error');
    if (errorDiv) errorDiv.classList.remove('visible');

    if (!orderId) {
      inputEl.classList.add('error');
      if (errorDiv) {
        errorDiv.textContent = 'Please enter an Order ID';
        errorDiv.classList.add('visible');
      }
      return;
    }

    // Look for exact match or partial match
    foundOrders = orders.filter(order =>
      order.id.toUpperCase().includes(orderId.toUpperCase())
    );

  } else {
    const phone = document.getElementById('track-phone').value.trim();
    const errorDiv = document.getElementById('track-phone-error');
    const inputEl = document.getElementById('track-phone');

    inputEl.classList.remove('error');
    if (errorDiv) errorDiv.classList.remove('visible');

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

    foundOrders = orders.filter(order => {
      const cleanOrderPhone = order.customer.phone.replace(/[^\d]/g, '');
      return cleanOrderPhone === phone;
    });
  }

  resultsDiv.style.display = 'block';
  listDiv.innerHTML = '';

  if (foundOrders.length === 0) {
    const msg = method === 'order-id'
      ? 'No orders found matching this Order ID.'
      : 'No orders found for this phone number.';
    listDiv.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 40px 0;">${msg}</p>`;
    return;
  }

  foundOrders.sort((a, b) => new Date(b.date) - new Date(a.date));

  foundOrders.forEach(order => {
    const safeStatus = sanitizeHTML(order.status);
    const icon = getStatusIcon(order.status);
    const label = ORDER_STATUS_LABELS[order.status] || order.status;

    const div = document.createElement('div');
    div.className = 'admin-stat-card';
    div.style.textAlign = 'left';
    div.style.marginBottom = '20px';
    div.style.cursor = 'pointer';
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
        <div>
          <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">Order ID</span>
          <h4 style="font-family: var(--font-serif); font-size: 1.1rem; margin-top: 4px;">${sanitizeHTML(order.id)}</h4>
        </div>
        <span class="status-badge ${safeStatus}">${icon} ${sanitizeHTML(label)}</span>
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

// ===== ORDER STATUS FLOW =====
const ORDER_STATUS_FLOW = ['pending', 'approved', 'packaging', 'shipped', 'delivered'];
const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  packaging: 'Packaging',
  shipped: 'Shipped',
  delivered: 'Delivered',
  rejected: 'Rejected'
};
const ORDER_STATUS_ICONS = {
  pending: '⏳',
  approved: '✓',
  packaging: '📦',
  shipped: '🚚',
  delivered: '✅',
  rejected: '✕'
};

function getStatusIcon(status) {
  return ORDER_STATUS_ICONS[status] || '●';
}

function getNextStatus(currentStatus) {
  const idx = ORDER_STATUS_FLOW.indexOf(currentStatus);
  if (idx === -1 || idx >= ORDER_STATUS_FLOW.length - 1) return null;
  return ORDER_STATUS_FLOW[idx + 1];
}

function getPreviousStatuses(currentStatus) {
  const idx = ORDER_STATUS_FLOW.indexOf(currentStatus);
  if (idx === -1) return [];
  return ORDER_STATUS_FLOW.slice(0, idx + 1);
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

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('luxe_admin_auth');
      window.location.href = 'login.html';
    });
  }

  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
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

let currentAdminOrderFilter = 'all';

function renderAdminOrders(filter = 'all') {
  currentAdminOrderFilter = filter;
  const tbody = document.getElementById('admin-orders-body');
  if (!tbody) return;

  let f = orders;
  if (filter !== 'all') f = orders.filter(o => o.status === filter);
  f.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Update stats
  document.getElementById('stat-total').textContent = orders.length;
  document.getElementById('stat-pending').textContent = orders.filter(o => o.status === 'pending').length;
  document.getElementById('stat-shipped').textContent = orders.filter(o => o.status === 'shipped').length;
  document.getElementById('stat-delivered').textContent = orders.filter(o => o.status === 'delivered').length;

  tbody.innerHTML = '';
  if (f.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="admin-empty">No orders found.</td></tr>';
    return;
  }

  f.forEach(order => {
    const tr = document.createElement('tr');
    tr.dataset.orderId = order.id;
    const safeOrderId = sanitizeHTML(order.id);
    const safeCustomerName = sanitizeHTML(order.customer.name);
    const safeStatus = sanitizeHTML(order.status);
    const safeTransactionId = sanitizeHTML(order.transactionId);
    const statusIcon = getStatusIcon(order.status);
    const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status;

    tr.innerHTML = `
      <td><strong>${safeOrderId}</strong></td>
      <td>${new Date(order.date).toLocaleDateString()}</td>
      <td>${safeCustomerName}</td>
      <td>${order.items.length} items</td>
      <td>₹${order.grandTotal.toFixed(2)}</td>
      <td><span class="status-badge ${safeStatus}">${statusIcon} ${sanitizeHTML(statusLabel)}</span></td>
      <td>${safeTransactionId}</td>
      <td><button class="btn btn-dark btn-view" data-id="${safeOrderId}">View</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.btn-view').forEach(btn => {
    btn.addEventListener('click', () => openOrderDetail(btn.dataset.id));
  });
}

function updateAdminOrderStatusView(orderId, status) {
  const tbody = document.getElementById('admin-orders-body');
  if (!tbody) return;

  const row = tbody.querySelector(`tr[data-order-id="${orderId}"]`);
  const statusBadge = row?.querySelector('.status-badge');

  if (!row || !statusBadge) {
    renderAdminOrders(currentAdminOrderFilter);
    return;
  }

  if (currentAdminOrderFilter !== 'all' && currentAdminOrderFilter !== status) {
    row.remove();
    if (!tbody.querySelector('tr[data-order-id]')) {
      tbody.innerHTML = '<tr><td colspan="8" class="admin-empty">No orders found.</td></tr>';
    }
    updateStats();
    return;
  }

  statusBadge.className = `status-badge ${status}`;
  statusBadge.textContent = `${getStatusIcon(status)} ${ORDER_STATUS_LABELS[status] || status}`;
  updateStats();
}

function updateStats() {
  document.getElementById('stat-total').textContent = orders.length;
  document.getElementById('stat-pending').textContent = orders.filter(o => o.status === 'pending').length;
  document.getElementById('stat-shipped').textContent = orders.filter(o => o.status === 'shipped').length;
  document.getElementById('stat-delivered').textContent = orders.filter(o => o.status === 'delivered').length;
}

const renderAdminCatalogue = (() => {
  let prevStock = {};

  return function renderAdminCatalogue() {
    const tbody = document.getElementById('admin-catalogue-body');
    if (!tbody) return;

    const currentPrev = prevStock;
    tbody.innerHTML = '';

    PRODUCTS.forEach(p => {
      const changed = currentPrev[p.id] !== undefined && currentPrev[p.id] !== p.stock;
      const tr = document.createElement('tr');
      tr.dataset.productId = p.id;
      const safeName = sanitizeHTML(p.name);
      const safeCategory = sanitizeHTML(p.category);
      const safeBadge = p.badge ? sanitizeHTML(p.badge) : '—';
      const safeImage = sanitizeHTML(p.image);

      tr.innerHTML = `
        <td><img src="${safeImage}" width="40"></td>
        <td>${safeName}</td>
        <td>${safeCategory}</td>
        <td>₹${p.price.toFixed(2)}</td>
        <td>${safeBadge}</td>
        <td><span class="stock-indicator ${p.stock <= 3 ? 'low-stock' : ''}${changed ? ' flash' : ''}">${p.stock} units</span></td>
        <td>${new Date(p.lastUpdated).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-dark btn-edit" data-id="${p.id}">Edit</button>
          <button class="btn btn-danger btn-delete" data-id="${p.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    prevStock = {};
    PRODUCTS.forEach(p => { prevStock[p.id] = p.stock; });

    tbody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => openProductModal(parseInt(btn.dataset.id)));
    });
    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteProduct(parseInt(btn.dataset.id)));
    });
  };
})();

function updateAdminCatalogueStock(productId, stock) {
  const tbody = document.getElementById('admin-catalogue-body');
  if (!tbody) return;

  const row = tbody.querySelector(`tr[data-product-id="${productId}"]`);
  if (!row) {
    renderAdminCatalogue();
    return;
  }

  const indicator = row.querySelector('.stock-indicator');
  if (!indicator) {
    renderAdminCatalogue();
    return;
  }

  const classes = ['stock-indicator', 'flash'];
  if (stock <= 3) classes.push('low-stock');
  indicator.className = classes.join(' ');
  indicator.textContent = `${stock} units`;
  setTimeout(() => {
    if (indicator.isConnected) {
      indicator.classList.remove('flash');
    }
  }, 800);
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
          <div class="form-group"><label>Badge</label><input type="text" id="prod-badge" value="${product ? (product.badge || '') : ''}" placeholder="e.g. Bestseller, New"></div>
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
  const name = sanitizeInput(document.getElementById('prod-name').value);
  const category = sanitizeInput(document.getElementById('prod-category').value);
  const badge = sanitizeInput(document.getElementById('prod-badge').value) || null;
  const priceVal = document.getElementById('prod-price').value;
  const stockVal = document.getElementById('prod-stock').value;
  const image = sanitizeInput(document.getElementById('prod-image').value);
  const desc = sanitizeInput(document.getElementById('prod-desc').value);

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
    badge,
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

function advanceOrderStatus(orderId) {
  const o = orders.find(x => x.id === orderId);
  if (!o) return;

  const nextStatus = getNextStatus(o.status);
  if (!nextStatus) {
    showToast('Order is already at the final status.', 'info');
    return;
  }

  o.status = nextStatus;
  saveState();
  updateAdminOrderStatusView(orderId, nextStatus);
  document.getElementById('order-detail-modal')?.classList.remove('active');
  showToast(`Order advanced to ${ORDER_STATUS_LABELS[nextStatus]}`, 'success');
}

function rejectOrder(orderId) {
  const o = orders.find(x => x.id === orderId);
  if (!o || o.status !== 'pending') return;

  // Restore stock
  o.items.forEach(item => {
    const p = PRODUCTS.find(x => x.id === item.productId);
    if (p) {
      p.stock += item.quantity;
      updateAdminCatalogueStock(p.id, p.stock);
    }
  });

  o.status = 'rejected';
  saveState();
  updateCartCount();
  renderCartDropdown();
  renderOrderSummary();
  updateAdminOrderStatusView(orderId, 'rejected');
  document.getElementById('order-detail-modal')?.classList.remove('active');
  showToast('Order rejected — stock restored.', 'error');
}

function setupAdminFilters() {
  const container = document.getElementById('admin-filters');
  if (!container) return;

  // Build filter buttons: All + each status
  const filters = ['all', ...ORDER_STATUS_FLOW, 'rejected'];
  const filterLabels = {
    all: 'All Orders',
    pending: 'Pending',
    approved: 'Approved',
    packaging: 'Packaging',
    shipped: 'Shipped',
    delivered: 'Delivered',
    rejected: 'Rejected'
  };

  container.innerHTML = filters.map(f => `
    <button class="admin-filter-btn${f === 'all' ? ' active' : ''}" data-filter="${f}" aria-pressed="${f === 'all' ? 'true' : 'false'}">${filterLabels[f]}</button>
  `).join('');

  container.querySelectorAll('.admin-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.admin-filter-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
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
    const itemName = p ? sanitizeHTML(p.name) : 'Item';
    const itemQuantity = sanitizeHTML(item.quantity.toString());
    return `<tr><td>${itemName}</td><td>${itemQuantity}</td><td>₹${(p ? p.price * item.quantity : 0).toFixed(2)}</td></tr>`;
  }).join('');

  const safeOrderId = sanitizeHTML(order.id);
  const safeStatusLabel = sanitizeHTML(ORDER_STATUS_LABELS[order.status] || order.status);
  const safeStatusIcon = sanitizeHTML(getStatusIcon(order.status));
  const safeCustomerName = sanitizeHTML(order.customer.name);
  const safeAddress = sanitizeHTML(order.customer.address);
  const safeCity = sanitizeHTML(order.customer.city);
  const safeStatus = sanitizeHTML(order.status);

  // Build status timeline
  const completedStatuses = getPreviousStatuses(order.status);
  const currentStatus = order.status;
  const isRejected = currentStatus === 'rejected';

  const timelineHtml = isRejected ? `
    <div class="modal-timeline rejected">
      <div class="timeline-step rejected">
        <div class="timeline-dot rejected"></div>
        <div class="timeline-label">${sanitizeHTML(ORDER_STATUS_LABELS.rejected)}</div>
      </div>
    </div>
  ` : `
    <div class="modal-timeline">
      ${ORDER_STATUS_FLOW.map((s, idx) => {
        const isCompleted = completedStatuses.includes(s);
        const isCurrent = s === currentStatus;
        const stepClass = isCurrent ? 'active' : isCompleted ? 'completed' : '';
        return `
          <div class="timeline-step ${stepClass}">
            <div class="timeline-dot"></div>
            <div class="timeline-label">${sanitizeHTML(ORDER_STATUS_LABELS[s])}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Build action buttons (admin only)
  const isAdmin = isAuthenticated();
  const nextStatus = getNextStatus(currentStatus);
  const showAdvance = isAdmin && !isRejected && nextStatus;
  const showReject = isAdmin && currentStatus === 'pending';

  const actionsHtml = (showAdvance || showReject) ? `
    <div style="margin-top:24px; display:flex; gap:10px; flex-wrap:wrap;">
      ${showAdvance ? `<button class="btn btn-success" id="btn-advance-${safeOrderId}">Advance to ${sanitizeHTML(ORDER_STATUS_LABELS[nextStatus])}</button>` : ''}
      ${showReject ? `<button class="btn btn-danger" id="btn-reject-${safeOrderId}">Reject Order</button>` : ''}
    </div>
  ` : '';

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header"><h2>Order ${safeOrderId}</h2><button class="modal-close">✕</button></div>
      <div class="modal-body">
        <div class="modal-section">
          <h3><span class="section-icon">📋</span> Order Status</h3>
          <div class="modal-info-item" style="margin-bottom:16px;">
            <div class="label">Current Status</div>
            <div class="value">${safeStatusIcon} ${safeStatusLabel}</div>
          </div>
          ${timelineHtml}
        </div>

        <div class="modal-section">
          <h3><span class="section-icon">👤</span> Customer Details</h3>
          <div class="modal-info-grid">
            <div class="modal-info-item">
              <div class="label">Name</div>
              <div class="value">${safeCustomerName}</div>
            </div>
            <div class="modal-info-item">
              <div class="label">Address</div>
              <div class="value">${safeAddress}, ${safeCity}</div>
            </div>
          </div>
        </div>

        <div class="modal-section">
          <h3><span class="section-icon">🛍️</span> Items</h3>
          <table class="modal-items-table">
            <thead><tr><th>Item</th><th>Qty</th><th>Total</th></tr></thead>
            <tbody>${itemsRows}</tbody>
          </table>
          <div class="modal-totals">
            <div class="modal-total-row"><span>Subtotal</span><span>₹${order.total.toFixed(2)}</span></div>
            <div class="modal-total-row"><span>Shipping</span><span>${order.shipping === 0 ? 'Free' : '₹' + order.shipping.toFixed(2)}</span></div>
            <div class="modal-total-row grand"><span>Total</span><span>₹${order.grandTotal.toFixed(2)}</span></div>
          </div>
        </div>

        ${actionsHtml}
      </div>
    </div>
  `;

  // Attach event listeners
  const advanceBtn = modal.querySelector('#btn-advance-' + CSS.escape(order.id));
  const rejectBtn = modal.querySelector('#btn-reject-' + CSS.escape(order.id));
  advanceBtn?.addEventListener('click', () => advanceOrderStatus(order.id));
  rejectBtn?.addEventListener('click', () => rejectOrder(order.id));

  modal.querySelector('.modal-close').addEventListener('click', () => modal.classList.remove('active'));
  modal.classList.add('active');
}
