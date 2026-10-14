/**
 * MEU CARRINHO - Application Logic
 * Pure ES6+ Vanilla JavaScript
 * Zero build-step, reactive UI, localStorage persistence.
 */

(function () {
  'use strict';

  // --- Constants & Keys ---
  const STORAGE_KEY = 'meu_carrinho_produtos_v1';
  const THEME_KEY = 'meu_carrinho_theme';

  // Known store profiles with regex matchers & keys
  const STORE_REGISTRY = [
    { key: 'amazon', name: 'Amazon', regex: /amazon\.(com|com\.br|co\.uk|es)|amzn\.to/i },
    { key: 'mercadolivre', name: 'Mercado Livre', regex: /mercadolivre\.(com|com\.br)|produto\.mercadolivre|ml\.com/i },
    { key: 'shopee', name: 'Shopee', regex: /shopee\.(com|com\.br)|shp\.ee/i },
    { key: 'kabum', name: 'KaBuM!', regex: /kabum\.com\.br/i },
    { key: 'aliexpress', name: 'AliExpress', regex: /aliexpress\.(com|pt)|ali\.ski/i },
    { key: 'magalu', name: 'Magalu', regex: /magazineluiza\.com\.br|magalu\.com/i },
    { key: 'shein', name: 'Shein', regex: /shein\.(com|com\.br)/i },
    { key: 'pichau', name: 'Pichau', regex: /pichau\.com\.br/i },
    { key: 'terabyte', name: 'Terabyte', regex: /terabyteshop\.com\.br/i }
  ];

  // --- State ---
  let products = [];
  let currentTab = 'pending'; // 'pending' | 'purchased' | 'all'
  let searchQuery = '';
  let sortBy = 'recent'; // 'recent' | 'price-asc' | 'price-desc' | 'name-asc'
  let editingProductId = null;
  let currentImageBase64 = '';

  // --- DOM Elements ---
  const el = {
    html: document.documentElement,
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    tabButtons: document.querySelectorAll('.tab-btn'),
    sortSelect: document.getElementById('sortSelect'),
    toggleSelectAllBtn: document.getElementById('toggleSelectAllBtn'),
    toggleSelectAllLabel: document.getElementById('toggleSelectAllLabel'),
    productsGrid: document.getElementById('productsGrid'),
    emptyState: document.getElementById('emptyState'),
    emptyStateTitle: document.getElementById('emptyStateTitle'),
    emptyStateDesc: document.getElementById('emptyStateDesc'),
    emptyStateActionBtn: document.getElementById('emptyStateActionBtn'),
    emptyStateIcon: document.getElementById('emptyStateIcon'),
    openNewProductModalBtn: document.getElementById('openNewProductModalBtn'),
    productModal: document.getElementById('productModal'),
    modalTitle: document.getElementById('modalTitle'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),
    productForm: document.getElementById('productForm'),
    productId: document.getElementById('productId'),
    productUrl: document.getElementById('productUrl'),
    productName: document.getElementById('productName'),
    productPrice: document.getElementById('productPrice'),
    productShipping: document.getElementById('productShipping'),
    productQuantity: document.getElementById('productQuantity'),
    modalQtyMinus: document.getElementById('modalQtyMinus'),
    modalQtyPlus: document.getElementById('modalQtyPlus'),
    productStore: document.getElementById('productStore'),
    detectedStorePill: document.getElementById('detectedStorePill'),
    tabImgUrlBtn: document.getElementById('tabImgUrlBtn'),
    tabImgUploadBtn: document.getElementById('tabImgUploadBtn'),
    imgUrlSection: document.getElementById('imgUrlSection'),
    imgUploadSection: document.getElementById('imgUploadSection'),
    productImageUrl: document.getElementById('productImageUrl'),
    productImageFile: document.getElementById('productImageFile'),
    uploadDropzone: document.getElementById('uploadDropzone'),
    imagePreviewBox: document.getElementById('imagePreviewBox'),
    imagePreviewImg: document.getElementById('imagePreviewImg'),
    removeImageBtn: document.getElementById('removeImageBtn'),
    productNotes: document.getElementById('productNotes'),
    saveBtnLabel: document.getElementById('saveBtnLabel'),
    // Summary
    selectedItemsPill: document.getElementById('selectedItemsPill'),
    summarySubtotal: document.getElementById('summarySubtotal'),
    summaryShipping: document.getElementById('summaryShipping'),
    summaryTotal: document.getElementById('summaryTotal'),
    markSelectedPurchasedBtn: document.getElementById('markSelectedPurchasedBtn'),
    purchaseProgressPercent: document.getElementById('purchaseProgressPercent'),
    purchaseProgressBar: document.getElementById('purchaseProgressBar'),
    metricTotalPending: document.getElementById('metricTotalPending'),
    metricTotalPurchased: document.getElementById('metricTotalPurchased'),
    // Header & Tab Badges
    pillPendingCount: document.getElementById('pillPendingCount'),
    pillPurchasedCount: document.getElementById('pillPurchasedCount'),
    badgePendingCount: document.getElementById('badgePendingCount'),
    badgePurchasedCount: document.getElementById('badgePurchasedCount'),
    badgeAllCount: document.getElementById('badgeAllCount'),
    // Confirmation Modal
    confirmModal: document.getElementById('confirmModal'),
    confirmTitle: document.getElementById('confirmTitle'),
    confirmMessage: document.getElementById('confirmMessage'),
    confirmOkBtn: document.getElementById('confirmOkBtn'),
    confirmOkLabel: document.getElementById('confirmOkLabel'),
    confirmCancelBtn: document.getElementById('confirmCancelBtn'),
    confirmCloseBtn: document.getElementById('confirmCloseBtn'),
    // Toast
    toastContainer: document.getElementById('toastContainer')
  };

  // Contextual icons for the empty state
  const EMPTY_STATE_ICONS = {
    search: '<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path><path d="M8 11h6"></path></svg>',
    purchased: '<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="m9 14 2 2 4-4"></path></svg>',
    cart: '<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>'
  };

  // --- Currency & Formatting Helpers ---
  function formatMoney(amount) {
    const validAmount = Number(amount) || 0;
    return validAmount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  // --- Store Detection Logic ---
  function detectStoreFromUrl(url) {
    if (!url) return { name: '', key: 'generic' };

    try {
      // Normalize url
      let testUrl = url.trim();
      if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
        testUrl = 'https://' + testUrl;
      }
      const parsed = new URL(testUrl);
      const host = parsed.hostname;

      for (const item of STORE_REGISTRY) {
        if (item.regex.test(host)) {
          return { name: item.name, key: item.key };
        }
      }

      // Fallback: extract clean domain name
      const cleanHost = host.replace(/^www\./, '').split('.')[0];
      const capitalized = cleanHost.charAt(0).toUpperCase() + cleanHost.slice(1);
      return { name: capitalized, key: 'generic' };
    } catch {
      return { name: '', key: 'generic' };
    }
  }

  function updateStoreBadgePreview(storeName, storeKey) {
    if (!storeName) {
      el.detectedStorePill.textContent = 'Auto';
      el.detectedStorePill.className = 'store-pill store-generic';
      return;
    }
    el.detectedStorePill.textContent = storeName;
    el.detectedStorePill.className = `store-pill store-${storeKey || 'generic'}`;
  }

  // --- LocalStorage State Management ---
  function loadProductsFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          products = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar dados do localStorage:', e);
    }
    products = [];
  }

  function saveProductsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
      return true;
    } catch (e) {
      console.error('Falha ao salvar no localStorage:', e);
      showToast('Não foi possível salvar: o espaço de armazenamento do navegador está cheio. Tente usar imagens menores.', 'danger');
      return false;
    }
  }

  // --- Theme Management ---
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    setTheme(savedTheme);

    el.themeToggleBtn.addEventListener('click', () => {
      const current = el.html.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      setTheme(next);
    });
  }

  function setTheme(theme) {
    el.html.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  // --- Image Processing (Compress via Canvas) ---
  function compressImageFile(file, maxWidth = 500, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Imagem inválida'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  }

  // --- Toast System ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'danger') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 250ms ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  // --- Calculations & Summary Updates ---
  function updateFinancialSummary() {
    let pendingCount = 0;
    let purchasedCount = 0;
    let totalPendingValue = 0;
    let totalPurchasedValue = 0;

    let selectedSubtotal = 0;
    let selectedShipping = 0;
    let selectedCount = 0;

    products.forEach((p) => {
      const itemSubtotal = (Number(p.price) || 0) * (Number(p.quantity) || 1);
      const itemShipping = Number(p.shipping) || 0;
      const itemTotal = itemSubtotal + itemShipping;

      if (p.purchased) {
        purchasedCount++;
        totalPurchasedValue += itemTotal;
      } else {
        pendingCount++;
        totalPendingValue += itemTotal;
      }

      if (p.selected) {
        selectedCount++;
        selectedSubtotal += itemSubtotal;
        selectedShipping += itemShipping;
      }
    });

    const selectedTotal = selectedSubtotal + selectedShipping;

    // Update simulation summary sidebar
    el.selectedItemsPill.textContent = `${selectedCount} selecionado${selectedCount === 1 ? '' : 's'}`;
    el.summarySubtotal.textContent = formatMoney(selectedSubtotal);
    el.summaryShipping.textContent = selectedShipping > 0 ? formatMoney(selectedShipping) : 'Grátis';
    el.summaryTotal.textContent = formatMoney(selectedTotal);

    // Disable / enable action buttons
    el.markSelectedPurchasedBtn.disabled = selectedCount === 0;

    // Overall metrics
    el.metricTotalPending.textContent = formatMoney(totalPendingValue);
    el.metricTotalPurchased.textContent = formatMoney(totalPurchasedValue);

    const grandTotalItems = totalPendingValue + totalPurchasedValue;
    const progressPercent = grandTotalItems > 0 ? Math.round((totalPurchasedValue / grandTotalItems) * 100) : 0;
    el.purchaseProgressPercent.textContent = `${progressPercent}%`;
    el.purchaseProgressBar.style.width = `${progressPercent}%`;

    // Badges in Header and Tabs
    el.pillPendingCount.textContent = pendingCount;
    el.pillPurchasedCount.textContent = purchasedCount;
    el.badgePendingCount.textContent = pendingCount;
    el.badgePurchasedCount.textContent = purchasedCount;
    el.badgeAllCount.textContent = products.length;

    // Update Select All label
    const displayed = getFilteredProducts();
    const allSelected = displayed.length > 0 && displayed.every((p) => p.selected);
    el.toggleSelectAllLabel.textContent = allSelected ? 'Desmarcar Todos' : 'Marcar Todos';
  }

  // --- Filtering & Sorting ---
  function getFilteredProducts() {
    let result = products.slice();

    // 1. Tab filter
    if (currentTab === 'pending') {
      result = result.filter((p) => !p.purchased);
    } else if (currentTab === 'purchased') {
      result = result.filter((p) => p.purchased);
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const storeMatch = (p.store || '').toLowerCase().includes(q);
        const notesMatch = (p.notes || '').toLowerCase().includes(q);
        return nameMatch || storeMatch || notesMatch;
      });
    }

    // 3. Sorting
    result.sort((a, b) => {
      const totalA = (Number(a.price) || 0) * (Number(a.quantity) || 1) + (Number(a.shipping) || 0);
      const totalB = (Number(b.price) || 0) * (Number(b.quantity) || 1) + (Number(b.shipping) || 0);

      switch (sortBy) {
        case 'price-asc':
          return totalA - totalB;
        case 'price-desc':
          return totalB - totalA;
        case 'name-asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'recent':
        default:
          return (b.createdAt || 0) - (a.createdAt || 0);
      }
    });

    return result;
  }

  // --- UI Render ---
  function renderProducts() {
    const filtered = getFilteredProducts();
    el.productsGrid.innerHTML = '';

    if (filtered.length === 0) {
      el.emptyState.style.display = 'flex';
      el.productsGrid.style.display = 'none';

      if (searchQuery.trim()) {
        el.emptyStateIcon.innerHTML = EMPTY_STATE_ICONS.search;
        el.emptyStateTitle.textContent = 'Nenhum resultado encontrado';
        el.emptyStateDesc.textContent = `Nenhum item corresponde à busca por "${searchQuery}".`;
        el.emptyStateActionBtn.style.display = 'none';
      } else if (currentTab === 'purchased') {
        el.emptyStateIcon.innerHTML = EMPTY_STATE_ICONS.purchased;
        el.emptyStateTitle.textContent = 'Nenhum produto comprado ainda';
        el.emptyStateDesc.textContent = 'Ao realizar a compra de um item, marque-o como comprado para acompanhar aqui.';
        el.emptyStateActionBtn.style.display = 'none';
      } else {
        el.emptyStateIcon.innerHTML = EMPTY_STATE_ICONS.cart;
        el.emptyStateTitle.textContent = 'Seu carrinho está vazio';
        el.emptyStateDesc.textContent = 'Adicione produtos que você encontrar na internet para simular o total da compra.';
        el.emptyStateActionBtn.style.display = 'inline-flex';
      }
    } else {
      el.emptyState.style.display = 'none';
      el.productsGrid.style.display = 'grid';

      filtered.forEach((product) => {
        const card = createProductCardElement(product);
        el.productsGrid.appendChild(card);
      });
    }

    updateFinancialSummary();
  }

  function createProductCardElement(product) {
    const card = document.createElement('article');
    card.className = `product-card ${product.purchased ? 'purchased-card' : ''} ${product.selected ? 'selected-for-purchase' : ''}`;
    card.setAttribute('data-id', product.id);

    const unitPrice = Number(product.price) || 0;
    const shipping = Number(product.shipping) || 0;
    const qty = Number(product.quantity) || 1;
    const itemTotal = unitPrice * qty + shipping;

    const storeKey = product.storeKey || detectStoreFromUrl(product.url).key;
    const storeName = product.store || 'Loja';

    // Image or Fallback template
    let mediaHtml = '';
    if (product.image) {
      mediaHtml = `<img class="card-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">`;
    } else {
      mediaHtml = getFallbackMediaHtml(storeName);
    }

    card.innerHTML = `
      <div class="card-media">
        <!-- Checkbox overlay -->
        <div class="card-selection-overlay">
          <label class="custom-checkbox" title="Selecionar para compra">
            <input type="checkbox" class="product-select-check" ${product.selected ? 'checked' : ''}>
            <span class="checkmark"></span>
          </label>
        </div>

        <!-- Badges -->
        <div class="card-top-badges">
          <span class="store-pill store-${storeKey}">${escapeHtml(storeName)}</span>
          ${product.purchased ? '<span class="status-badge">Comprado</span>' : ''}
        </div>

        ${mediaHtml}
      </div>

      <div class="card-body">
        <div class="card-title-row">
          <h4 class="card-title" title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</h4>
          ${product.url ? `
            <a href="${escapeHtml(product.url)}" target="_blank" rel="noopener noreferrer" class="card-external-link" title="Abrir link na loja">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          ` : ''}
        </div>

        <!-- Price Section -->
        <div class="card-price-section">
          <div class="price-main-row">
            <span class="price-label">Preço Unitário</span>
            <span class="price-val">${formatMoney(unitPrice)}</span>
          </div>
          <div class="price-sub-row">
            <span>Frete:</span>
            <span>${shipping > 0 ? formatMoney(shipping) : '<span class="free-shipping-tag">Grátis</span>'}</span>
          </div>
        </div>

        <!-- Quantity & Item Subtotal -->
        <div class="card-controls-row">
          <div class="quantity-stepper">
            <button type="button" class="qty-btn qty-decrease" title="Diminuir quantidade" aria-label="Diminuir">-</button>
            <span class="qty-number">${qty}</span>
            <button type="button" class="qty-btn qty-increase" title="Aumentar quantidade" aria-label="Aumentar">+</button>
          </div>
          <div class="item-total-val">
            Total: <strong>${formatMoney(itemTotal)}</strong>
          </div>
        </div>

        <!-- Notes if provided -->
        ${product.notes ? `
          <div class="card-notes" title="${escapeHtml(product.notes)}">
            "${escapeHtml(product.notes)}"
          </div>
        ` : ''}

        <!-- Actions Footer -->
        <div class="card-actions-footer">
          <button type="button" class="card-action-btn btn-status-toggle" title="${product.purchased ? 'Mover para A Comprar' : 'Marcar como Comprado'}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>${product.purchased ? 'Reabrir' : 'Comprado'}</span>
          </button>

          <div class="card-actions-group">
            <button type="button" class="card-action-btn btn-edit" title="Editar produto">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span>Editar</span>
            </button>

            <button type="button" class="card-action-btn btn-delete" title="Excluir produto" aria-label="Excluir produto">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    // Event Bindings for Card
    const imgEl = card.querySelector('.card-image');
    if (imgEl) {
      imgEl.addEventListener('error', () => {
        imgEl.outerHTML = getFallbackMediaHtml(storeName);
      }, { once: true });
    }

    const checkEl = card.querySelector('.product-select-check');
    checkEl.addEventListener('change', () => {
      product.selected = checkEl.checked;
      card.classList.toggle('selected-for-purchase', product.selected);
      saveProductsToStorage();
      updateFinancialSummary();
    });

    const btnDec = card.querySelector('.qty-decrease');
    btnDec.addEventListener('click', () => {
      if (product.quantity > 1) {
        product.quantity--;
        saveProductsToStorage();
        renderProducts();
      }
    });

    const btnInc = card.querySelector('.qty-increase');
    btnInc.addEventListener('click', () => {
      product.quantity = (Number(product.quantity) || 1) + 1;
      saveProductsToStorage();
      renderProducts();
    });

    const btnStatus = card.querySelector('.btn-status-toggle');
    btnStatus.addEventListener('click', () => {
      product.purchased = !product.purchased;
      if (product.purchased) {
        product.selected = false; // Uncheck when purchased
      }
      const saved = saveProductsToStorage();
      renderProducts();
      if (saved) {
        showToast(product.purchased ? 'Produto marcado como comprado!' : 'Produto movido de volta para a lista de desejos.', 'success');
      }
    });

    const btnEdit = card.querySelector('.btn-edit');
    btnEdit.addEventListener('click', () => {
      openModalForEdit(product);
    });

    const btnDelete = card.querySelector('.btn-delete');
    btnDelete.addEventListener('click', async () => {
      const confirmed = await confirmAction({
        title: 'Excluir produto',
        message: `Deseja remover "${product.name}" do carrinho? Esta ação não pode ser desfeita.`,
        confirmLabel: 'Excluir'
      });
      if (!confirmed) return;

      products = products.filter((p) => p.id !== product.id);
      const saved = saveProductsToStorage();
      renderProducts();
      if (saved) showToast('Produto excluído com sucesso.', 'success');
    });

    return card;
  }

  function getFallbackMediaHtml(storeName) {
    return `
      <div class="card-media-fallback">
        <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="8" cy="21" r="1"></circle>
          <circle cx="19" cy="21" r="1"></circle>
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
        </svg>
        <span style="font-size: 0.75rem; font-weight: 600; opacity: 0.8;">${escapeHtml(storeName)}</span>
      </div>
    `;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Confirmation Modal (replaces native confirm) ---
  let confirmResolver = null;

  function confirmAction({ title, message, confirmLabel = 'Confirmar' }) {
    el.confirmTitle.textContent = title;
    el.confirmMessage.textContent = message;
    el.confirmOkLabel.textContent = confirmLabel;
    el.confirmModal.classList.add('active');
    el.confirmModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => el.confirmCancelBtn.focus(), 100);

    return new Promise((resolve) => {
      confirmResolver = resolve;
    });
  }

  function closeConfirm(result) {
    el.confirmModal.classList.remove('active');
    el.confirmModal.setAttribute('aria-hidden', 'true');
    if (confirmResolver) {
      confirmResolver(result);
      confirmResolver = null;
    }
  }

  // --- Form Validation Helpers ---
  const VALIDATED_FIELDS = ['productUrl', 'productName', 'productPrice', 'productShipping', 'productQuantity', 'productImageUrl'];

  function setFieldError(fieldId, message) {
    const input = el[fieldId];
    const group = input.closest('.form-group') || input.parentElement;
    const errorEl = document.getElementById(`${fieldId}Error`);
    group.classList.add('has-error');
    input.setAttribute('aria-invalid', 'true');
    if (errorEl) {
      errorEl.querySelector('span').textContent = message;
      input.setAttribute('aria-describedby', errorEl.id);
    }
  }

  function clearFieldError(fieldId) {
    const input = el[fieldId];
    const group = input.closest('.form-group') || input.parentElement;
    group.classList.remove('has-error');
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
  }

  function clearAllFieldErrors() {
    VALIDATED_FIELDS.forEach(clearFieldError);
  }

  // Accept links pasted without protocol (e.g. "www.amazon.com.br/...")
  function normalizeUrl(value) {
    const trimmed = (value || '').trim();
    if (!trimmed || /^(https?:|data:)/i.test(trimmed)) return trimmed;
    return 'https://' + trimmed;
  }

  function isValidHttpUrl(value) {
    try {
      const parsed = new URL(value);
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
    } catch {
      return false;
    }
  }

  // --- Modal Logic (Add / Edit) ---
  function openModalForNew() {
    editingProductId = null;
    currentImageBase64 = '';
    el.modalTitle.textContent = 'Cadastrar Novo Produto';
    el.saveBtnLabel.textContent = 'Salvar Produto';
    el.productForm.reset();
    clearAllFieldErrors();
    el.productId.value = '';
    el.productQuantity.value = '1';
    el.imagePreviewBox.style.display = 'none';
    el.imagePreviewImg.src = '';
    updateStoreBadgePreview('', 'generic');
    switchImageTab('url');

    el.productModal.classList.add('active');
    el.productModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => el.productUrl.focus(), 100);
  }

  function openModalForEdit(product) {
    editingProductId = product.id;
    currentImageBase64 = product.image && product.image.startsWith('data:') ? product.image : '';
    el.modalTitle.textContent = 'Editar Produto';
    el.saveBtnLabel.textContent = 'Atualizar Produto';
    el.productForm.reset();
    clearAllFieldErrors();

    el.productId.value = product.id;
    el.productUrl.value = product.url || '';
    el.productName.value = product.name || '';
    el.productPrice.value = product.price || '';
    el.productShipping.value = product.shipping || '';
    el.productQuantity.value = product.quantity || 1;
    el.productStore.value = product.store || '';
    el.productNotes.value = product.notes || '';

    updateStoreBadgePreview(product.store, product.storeKey);

    if (product.image) {
      el.imagePreviewImg.src = product.image;
      el.imagePreviewBox.style.display = 'block';
      if (!product.image.startsWith('data:')) {
        el.productImageUrl.value = product.image;
        switchImageTab('url');
      } else {
        switchImageTab('upload');
      }
    } else {
      el.imagePreviewBox.style.display = 'none';
      switchImageTab('url');
    }

    el.productModal.classList.add('active');
    el.productModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => el.productName.focus(), 100);
  }

  function closeModal() {
    el.productModal.classList.remove('active');
    el.productModal.setAttribute('aria-hidden', 'true');
    editingProductId = null;
    currentImageBase64 = '';
  }

  function switchImageTab(tab) {
    if (tab === 'url') {
      el.tabImgUrlBtn.classList.add('active');
      el.tabImgUploadBtn.classList.remove('active');
      el.imgUrlSection.style.display = 'block';
      el.imgUploadSection.style.display = 'none';
    } else {
      el.tabImgUploadBtn.classList.add('active');
      el.tabImgUrlBtn.classList.remove('active');
      el.imgUrlSection.style.display = 'none';
      el.imgUploadSection.style.display = 'block';
    }
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Open Modal
    el.openNewProductModalBtn.addEventListener('click', openModalForNew);
    el.emptyStateActionBtn.addEventListener('click', openModalForNew);

    // Close Modal
    el.closeModalBtn.addEventListener('click', closeModal);
    el.cancelModalBtn.addEventListener('click', closeModal);
    el.productModal.addEventListener('click', (e) => {
      if (e.target === el.productModal) closeModal();
    });

    // Confirmation Modal
    el.confirmOkBtn.addEventListener('click', () => closeConfirm(true));
    el.confirmCancelBtn.addEventListener('click', () => closeConfirm(false));
    el.confirmCloseBtn.addEventListener('click', () => closeConfirm(false));
    el.confirmModal.addEventListener('click', (e) => {
      if (e.target === el.confirmModal) closeConfirm(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (el.confirmModal.classList.contains('active')) {
        closeConfirm(false);
      } else if (el.productModal.classList.contains('active')) {
        closeModal();
      }
    });

    // Clear a field's error as soon as the user edits it
    VALIDATED_FIELDS.forEach((fieldId) => {
      el[fieldId].addEventListener('input', () => clearFieldError(fieldId));
    });

    // Auto-detect store when URL input changes
    el.productUrl.addEventListener('input', (e) => {
      const url = e.target.value;
      const detected = detectStoreFromUrl(url);
      if (detected.name && (!el.productStore.value || el.productStore.value === '')) {
        el.productStore.value = detected.name;
      }
      updateStoreBadgePreview(el.productStore.value || detected.name, detected.key);
    });

    el.productStore.addEventListener('input', (e) => {
      const storeName = e.target.value.trim();
      const detected = detectStoreFromUrl(el.productUrl.value);
      updateStoreBadgePreview(storeName, detected.key);
    });

    // Stepper buttons in modal
    el.modalQtyMinus.addEventListener('click', () => {
      const current = parseInt(el.productQuantity.value, 10) || 1;
      if (current > 1) el.productQuantity.value = current - 1;
    });

    el.modalQtyPlus.addEventListener('click', () => {
      const current = parseInt(el.productQuantity.value, 10) || 1;
      if (current < 99) el.productQuantity.value = current + 1;
      clearFieldError('productQuantity');
    });

    // Image Tabs
    el.tabImgUrlBtn.addEventListener('click', () => switchImageTab('url'));
    el.tabImgUploadBtn.addEventListener('click', () => switchImageTab('upload'));

    // Image URL live preview
    el.productImageUrl.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) {
        currentImageBase64 = '';
        el.imagePreviewImg.src = val;
        el.imagePreviewBox.style.display = 'block';
      } else if (!currentImageBase64) {
        el.imagePreviewBox.style.display = 'none';
      }
    });

    // File Upload handling
    el.uploadDropzone.addEventListener('click', () => el.productImageFile.click());
    
    // Drag & drop
    ['dragenter', 'dragover'].forEach(eventName => {
      el.uploadDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        el.uploadDropzone.style.borderColor = 'var(--accent-primary)';
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      el.uploadDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        el.uploadDropzone.style.borderColor = '';
      });
    });

    el.uploadDropzone.addEventListener('drop', async (e) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleImageUpload(e.dataTransfer.files[0]);
      }
    });

    el.productImageFile.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        handleImageUpload(e.target.files[0]);
      }
    });

    async function handleImageUpload(file) {
      if (!file.type.startsWith('image/')) {
        showToast('Por favor, selecione um arquivo de imagem válido.', 'danger');
        return;
      }
      try {
        const compressedBase64 = await compressImageFile(file, 450, 0.8);
        currentImageBase64 = compressedBase64;
        el.productImageUrl.value = '';
        el.imagePreviewImg.src = compressedBase64;
        el.imagePreviewBox.style.display = 'block';
        showToast('Imagem carregada e otimizada!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Falha ao processar arquivo de imagem.', 'danger');
      }
    }

    el.removeImageBtn.addEventListener('click', () => {
      currentImageBase64 = '';
      el.productImageUrl.value = '';
      el.productImageFile.value = '';
      el.imagePreviewBox.style.display = 'none';
      el.imagePreviewImg.src = '';
    });

    // Form Submit (Save Product)
    el.productForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = el.productName.value.trim();
      const url = normalizeUrl(el.productUrl.value);
      const priceRaw = el.productPrice.value.trim();
      const price = parseFloat(priceRaw);
      const shippingRaw = el.productShipping.value.trim();
      const shipping = parseFloat(shippingRaw) || 0;
      const quantityRaw = el.productQuantity.value.trim();
      const quantity = parseInt(quantityRaw, 10);
      const imageUrl = normalizeUrl(el.productImageUrl.value);
      let store = el.productStore.value.trim();
      const notes = el.productNotes.value.trim();

      clearAllFieldErrors();
      const errors = [];

      if (!url) {
        errors.push(['productUrl', 'Informe o link do produto.']);
      } else if (!isValidHttpUrl(url)) {
        errors.push(['productUrl', 'Informe um link válido, por exemplo: https://www.loja.com.br/produto']);
      }

      if (!name) {
        errors.push(['productName', 'Informe o nome do produto.']);
      }

      if (!priceRaw || el.productPrice.validity.badInput) {
        errors.push(['productPrice', 'Informe o preço unitário.']);
      } else if (isNaN(price) || price < 0) {
        errors.push(['productPrice', 'O preço não pode ser negativo.']);
      }

      if (el.productShipping.validity.badInput) {
        errors.push(['productShipping', 'Informe um valor de frete numérico.']);
      } else if (shippingRaw && parseFloat(shippingRaw) < 0) {
        errors.push(['productShipping', 'O frete não pode ser negativo.']);
      }

      if (isNaN(quantity) || quantity < 1 || quantity > 99) {
        errors.push(['productQuantity', 'A quantidade deve estar entre 1 e 99.']);
      }

      if (imageUrl && !currentImageBase64 && !isValidHttpUrl(imageUrl)) {
        errors.push(['productImageUrl', 'Informe um link de imagem válido ou envie um arquivo.']);
      }

      if (errors.length > 0) {
        errors.forEach(([fieldId, message]) => setFieldError(fieldId, message));
        if (errors.some(([fieldId]) => fieldId === 'productImageUrl')) switchImageTab('url');
        el[errors[0][0]].focus();
        return;
      }

      const detected = detectStoreFromUrl(url);
      if (!store) {
        store = detected.name || 'Loja';
      }

      const storeKey = detected.key;
      const finalImage = currentImageBase64 || imageUrl || '';
      let successMessage = '';

      if (editingProductId) {
        // Edit existing
        const index = products.findIndex((p) => p.id === editingProductId);
        if (index === -1) {
          showToast('Este produto não existe mais na lista. Recarregue a página e tente novamente.', 'danger');
          closeModal();
          renderProducts();
          return;
        } else {
          products[index] = {
            ...products[index],
            name,
            url,
            price,
            shipping,
            quantity,
            store,
            storeKey,
            image: finalImage,
            notes
          };
          successMessage = 'Produto atualizado com sucesso!';
        }
      } else {
        // Create new
        const newProduct = {
          id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          name,
          url,
          price,
          shipping,
          quantity,
          store,
          storeKey,
          image: finalImage,
          notes,
          purchased: false,
          selected: true,
          createdAt: Date.now()
        };
        products.unshift(newProduct);
        successMessage = 'Novo produto adicionado ao carrinho!';
      }

      if (!saveProductsToStorage()) return;
      closeModal();
      renderProducts();
      showToast(successMessage, 'success');
    });

    // Search filter
    el.searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      el.clearSearchBtn.style.display = searchQuery ? 'flex' : 'none';
      renderProducts();
    });

    el.clearSearchBtn.addEventListener('click', () => {
      el.searchInput.value = '';
      searchQuery = '';
      el.clearSearchBtn.style.display = 'none';
      renderProducts();
      el.searchInput.focus();
    });

    // Tabs
    el.tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        el.tabButtons.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        currentTab = btn.getAttribute('data-tab');
        renderProducts();
      });
    });

    // Sort
    el.sortSelect.addEventListener('change', (e) => {
      sortBy = e.target.value;
      renderProducts();
    });

    // Toggle Select All
    el.toggleSelectAllBtn.addEventListener('click', () => {
      const displayed = getFilteredProducts();
      if (displayed.length === 0) {
        showToast('Não há produtos exibidos para marcar.', 'info');
        return;
      }

      const allSelected = displayed.every((p) => p.selected);
      const targetState = !allSelected;

      displayed.forEach((p) => {
        p.selected = targetState;
      });

      const saved = saveProductsToStorage();
      renderProducts();
      if (saved) showToast(targetState ? 'Todos os itens exibidos foram selecionados.' : 'Itens desmarcados.', 'info');
    });

    // Mark Selected as Purchased
    el.markSelectedPurchasedBtn.addEventListener('click', () => {
      const selectedItems = products.filter((p) => p.selected && !p.purchased);
      if (selectedItems.length === 0) {
        showToast('Os produtos selecionados já estão marcados como comprados.', 'info');
        return;
      }

      selectedItems.forEach((p) => {
        p.purchased = true;
        p.selected = false;
      });

      const saved = saveProductsToStorage();
      renderProducts();
      if (saved) showToast(`${selectedItems.length} item(ns) marcado(s) como comprado(s)! Parabéns! 🎉`, 'success');
    });
  }

  // --- Init ---
  function init() {
    initTheme();
    loadProductsFromStorage();
    setupEventListeners();
    renderProducts();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
