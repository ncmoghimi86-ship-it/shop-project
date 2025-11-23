
let products = [];   // محصولات از API
let cart = [];       // سبد خرید (فقط در حافظه موقت - رفرش = پاک میشه)

/* ========================================
   انتخاب المنت‌های DOM
   ======================================== */
const selectors = {
    products: document.querySelector('.products'),
    cartBtn: document.querySelector('.cart-btn'),
    cartQty: document.querySelector('.cart-qty'),
    cartOverlay: document.querySelector('.cart-overlay'),
    cart: document.querySelector('.cart'),
    cartClose: document.querySelector('.cart-close'),
    cartBody: document.querySelector('.cart-body'),
    cartTotal: document.querySelector('.cart-total'),
    continueShopping: document.querySelector('.continue-shopping')
};

const themeToggle = document.getElementById('themeToggle');
const loader = document.querySelector('.loader-wrapper');

/* ========================================
   مدیریت تم تاریک / روشن 
   ======================================== */
const setTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme); // تم ذخیره بشه 
    themeToggle.innerHTML = theme === 'dark'
        ? '<i class="bi bi-moon-stars-fill"></i>'
        : '<i class="bi bi-sun-fill"></i>';
};

setTheme(localStorage.getItem('theme') || 'light');
themeToggle.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme || 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
});

/* ========================================
   اسکلتون لودینگ
   ======================================== */
const renderSkeleton = () => {
    selectors.products.innerHTML = Array(12).fill('').map(() => `
        <div class="product skeleton">
            <div class="skeleton-img"></div>
            <div class="skeleton-title"></div>
            <div class="skeleton-price"></div>
        </div>
    `).join("");
};

/* ========================================
   رندر محصولات
   ======================================== */
const renderProducts = () => {
    selectors.products.innerHTML = products.map(p => {
        const isInCart = cart.some(item => item.id === p.id);
        return `
        <div class="product">
            <img src="${p.image}" alt="${p.title}">
            <h3>${p.title.length > 60 ? p.title.substr(0, 60) + '...' : p.title}</h3>
            <h5>$${p.price.toFixed(2)}</h5>
            <button ${isInCart ? 'class="disable" disabled' : ''} data-id="${p.id}">
                ${isInCart ? 'Added' : 'Add to Cart'}
            </button>
        </div>`;
    }).join("");
};

/* ========================================
   رندر سبد خرید
   ======================================== */
const renderCart = () => {
    const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
    selectors.cartQty.textContent = totalItems;
    selectors.cartQty.style.display = totalItems > 0 ? 'grid' : 'none';

    const totalPrice = cart.reduce((sum, i) => {
        const p = products.find(x => x.id === i.id);
        return sum + (p ? p.price * i.qty : 0);
    }, 0);

    selectors.cartTotal.textContent = '$' + totalPrice.toFixed(2);

    if (cart.length === 0) {
        selectors.cartBody.innerHTML = `<div class="cart-empty">Your cart is empty</div>`;
        return;
    }

    selectors.cartBody.innerHTML = cart.map(item => {
        const p = products.find(x => x.id === item.id) || {};
        const amount = (p.price || 0) * item.qty;
        return `
        <div class="cart-item" data-id="${item.id}">
            <img src="${p.image || ''}" alt="${p.title || 'Product'}">
            <div class="cart-item-details">
                <h3>${(p.title || 'Unknown').substr(0, 40)}...</h3>
                <h5>$${p.price ? p.price.toFixed(2) : '0.00'}</h5>
                <div class="cart-item-amount">
                    <i class="bi bi-dash-lg" data-btn="decr"></i>
                    <span class="qty">${item.qty}</span>
                    <i class="bi bi-plus-lg" data-btn="incr"></i>
                    <span class="cart-item-price">$${amount.toFixed(2)}</span>
                </div>
            </div>
        </div>`;
    }).join("");
};

/* ========================================
   توابع سبد خرید
   ======================================== */
const toggleCart = () => {
    selectors.cartOverlay.classList.toggle('show');
    selectors.cart.classList.toggle('show');
};

const addToCart = (e) => {
    if (e.target.hasAttribute('data-id')) {
        const id = parseInt(e.target.dataset.id);
        if (cart.some(x => x.id === id)) {
            alert('This item is already in your cart!');
            return;
        }
        cart.push({ id, qty: 1 });
        renderProducts();
        renderCart();
        toggleCart();
    }
};

/* ========================================
   دریافت محصولات از API
   ======================================== */
const loadProducts = async () => {
    try {
        const res = await fetch('https://fakestoreapi.com/products');
        if (!res.ok) throw new Error();
        products = await res.json();
        renderProducts();
    } catch (err) {
        selectors.products.innerHTML = `
            <div style="text-align:center;padding:4rem;color:#ef4444;font-size:1.2rem;">
                <i class="bi bi-wifi-off" style="font-size:3rem;"></i><br><br>
                No internet connection
            </div>`;
    }
};

/* ========================================
   راه‌اندازی اولیه 
   ======================================== */
const initStore = async () => {
    cart = []; 
    renderSkeleton();
    loader.classList.add('hidden');

    await loadProducts();
    renderCart(); 
};

/* ========================================
   رویدادها
   ======================================== */
document.addEventListener('DOMContentLoaded', () => {
    initStore();

    selectors.products.addEventListener('click', addToCart);
    selectors.cartBtn.addEventListener('click', toggleCart);
    selectors.cartClose.addEventListener('click', toggleCart);
    selectors.continueShopping.addEventListener('click', toggleCart);
    selectors.cartOverlay.addEventListener('click', e => e.target === selectors.cartOverlay && toggleCart());

    // + و - در سبد
    selectors.cartBody.addEventListener('click', e => {
        if (!e.target.hasAttribute('data-btn')) return;
        const itemEl = e.target.closest('.cart-item');
        const id = parseInt(itemEl.dataset.id);
        const item = cart.find(x => x.id === id);
        if (!item) return;

        if (e.target.dataset.btn === 'incr') item.qty++;
        if (e.target.dataset.btn === 'decr') {
            if (item.qty === 1) {
                cart = cart.filter(x => x.id !== id);
            } else {
                item.qty--;
            }
        }

        // ذخیره نمیشه → رفرش = پاک
        renderCart();
        renderProducts();
    });
});