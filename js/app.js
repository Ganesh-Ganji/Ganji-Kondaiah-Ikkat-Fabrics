(() => {
  'use strict';
  const config = window.SITE_CONFIG;
  const state = { products: [], query: '', category: '', sort: 'default' };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const fallbackImage = 'assets/textile-placeholder.svg';
  const safeImage = (img) => {
    img.addEventListener('error', () => { if (!img.dataset.fallback) { img.dataset.fallback = 'true'; img.src = fallbackImage; } }, { once: true });
  };
  const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const money = value => new Intl.NumberFormat(config.locale, { style: 'currency', currency: config.currency, maximumFractionDigits: 0 }).format(Number(value) || 0);
  const priceLabel = product => product.price === undefined || product.price === null || product.price === '' ? 'Enquire for price' : money(product.price);
  const waUrl = message => `https://wa.me/${encodeURIComponent(config.whatsappNumber)}?text=${encodeURIComponent(message)}`;
  const generalMessage = `Hello, I would like to know more about ${config.businessName}’s Ikkat cotton collection.`;
  const productMessage = product => {
    const photo = /^https?:$/.test(window.location.protocol) ? new URL(product.images?.[0] || fallbackImage, document.baseURI).href
      : '';
    return `Hello, I am interested in ${product.name}. Please share more details.${photo ? `\nPhoto: ${photo}` : ''}`;
  };
  const imageMarkup = (path, alt, loading = 'lazy', sizes = '(max-width:760px) 48vw, (max-width:1100px) 30vw, 24vw') => {
    const src = path || fallbackImage;
    const responsive = /\.jpe?g$/i.test(src)
      ? ` srcset="${escapeHTML(src.replace(/\.jpe?g$/i, '-480.webp'))} 480w, ${escapeHTML(src.replace(/\.jpe?g$/i, '-960.webp'))} 960w" sizes="${sizes}"`
      : '';
    const onError = responsive
      ? `if(!this.dataset.jpegRetry){this.dataset.jpegRetry='true';this.removeAttribute('srcset');this.src='${escapeHTML(src)}'}else{this.onerror=null;this.src='${fallbackImage}'}`
      : `this.onerror=null;this.src='${fallbackImage}'`;
    return `<img src="${escapeHTML(src)}"${responsive} alt="${escapeHTML(alt)}" loading="${loading}" decoding="async" onerror="${onError}">`;
  };

  function applyConfig() {
    $$('[data-business-name]').forEach(node => node.textContent = config.businessName);
    $$('[data-logo-image]').forEach(node => { node.src = config.logoPath; node.onerror = () => { node.hidden = true; }; });
    const hero = $('[data-hero-image]'); hero.src = config.heroImagePath || hero.src; safeImage(hero);
    const wa = waUrl(generalMessage); $$('[data-whatsapp]').forEach(link => link.href = wa);
    const phone = $('[data-phone]'); phone.href = `tel:${config.phoneNumber.replace(/[^+\d]/g, '')}`;
    $('[data-phone-display]').textContent = config.phoneNumber;
    const email = $('[data-email]'); email.href = `mailto:${config.email}`;
    $('[data-email-display]').textContent = config.email;
    $('[data-address]').textContent = config.address;
    const instagram = $('[data-instagram]'); instagram.href = config.instagramUrl; $('[data-instagram-handle]').textContent = config.instagramHandle;
    $('#year').textContent = new Date().getFullYear();
  }
  function card(product) {
    const badge = product.featured ? '<span class="product-badge">Featured</span>' : '';
    return `<article class="product-card" data-id="${escapeHTML(product.id)}">
      <button class="product-image-wrap" type="button" aria-label="View ${escapeHTML(product.name)} details" data-open-product="${escapeHTML(product.id)}">
        ${imageMarkup(product.images?.[0], product.name)}${badge}<span class="quick-view">VIEW DETAILS&nbsp; ↗</span>
      </button><div class="product-copy"><span class="product-category">${escapeHTML(product.category)}</span>
      <div class="product-title-row"><span class="product-title">${escapeHTML(product.name)}</span><span class="product-price">${priceLabel(product)}</span></div><p class="product-description">${escapeHTML(product.description || '')}</p></div></article>`;
  }
  function renderFeatured() {
    const featured = state.products.filter(p => p.featured).slice(0, 4);
    $('#featured-grid').innerHTML = featured.length ? featured.map(card).join('') : '<p class="loading">Our featured designs will be here soon.</p>';
  }
  function currentProducts() {
    const term = state.query.trim().toLocaleLowerCase();
    let list = state.products.filter(p => (!state.category || p.category === state.category) && (!term || `${p.name} ${p.id} ${p.category}`.toLocaleLowerCase().includes(term)));
    if (state.sort === 'low-high') list.sort((a, b) => Number(a.price) - Number(b.price));
    if (state.sort === 'high-low') list.sort((a, b) => Number(b.price) - Number(a.price));
    if (state.sort === 'default') list.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    return list;
  }
  function renderProducts() {
    const list = currentProducts();
    $('#product-grid').innerHTML = list.map(card).join('');
    $('#empty-state').hidden = list.length > 0;
    $('#product-count').textContent = `${list.length} ${list.length === 1 ? 'design' : 'designs'}`;
  }
  function setCategories() {
    const categories = [...new Set(state.products.map(p => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    $('#category-filter').innerHTML = '<option value="">All categories</option>' + categories.map(cat => `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`).join('');
  }
  function openProduct(id) {
    const product = state.products.find(p => p.id === id); if (!product) return;
    const images = product.images?.length ? product.images : [fallbackImage];
    const main = $('#modal-image'); main.src = images[0] || fallbackImage; main.alt = product.name; safeImage(main);
    $('#modal-thumbnails').innerHTML = images.map((src, index) => `<button class="modal-thumb${index === 0 ? ' active' : ''}" type="button" aria-label="Show photo ${index + 1}" data-image-index="${index}">${imageMarkup(src, `${product.name} photo ${index + 1}`, 'lazy', '64px')}</button>`).join('');
    $('#modal-category').textContent = product.category;
    $('#modal-title').textContent = product.name;
    $('#modal-id').textContent = `DESIGN ${product.id}`;
    $('#modal-price').textContent = priceLabel(product);
    $('#modal-description').textContent = product.description || 'A thoughtfully made handloom cotton design.';
    $('#modal-material').textContent = product.material || 'Cotton';
    $('#modal-availability').textContent = product.availability || 'Please enquire';
    $('#modal-enquire').href = waUrl(productMessage(product));
    const modal = $('#product-modal');
    if (!modal.open) modal.showModal();
    document.body.classList.add('modal-open');
  }
  function clearFilters() {
    state.query = ''; state.category = ''; state.sort = 'default';
    $('#search-input').value = ''; $('#category-filter').value = ''; $('#sort-filter').value = 'default'; renderProducts();
  }
  function wireEvents() {
    $('#search-input').addEventListener('input', event => { state.query = event.target.value; renderProducts(); });
    $('#category-filter').addEventListener('change', event => { state.category = event.target.value; renderProducts(); });
    $('#sort-filter').addEventListener('change', event => { state.sort = event.target.value; renderProducts(); });
    $('#clear-filters').addEventListener('click', clearFilters); $('#empty-clear').addEventListener('click', clearFilters);
    document.addEventListener('click', event => {
      const target = event.target.closest('[data-open-product]'); if (target) openProduct(target.dataset.openProduct);
      const thumb = event.target.closest('[data-image-index]');
      if (thumb) {
        const product = state.products.find(p => p.id === $('#modal-id').textContent.replace('DESIGN ', ''));
        const image = product?.images?.[Number(thumb.dataset.imageIndex)] || fallbackImage;
        const main = $('#modal-image'); main.style.opacity = '.3'; main.src = image; main.alt = product?.name || ''; main.onload = () => main.style.opacity = '1';
        $$('.modal-thumb').forEach(node => node.classList.toggle('active', node === thumb));
      }
    });
    const modal = $('#product-modal');
    $('.modal-close').addEventListener('click', () => modal.close());
    modal.addEventListener('click', event => { if (event.target === modal) modal.close(); });
    modal.addEventListener('close', () => document.body.classList.remove('modal-open'));
    const toggle = $('.menu-toggle'), nav = $('#main-nav');
    toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); nav.classList.toggle('open', open); });
    nav.addEventListener('click', event => { if (event.target.closest('a')) { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open navigation'); } });
    document.addEventListener('keydown', event => { const target = event.target.closest('[data-open-product]'); if (target && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openProduct(target.dataset.openProduct); } });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: .12 });
      // Keep the long collection section visible: a tall section may never meet
      // the observer threshold, which would otherwise leave a blank area.
      $$('.hero-copy,.featured,.about-layout,.contact-layout').forEach(node => { node.classList.add('reveal'); observer.observe(node); });
    }
  }
  async function init() {
    applyConfig(); wireEvents();
    try {
      state.products = await window.ProductCatalogue.load();
      renderFeatured(); setCategories(); renderProducts();
    } catch (error) {
      console.error(error);
      const localFile = window.location.protocol === 'file:';
      const help = localFile
        ? 'This page was opened as a file. In VS Code, right-click index.html and choose “Open with Live Server”.'
        : 'Could not load data/products.json. Check that the data folder is alongside index.html, then refresh.';
      $('#featured-grid').innerHTML = `<p class="loading">${help}</p>`;
      $('#product-grid').innerHTML = `<p class="loading">${help}</p>`;
      $('#product-count').textContent = localFile ? 'Start Live Server to view designs' : 'Catalogue unavailable';
    }
  }
  document.addEventListener('DOMContentLoaded', init);
})();
