/**
 * Cart & Wishlist Sync — unified module for all pages
 */
// Flag so wishlist.js fallback knows we're loaded
window._cartSyncWishlistLoaded = true;

(function () {
  'use strict';


  // ── Storage helpers ────────────────────────────────────────────────────────
  function getCart() {
    try { 
      let c = localStorage.getItem('cart');
      if (!c || c === 'undefined' || c === 'null') c = localStorage.getItem('luxuryCart');
      if (!c || c === 'undefined' || c === 'null') c = '[]';
      let parsed = JSON.parse(c);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }
  function saveCart(cart) {
    try {
      localStorage.setItem('luxuryCart', JSON.stringify(cart));
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (e) { console.error('Storage error:', e); }
  }

  function getWishlist() {
    try { 
      let w = localStorage.getItem('wishlist');
      if (!w || w === 'undefined' || w === 'null') w = localStorage.getItem('luxuryWishlist');
      if (!w || w === 'undefined' || w === 'null') w = '[]';
      let parsed = JSON.parse(w);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }
  function saveWishlist(wl) {
    localStorage.setItem('luxuryWishlist', JSON.stringify(wl));
    localStorage.setItem('wishlist', JSON.stringify(wl));
  }

  function safeParsePrice(price) {
    if (typeof price === 'number' && !isNaN(price)) return price;
    if (!price) return 0;
    const num = parseFloat(String(price).replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
  }

  // ── Badge updates ──────────────────────────────────────────────────────────
  function updateCartBadge() {
    const cart = getCart();
    const count = cart.reduce((t, i) => t + (parseInt(i.quantity) || 1), 0);
    document.querySelectorAll('#cartCount, .cart-badge').forEach(el => {
      el.textContent = count;
    });
  }

  function updateWishlistBadge() {
    const count = getWishlist().length;
    document.querySelectorAll('#wishlistCount, .wishlist-badge').forEach(el => {
      el.textContent = count;
    });
  }

  function syncAll() {
    updateCartBadge();
    updateWishlistBadge();
    updateAuthButtons();
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  function updateAuthButtons() {
    const user = localStorage.getItem('currentUser');
    const signIn  = document.getElementById('signInBtn');
    const signUp  = document.getElementById('signUpBtn');
    const profile = document.getElementById('profileBtn');
    if (user) {
      if (signIn)  signIn.style.display  = 'none';
      if (signUp)  signUp.style.display  = 'none';
      if (profile) profile.style.display = 'inline-block';
    } else {
      if (signIn)  signIn.style.display  = 'inline-block';
      if (signUp)  signUp.style.display  = 'inline-block';
      if (profile) profile.style.display = 'none';
    }
  }

  // ── Cart sidebar ───────────────────────────────────────────────────────────
  function renderCart() {
    const cart     = getCart();
    const empty    = document.getElementById('cartEmpty');
    const content  = document.getElementById('cartContent');
    const items    = document.getElementById('cartItems');
    const total    = document.getElementById('cartTotal');

    if (!items) return;

    if (cart.length === 0) {
      if (empty)   empty.style.display   = 'flex';
      if (content) content.style.display = 'none';
    } else {
      if (empty)   empty.style.display   = 'none';
      if (content) content.style.display = 'block';
      items.innerHTML = cart.map(item => `
        <div class="cart-item" style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #222;">
          <img src="${item.image || ''}" alt="${item.name}" style="width:70px;height:70px;object-fit:cover;border-radius:6px;flex-shrink:0;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.9rem;font-weight:600;color:#fff;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</div>
            <div style="color:#aaa;font-size:0.85rem;margin-bottom:8px;">$${safeParsePrice(item.price).toFixed(2)}</div>
            <div style="display:flex;align-items:center;gap:8px;">
              <button onclick="window.cartUpdateQty('${item.id}',-1)" style="width:26px;height:26px;background:#222;border:1px solid #444;color:#fff;border-radius:4px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">−</button>
              <span style="color:#fff;min-width:20px;text-align:center;">${item.quantity}</span>
              <button onclick="window.cartUpdateQty('${item.id}',1)" style="width:26px;height:26px;background:#222;border:1px solid #444;color:#fff;border-radius:4px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">+</button>
              <button onclick="window.cartRemove('${item.id}')" style="margin-left:auto;background:none;border:none;color:#666;cursor:pointer;font-size:1.2rem;" title="Remove">&times;</button>
            </div>
          </div>
        </div>`).join('');
    }

    if (total) {
      const sum = cart.reduce((s, i) => s + safeParsePrice(i.price) * parseInt(i.quantity || 1), 0);
      total.textContent = '$' + sum.toFixed(2);
    }
    updateCartBadge();
  }

  // ── Wishlist sidebar ───────────────────────────────────────────────────────
  window.renderWishlist = function renderWishlist() {
    const wl      = getWishlist();
    const empty   = document.getElementById('wishlistEmpty');
    const content = document.getElementById('wishlistContent');
    const items   = document.getElementById('wishlistItems');

    if (!items) return;

    if (wl.length === 0) {
      if (empty)   empty.style.display   = 'flex';
      if (content) content.style.display = 'none';
    } else {
      if (empty)   empty.style.display   = 'none';
      if (content) content.style.display = 'block';
      items.innerHTML = wl.map((item, idx) => `
        <div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #222;align-items:center;">
          <img src="${item.image || ''}" alt="${item.name}" style="width:70px;height:70px;object-fit:cover;border-radius:6px;flex-shrink:0;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.9rem;font-weight:600;color:#fff;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</div>
            <div style="color:#aaa;font-size:0.85rem;margin-bottom:8px;">$${safeParsePrice(item.price).toFixed(2)}</div>
            <div style="display:flex;gap:8px;">
              <button onclick="window.wishlistMoveToCart(${idx})" style="padding:5px 12px;background:#fff;color:#000;border:none;border-radius:4px;cursor:pointer;font-size:0.8rem;font-weight:600;">Add to Cart</button>
              <button onclick="window.wishlistRemove(${idx})" style="padding:5px 12px;background:transparent;color:#aaa;border:1px solid #444;border-radius:4px;cursor:pointer;font-size:0.8rem;">Remove</button>
            </div>
          </div>
        </div>`).join('');
    }
    updateWishlistBadge();
  }


  // ── Quick Pay (Apple / Google Pay) ─────────────────────────────────────────
  window.quickPay = function(method) {
    const cart = getCart();
    if (cart.length === 0) {
      if (typeof window.showNotification === 'function') window.showNotification('Cart is empty', 'error');
      return;
    }

    const totalAmount = cart.reduce((s, i) => s + (safeParsePrice(i.price) * parseInt(i.quantity || 1)), 0).toFixed(2);
    
    // Create styles for animation if not exists
    if (!document.getElementById('qp-styles')) {
      const style = document.createElement('style');
      style.id = 'qp-styles';
      style.innerHTML = `
        @keyframes qp-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes qp-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .qp-success-icon { color: #34C759; font-size: 40px; margin-bottom: 10px; display: none; }
        .qp-overlay { position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity 0.3s; }
        .qp-overlay.active { opacity: 1; }
        .qp-sheet { background:#fff;width:100%;max-width:400px;border-radius:24px 24px 0 0;padding:30px 24px;box-shadow:0 -4px 20px rgba(0,0,0,0.2);transform:translateY(100%);transition:transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);font-family:-apple-system,BlinkMacSystemFont,sans-serif; }
        .qp-sheet.active { transform: translateY(0); }
      `;
      document.head.appendChild(style);
    }

    const isApple = method === 'apple';
    const logoSvg = isApple ? 
      `<svg width="30" height="30" viewBox="0 0 384 512" fill="black" xmlns="http://www.w3.org/2000/svg"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>` : 
      `<svg width="30" height="30" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path fill="#4285F4" d="M43.6 20H24v8.5h11.8C34 33 29.8 36 24 36c-7.4 0-13.6-5.8-13.6-13s6.2-13 13.6-13c3.4 0 6.5 1.3 8.9 3.4l6.4-6.4C35.2 3.1 29.9 1 24 1 11.3 1 1 11.3 1 24s10.3 23 23 23c12 0 21.6-9.6 21.6-21.6 0-1.8-.3-3.7-.8-5.4z"/><path fill="#34A853" d="M24 47c11.6 0 21-9.2 21.6-20.7h-11.6c-.9 3.5-3.8 6.4-7.5 7.4v9.6C35.6 41 41 33.7 41 24h6c0 12.7-10.3 23-23 23z"/><path fill="#FBBC05" d="M10.4 33c-.7-1.8-1.2-3.8-1.2-5.8s.4-3.9 1.2-5.8v-9.6C6.6 15.6 4.3 19.6 4.3 24s2.3 8.4 6.1 12.2L10.4 33z"/><path fill="#EA4335" d="M24 8.5c3.5 0 6.6 1.4 9.1 3.5l6.4-6.4C35.2 1.6 29.9-.5 24-.5 13.2-.5 4.3 6.6.6 16.2l9.8 9.6C12.4 17.5 17.7 12 24 12v-3.5z"/></svg>`;

    const overlay = document.createElement('div');
    overlay.className = 'qp-overlay';
    overlay.innerHTML = `
      <div class="qp-sheet" id="qpSheet">
        <div style="text-align:center;margin-bottom:20px;">
            ${logoSvg}
            <h3 style="margin:10px 0 5px;color:#000;font-size:1.2rem;">${isApple ? 'Apple Pay' : 'Google Pay'}</h3>
            <p style="color:#666;font-size:0.9rem;margin:0;">FundMyGame</p>
        </div>
        <div style="border-top:1px solid #eee;border-bottom:1px solid #eee;padding:15px 0;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
            <span style="color:#666;font-size:0.9rem;">PAYMENT METHOD</span>
            <span style="color:#000;font-weight:500;">•••• 4242</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:40px;">
            <span style="color:#666;font-size:1rem;">TOTAL</span>
            <span style="color:#000;font-size:1.8rem;font-weight:700;">$${totalAmount}</span>
        </div>
        <div style="text-align:center;" id="qpStatus">
            <div id="qpSpinner" style="width:40px;height:40px;border:3px solid #f3f3f3;border-top:3px solid #000;border-radius:50%;animation:qp-spin 1s linear infinite;margin:0 auto 15px;"></div>
            <div id="qpSuccess" class="qp-success-icon">✓</div>
            <p id="qpText" style="color:#000;font-weight:600;font-size:1.1rem;margin:0;">Processing Payment...</p>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Animate in
    setTimeout(() => {
      overlay.classList.add('active');
      document.getElementById('qpSheet').classList.add('active');
    }, 10);

    // Process payment
    setTimeout(() => {
      document.getElementById('qpSpinner').style.display = 'none';
      document.getElementById('qpSuccess').style.display = 'block';
      document.getElementById('qpText').textContent = 'Payment Successful!';
      document.getElementById('qpText').style.color = '#34C759';
      
      // Empty cart
      saveCart([]);
      renderCart();

      // Sync with server quietly
      const formData = new FormData();
      formData.append('action', 'sync_js_cart');
      formData.append('cart_data', JSON.stringify([]));
      fetch('/wp-admin/admin-ajax.php', { method: 'POST', body: formData }).catch(()=>{});

      // Animate out
      setTimeout(() => {
        document.getElementById('qpSheet').classList.remove('active');
        overlay.classList.remove('active');
        setTimeout(() => {
          overlay.remove();
          window.closeCart(); // close the cart sidebar too
          if (typeof window.showNotification === 'function') {
            window.showNotification('Order completed! Thank you for your purchase.', 'success');
          }
        }, 300);
      }, 1500);
      
    }, 2500);
  };

  // ── Public API ─────────────────────────────────────────────────────────────

  // Cart open/close
  
  // Global notification function
  window.showNotification = function(message, type = 'success') {
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
      document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    const bg = type === 'success' ? '#2ecc71' : (type === 'error' ? '#e74c3c' : '#3498db');
    toast.style.cssText = `background:${bg};color:#fff;padding:12px 24px;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-family:Inter,sans-serif;font-size:0.9rem;font-weight:500;opacity:0;transform:translateY(20px);transition:all 0.3s cubic-bezier(0.68,-0.55,0.265,1.55);display:flex;align-items:center;gap:10px;`;
    
    const icon = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');
    toast.innerHTML = `<span style="font-weight:bold;font-size:1.1rem;">${icon}</span> ${message}`;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);
    
    // Animate out
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  window.toggleCart = function () {
    const overlay = document.getElementById('cartOverlay');
    const sidebar = document.getElementById('cartSidebar');
    if (!sidebar) return;
    const isOpen = sidebar.classList.contains('active');
    if (isOpen) {
      overlay && overlay.classList.remove('active');
      sidebar.classList.remove('active');
    } else {
      renderCart();
      overlay && overlay.classList.add('active');
      sidebar.classList.add('active');
      // close wishlist if open
      document.getElementById('wishlistOverlay')?.classList.remove('active');
      document.getElementById('wishlistSidebar')?.classList.remove('active');
    }
  };
  window.closeCart = function () {
    document.getElementById('cartOverlay')?.classList.remove('active');
    document.getElementById('cartSidebar')?.classList.remove('active');
  };

  // Wishlist open/close
  window.toggleWishlist = function () {
    const overlay = document.getElementById('wishlistOverlay');
    const sidebar = document.getElementById('wishlistSidebar');
    if (!sidebar) return;
    const isOpen = sidebar.classList.contains('active');
    if (isOpen) {
      overlay && overlay.classList.remove('active');
      sidebar.classList.remove('active');
    } else {
      renderWishlist();
      overlay && overlay.classList.add('active');
      sidebar.classList.add('active');
      // close cart if open
      document.getElementById('cartOverlay')?.classList.remove('active');
      document.getElementById('cartSidebar')?.classList.remove('active');
    }
  };
  window.closeWishlistSidebar = function () {
    document.getElementById('wishlistOverlay')?.classList.remove('active');
    document.getElementById('wishlistSidebar')?.classList.remove('active');
  };

  // Add to cart
  window.addToCart = function (name, price, image, qty) {
    const cart = getCart();
    const id   = (name + price).toLowerCase().replace(/\s+/g, '-');
    const existing = cart.find(i => i.id === id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + (parseInt(qty) || 1);
    } else {
      cart.push({ id, name, price: safeParsePrice(price), image, quantity: parseInt(qty) || 1 });
    }
    saveCart(cart);
    renderCart();
    if (typeof window.showNotification === 'function') {
      window.showNotification('Added to cart!', 'success');
    }
  };

  // Cart qty / remove
  window.proceedToCheckout = function() {
    const cart = getCart();
    if (cart.length === 0) {
      if (typeof window.showNotification === 'function') window.showNotification('Cart is empty', 'error');
      return;
    }
    
    const btn = document.querySelector('.cart-continue') || document.querySelector('.cart-checkout-btn');
    if (btn) btn.innerHTML = 'Syncing...';
    
    const formData = new FormData();
    formData.append('action', 'sync_js_cart');
    formData.append('cart_data', JSON.stringify(cart));
    
    fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        body: formData
    }).then(r => r.json()).then(res => {
        window.location.href = '/checkout/';
    }).catch(err => {
        console.error('Error syncing cart:', err);
        window.location.href = '/checkout/';
    });
  };

  window.cartUpdateQty = function (id, delta) {
    let cart = getCart();
    const item = cart.find(i => i.id === id);
    if (item) {
      item.quantity = (item.quantity || 1) + delta;
      if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
    }
    saveCart(cart);
    renderCart();
  };
  window.cartRemove = function (id) {
    saveCart(getCart().filter(i => i.id !== id));
    renderCart();
  };
  // legacy aliases
  window.removeFromCart   = window.cartRemove;
  window.updateQuantity   = function(id, delta) { window.cartUpdateQty(id, delta); };
  window.cartAdd          = window.addToCart;

  // Add to wishlist
  window.addToWishlist = function (name, price, image, btnEl) {
    let wl = getWishlist();
    const alreadyIdx = wl.findIndex(i => i.name === name);
    if (alreadyIdx !== -1) {
      wl.splice(alreadyIdx, 1);
      saveWishlist(wl);
      updateWishlistBadge();
      window.renderWishlist();
      // Reset heart icon on the button
      if (btnEl) { btnEl.textContent = '♡'; btnEl.style.color = '#fff'; }
      if (typeof window.showNotification === 'function')
        window.showNotification('Removed from wishlist', 'info');
      return;
    }
    wl.push({ name, price: safeParsePrice(price), image });
    saveWishlist(wl);
    updateWishlistBadge();
    window.renderWishlist();
    // Fill heart icon on the button
    if (btnEl) { btnEl.textContent = '♥'; btnEl.style.color = '#e74c3c'; }
    if (typeof window.showNotification === 'function')
      window.showNotification('Added to wishlist! ♥', 'success');
    // Auto-open wishlist sidebar so user sees their item
    setTimeout(function() { window.toggleWishlist && window.toggleWishlist(); }, 300);
  };

  // Alias for compatibility with wishlist.js theme file
  window.removeFromWishlist = function(itemId) {
    let wl = getWishlist();
    wl = wl.filter(i => (i.id !== itemId) && (i.name !== itemId));
    saveWishlist(wl);
    updateWishlistBadge();
    window.renderWishlist();
  };

  // Move from wishlist to cart
  window.wishlistMoveToCart = function (idx) {
    const wl = getWishlist();
    const item = wl[idx];
    if (!item) return;
    window.addToCart(item.name, item.price, item.image);
    wl.splice(idx, 1);
    saveWishlist(wl);
    renderWishlist();
  };

  // Remove from wishlist
  window.wishlistRemove = function (idx) {
    const wl = getWishlist();
    wl.splice(idx, 1);
    saveWishlist(wl);
    renderWishlist();
  };

  // ── Overlay click closes ───────────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    if (e.target.id === 'cartOverlay')     window.closeCart();
    if (e.target.id === 'wishlistOverlay') window.closeWishlistSidebar();
  });

  // ── Init ───────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncAll);
  } else {
    syncAll();
  }
  setTimeout(syncAll, 400);
  setTimeout(syncAll, 1200);

  // cross-tab sync
  window.addEventListener('storage', function (e) {
    if (e.key === 'cart' || e.key === 'luxuryCart')           updateCartBadge();
    if (e.key === 'wishlist' || e.key === 'luxuryWishlist')   updateWishlistBadge();
    if (e.key === 'currentUser')                              updateAuthButtons();
  });

  setInterval(syncAll, 3000);

})();


  window.showConfirm = function(message, onConfirm) {
    let overlay = document.getElementById('confirm-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'confirm-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s ease;';
      document.body.appendChild(overlay);
    }
    
    const modal = document.createElement('div');
    modal.style.cssText = 'background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:30px;max-width:400px;width:90%;text-align:center;transform:translateY(20px);transition:transform 0.3s ease;box-shadow:0 10px 40px rgba(0,0,0,0.5);';
    
    modal.innerHTML = `
      <div style="font-size:3rem;margin-bottom:15px;">🚪</div>
      <h3 style="color:#fff;font-family:'Playfair Display',serif;font-size:1.5rem;margin:0 0 15px 0;">Sign Out</h3>
      <p style="color:#ccc;font-size:1rem;margin:0 0 25px 0;line-height:1.5;">${message}</p>
      <div style="display:flex;gap:15px;justify-content:center;">
        <button id="confirm-cancel" style="flex:1;padding:12px;background:transparent;color:#fff;border:1px solid #555;border-radius:6px;cursor:pointer;font-weight:600;transition:all 0.2s;">Cancel</button>
        <button id="confirm-yes" style="flex:1;padding:12px;background:#ff6464;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;transition:all 0.2s;">Yes, Logout</button>
      </div>
    `;
    
    overlay.innerHTML = '';
    overlay.appendChild(modal);
    overlay.style.display = 'flex';
    
    // Animate in
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      modal.style.transform = 'translateY(0)';
    });
    
    const close = () => {
      overlay.style.opacity = '0';
      modal.style.transform = 'translateY(20px)';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 300);
    };
    
    document.getElementById('confirm-cancel').onclick = close;
    document.getElementById('confirm-yes').onclick = () => {
      close();
      if (onConfirm) onConfirm();
    };
  };
