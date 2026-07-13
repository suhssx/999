const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

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

const galleryItems = qsa('.gallery-item');
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
galleryItems.forEach(item => item.addEventListener('click', () => openLightbox(item)));
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

qsa('[data-package]').forEach(link => link.addEventListener('click', () => { qs('#package-select').value = link.dataset.package; }));

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
