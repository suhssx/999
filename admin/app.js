const apiBase = (window.MU_ADMIN_API || '').replace(/\/$/, '');
const $ = selector => document.querySelector(selector);
let content;

function endpoint(path) {
  return `${apiBase}${path}`;
}

function show(message, error = false) {
  const notice = $('#notice');
  if (!notice) return;
  notice.textContent = message;
  notice.style.color = error ? '#a23d2b' : '#9b5744';
}

// Keep the login entry available even when the API is temporarily unreachable.
const login = $('#login');
if (login) login.href = endpoint('/auth/login');

async function api(path, options = {}) {
  const response = await fetch(endpoint(path), {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `请求失败（${response.status}）`);
  }
  return response.json();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderSite() {
  const site = content.site;
  ['serviceCount', 'rating', 'years', 'heroImage', 'storyImage', 'video', 'phone', 'wechat', 'mapUrl', 'subway'].forEach(key => {
    const input = $(`#${key}`);
    if (input) input.value = site[key] || '';
  });
  $('#slogan').value = (site.slogan || []).join('\n');
  $('#address').value = (site.address || []).join('\n');
}

function renderPackages() {
  $('#packages').replaceChildren(...content.packages.map((item, index) => {
    const article = document.createElement('article');
    article.className = 'package-editor';
    article.innerHTML = `<h3>套餐 ${index + 1}</h3>`;
    ['tag', 'number', 'name', 'price', 'originalPrice', 'discount', 'description', 'image', 'alt'].forEach(key => {
      const label = document.createElement('label');
      label.textContent = key === 'description' ? '套餐说明' : key;
      const input = document.createElement(key === 'description' ? 'textarea' : 'input');
      input.value = item[key] || '';
      input.dataset.package = index;
      input.dataset.key = key;
      if (key === 'description') input.rows = 3;
      label.append(input);
      article.append(label);
    });
    return article;
  }));
}

function renderGallery() {
  $('#gallery-list').replaceChildren(...content.gallery.map((item, index) => {
    const figure = document.createElement('figure');
    const img = document.createElement('img');
    img.src = `../assets/${item.image}`;
    img.alt = item.title || '';
    const caption = document.createElement('figcaption');
    caption.textContent = `${item.image} · ${item.title || ''}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = '从相册移除';
    button.onclick = () => {
      content.gallery.splice(index, 1);
      renderGallery();
    };
    figure.append(img, caption, button);
    return figure;
  }));
}

async function load() {
  if (!apiBase) {
    show('请先在 admin/settings.js 填入 Worker 地址。', true);
    return;
  }
  try {
    const result = await api('/api/content');
    content = result.content;
    renderSite();
    renderPackages();
    renderGallery();
    $('#status').textContent = `已连接 · ${result.user.email}`;
    $('#login').textContent = '重新登录';
    $('#login').href = endpoint('/auth/login');
  } catch (error) {
    show(error.message, true);
    $('#login').href = endpoint('/auth/login');
  }
}

$('#save-site').onclick = async () => {
  try {
    const site = content.site;
    ['serviceCount', 'rating', 'years', 'heroImage', 'storyImage', 'video', 'phone', 'wechat', 'mapUrl', 'subway'].forEach(key => {
      site[key] = $(`#${key}`).value.trim();
    });
    site.slogan = $('#slogan').value.split('\n').map(value => value.trim()).filter(Boolean);
    site.address = $('#address').value.split('\n').map(value => value.trim()).filter(Boolean);
    await api('/api/content', { method: 'PUT', body: JSON.stringify(content) });
    show('门店信息已保存。');
  } catch (error) {
    show(error.message, true);
  }
};

$('#save-packages').onclick = async () => {
  try {
    document.querySelectorAll('[data-package][data-key]').forEach(input => {
      content.packages[Number(input.dataset.package)][input.dataset.key] = input.value.trim();
    });
    await api('/api/content', { method: 'PUT', body: JSON.stringify(content) });
    show('套餐信息已保存。');
  } catch (error) {
    show(error.message, true);
  }
};

async function upload(path, file) {
  if (!file) throw new Error('请选择文件。');
  const data = await fileToBase64(file);
  await api('/api/upload', { method: 'POST', body: JSON.stringify({ path, data }) });
}

$('#upload-photo').onclick = async () => {
  try {
    const name = $('#photo-name').value.trim();
    if (!/^photo-[a-z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(name)) {
      throw new Error('文件名请使用 photo-40.jpg 这类格式。');
    }
    await upload(`assets/${name}`, $('#photo-file').files[0]);
    const existing = content.gallery.find(item => item.image === name);
    if (existing) {
      existing.category = $('#photo-category').value;
      existing.title = $('#photo-title').value.trim() || existing.title;
    } else {
      content.gallery.push({ image: name, category: $('#photo-category').value, title: $('#photo-title').value.trim() || '新的客片', layout: '' });
    }
    await api('/api/content', { method: 'PUT', body: JSON.stringify(content) });
    renderGallery();
    show('客片已上传并保存。');
  } catch (error) {
    show(error.message, true);
  }
};

$('#upload-package').onclick = async () => {
  try {
    await upload(`assets/${$('#package-image').value}`, $('#package-file').files[0]);
    show('套餐图片已替换。');
  } catch (error) {
    show(error.message, true);
  }
};

load();
