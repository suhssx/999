const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

function setText(selector, value) {
  const element = qs(selector);
  if (element && value !== undefined) element.textContent = value;
}

function setLines(selector, lines) {
  const element = qs(selector);
  if (!element || !Array.isArray(lines)) return;
  element.replaceChildren();
  lines.forEach((line, index) => {
    element.append(document.createTextNode(line));
    if (index < lines.length - 1) element.append(document.createElement('br'));
  });
}

function renderGalleryMarkup(items) {
  const grid = qs('#gallery-grid');
  if (!grid || !Array.isArray(items)) return;
  grid.replaceChildren();
  items.forEach((item, index) => {
    const button = document.createElement('button');
    button.className = `gallery-item ${item.layout || ''}`.trim();
    button.dataset.category = item.category;
    button.dataset.image = item.image;
    button.dataset.title = item.title;
    button.type = 'button';
    const image = document.createElement('img');
    image.src = `./assets/${item.image}`;
    image.alt = item.alt || '婚纱客片';
    image.loading = 'lazy';
    const caption = document.createElement('span');
    caption.textContent = `${String(index + 1).padStart(2, '0')} / ${item.title}`;
    button.append(image, caption);
    grid.append(button);
  });
}

function renderPackagesMarkup(items) {
  const list = qs('.package-list');
  if (!list || !Array.isArray(items)) return;
  list.replaceChildren();
  items.forEach((item, index) => {
    const card = document.createElement('article');
    card.className = `package-card${index === 0 ? ' featured' : ''}`;
    const top = document.createElement('div');
    top.className = 'package-card-top';
    const tag = document.createElement('span');
    tag.className = 'package-tag';
    tag.textContent = item.tag;
    const number = document.createElement('span');
    number.className = 'package-number';
    number.textContent = item.number || String(index + 1).padStart(2, '0');
    top.append(tag, number);
    const main = document.createElement('div');
    main.className = 'package-main';
    const name = document.createElement('p');
    name.className = 'package-name';
    name.textContent = item.name;
    const price = document.createElement('div');
    price.className = 'price';
    const currency = document.createElement('small');
    currency.textContent = '¥';
    price.append(currency, document.createTextNode(item.price));
    const oldPrice = document.createElement('p');
    oldPrice.className = 'old-price';
    oldPrice.append(document.createTextNode(`原价 ¥${item.originalPrice} `));
    const discount = document.createElement('b');
    discount.textContent = `立省 ¥${item.discount}`;
    oldPrice.append(discount);
    const description = document.createElement('p');
    description.className = 'package-desc';
    description.textContent = item.description;
    const link = document.createElement('a');
    link.className = 'package-link';
    link.href = '#booking';
    link.dataset.package = `${item.name} · ¥${item.price}`;
    link.append(document.createTextNode('预约此套餐 '));
    const arrow = document.createElement('span');
    arrow.textContent = '↗';
    link.append(arrow);
    main.append(name, price, oldPrice, description, link);
    const image = document.createElement('img');
    image.src = `./assets/${item.image}`;
    image.alt = item.alt || `${item.name}内容`;
    image.loading = 'lazy';
    card.append(top, main, image);
    list.append(card);
  });
}

function bindPackageLinks() {
  qsa('[data-package]').forEach(link => link.addEventListener('click', () => {
    const select = qs('#package-select');
    if (select) select.value = link.dataset.package;
  }));
}

function applySiteContent(data) {
  if (!data || !data.site) return;
  const site = data.site;
  const heroImage = qs('.hero-image');
  const storyImage = qs('.story-image-wrap img');
  const video = qs('.video-frame video');
  if (heroImage && site.heroImage) { heroImage.src = `./assets/${site.heroImage}`; heroImage.alt = site.heroAlt || ''; }
  if (storyImage && site.storyImage) { storyImage.src = `./assets/${site.storyImage}`; storyImage.alt = site.storyAlt || ''; }
  if (video && site.video) { video.querySelector('source').src = `./assets/${site.video}`; video.load(); }
  setLines('.hero-slogan', site.slogan);
  setText('.story-stats div:nth-child(1) strong', site.serviceCount);
  setText('.story-stats div:nth-child(2) strong', site.rating);
  setText('.story-stats div:nth-child(3) strong', site.years);
  setLines('.location-copy .address', site.address);
  const subway = qs('.subway');
  if (subway && site.subway) { const label = subway.querySelector('span'); subway.replaceChildren(label, document.createTextNode(` ${site.subway}`)); }
  qsa('a[href^="tel:"]').forEach(link => { link.href = `tel:${site.phone}`; if (link.querySelector('b')) link.querySelector('b').textContent = site.phone; });
  qsa('[data-copy]').forEach(element => { element.dataset.copy = site.wechat; });
  qsa('.modal-panel strong, .float-contact b').forEach(element => { if (element.closest('#wechat-modal') || element.closest('.booking-modal') || element.closest('.float-contact')) element.textContent = site.wechat; });
  const mapLink = qs('.location-actions a[href*="amap.com"]');
  if (mapLink && site.mapUrl) mapLink.href = site.mapUrl;
  if (Array.isArray(data.packages)) renderPackagesMarkup(data.packages);
  if (Array.isArray(data.gallery)) renderGalleryMarkup(data.gallery);
}

const bookingModal = qs('#booking-modal');
const bookingMessage = qs('#booking-message');
let latestBookingMessage = '';
function toggleBookingModal(open) {
  bookingModal?.classList.toggle('open', open);
  bookingModal?.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('no-scroll', open);
}
qs('.booking-modal-close')?.addEventListener('click', () => toggleBookingModal(false));
bookingModal?.addEventListener('click', event => { if (event.target === bookingModal) toggleBookingModal(false); });

const menuToggle = qs('.menu-toggle');
const mainNav = qs('.main-nav');
const dateField = qs('input[name="date"]');
if (dateField) dateField.min = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());
menuToggle?.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!open));
  menuToggle.classList.toggle('open', !open);
  mainNav.classList.toggle('mobile-open', !open);
});
qsa('.main-nav a').forEach(link => link.addEventListener('click', () => {
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.classList.remove('open');
  mainNav.classList.remove('mobile-open');
}));

let galleryItems = qsa('.gallery-item');
const filterButtons = qsa('.filter-btn');
const countLabel = qs('#gallery-count');
const loadMore = qs('#load-more');
let filter = 'all';
let showingAll = false;

function renderGallery() {
  const matches = galleryItems.filter(item => filter === 'all' || item.dataset.category === filter);
  galleryItems.forEach(item => {
    const match = filter === 'all' || item.dataset.category === filter;
    const visible = match && (showingAll || matches.indexOf(item) < 12);
    item.classList.toggle('is-hidden', !visible);
  });
  countLabel.textContent = matches.length;
  loadMore.style.display = matches.length > 12 && !showingAll ? 'block' : 'none';
}
filterButtons.forEach(button => button.addEventListener('click', () => {
  filterButtons.forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');
  filter = button.dataset.filter;
  showingAll = false;
  renderGallery();
}));
loadMore.addEventListener('click', () => { showingAll = true; renderGallery(); });
renderGallery();

const lightbox = qs('#lightbox');
const lightboxImage = qs('#lightbox-image');
const lightboxCaption = qs('#lightbox-caption');
let currentItems = [];
let currentIndex = 0;
function openLightbox(item) {
  currentItems = galleryItems.filter(entry => !entry.classList.contains('is-hidden'));
  currentIndex = currentItems.indexOf(item);
  showLightboxImage();
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
}
function showLightboxImage() {
  const item = currentItems[currentIndex];
  if (!item) return;
  lightboxImage.src = `./assets/${item.dataset.image}`;
  lightboxImage.alt = item.querySelector('img').alt;
  lightboxCaption.textContent = `${item.dataset.title}  ·  MUVISION STUDIO`;
}
function closeLightbox() { lightbox.classList.remove('open'); lightbox.setAttribute('aria-hidden', 'true'); document.body.classList.remove('no-scroll'); }
function bindGalleryItems() {
  galleryItems.forEach(item => item.addEventListener('click', () => openLightbox(item)));
}
bindGalleryItems();
qs('.lightbox-close').addEventListener('click', closeLightbox);
qs('.lightbox').addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
qs('.lightbox-arrow.prev').addEventListener('click', () => { currentIndex = (currentIndex - 1 + currentItems.length) % currentItems.length; showLightboxImage(); });
qs('.lightbox-arrow.next').addEventListener('click', () => { currentIndex = (currentIndex + 1) % currentItems.length; showLightboxImage(); });
document.addEventListener('keydown', event => {
  if (!lightbox.classList.contains('open')) return;
  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowLeft') qs('.lightbox-arrow.prev').click();
  if (event.key === 'ArrowRight') qs('.lightbox-arrow.next').click();
});

const wechatModal = qs('#wechat-modal');
function toggleWechat(open) { wechatModal.classList.toggle('open', open); wechatModal.setAttribute('aria-hidden', String(!open)); document.body.classList.toggle('no-scroll', open); }
qs('.float-wechat').addEventListener('click', () => toggleWechat(true));
qs('.modal-close').addEventListener('click', () => toggleWechat(false));
wechatModal.addEventListener('click', event => { if (event.target === wechatModal) toggleWechat(false); });

const toast = qs('#toast');
let toastTimer;
function showToast(message) { clearTimeout(toastTimer); toast.textContent = message; toast.classList.add('show'); toastTimer = setTimeout(() => toast.classList.remove('show'), 2800); }
qs('.copy-wechat').addEventListener('click', async event => {
  const value = event.currentTarget.dataset.copy;
  try { await navigator.clipboard.writeText(value); showToast('微信号已复制：' + value); } catch { showToast('微信号：' + value); }
});

bindPackageLinks();

qs('#booking-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.elements.names.value.trim() || '新人';
  latestBookingMessage = [
    '慕摄影预约',
    `称呼：${name}`,
    `电话：${form.elements.phone.value.trim()}`,
    `拍摄日期：${form.elements.date.value || '待沟通'}`,
    `风格：${form.elements.style.value}`,
    `套餐：${form.elements.package.value}`,
    `留言：${form.elements.message.value.trim() || '无'}`
  ].join('\n');
  bookingMessage.textContent = latestBookingMessage;
  toggleBookingModal(true);
});
qs('.copy-booking')?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(latestBookingMessage);
    showToast('预约内容已复制，请粘贴发送给老板微信。');
  } catch {
    showToast('请手动复制预约内容，再发送给老板微信。');
  }
});

fetch('./data/site-content.json', { cache: 'no-store' })
  .then(response => response.ok ? response.json() : null)
  .then(data => {
    if (!data) return;
    applySiteContent(data);
    galleryItems = qsa('.gallery-item');
    showingAll = false;
    bindGalleryItems();
    bindPackageLinks();
    renderGallery();
  })
  .catch(() => { /* Local file previews can block fetch; the HTML defaults remain usable. */ });
