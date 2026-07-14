const apiBase = (window.MU_ADMIN_API || '').replace(/\/$/, '');
const $ = selector => document.querySelector(selector);
let content = null;

function endpoint(path) {
  return `${apiBase}${path}`;
}

function show(message, error = false) {
  const notice = $('#notice');
  if (!notice) return;
  notice.textContent = message;
  notice.style.color = error ? '#a23d2b' : '#9b5744';
}

const login = $('#login');
if (login) login.href = endpoint('/auth/login');

async function api(path, options = {}) {
  const response = await fetch(endpoint(path), {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  if (!response.ok) {
    let message = '';
    try {
      const body = await response.json();
      message = body.error || '';
    } catch {
      message = await response.text();
    }
    if (response.status === 401) message = '\u8bf7\u5148\u70b9\u51fb\u9875\u9762\u53f3\u4e0a\u89d2\u7684\u201c\u767b\u5f55\u540e\u53f0\u201d\u3002';
    throw new Error(message || `\u8bf7\u6c42\u5931\u8d25\uff08${response.status}\uff09`);
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
    article.innerHTML = `<h3>\u5957\u9910 ${index + 1}</h3>`;
    ['tag', 'number', 'name', 'price', 'originalPrice', 'discount', 'description', 'image', 'alt'].forEach(key => {
      const label = document.createElement('label');
      label.textContent = key === 'description' ? '\u5957\u9910\u8bf4\u660e' : key;
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
    caption.textContent = `${item.image} / ${item.title || ''}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = '\u4ece\u76f8\u518c\u79fb\u9664';
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
    show('\u8bf7\u5148\u5728 admin/settings.js \u586b\u5165 Worker \u5730\u5740\u3002', true);
    return;
  }
  try {
    const result = await api('/api/content');
    content = result.content;
    renderSite();
    renderPackages();
    renderGallery();
    $('#status').textContent = `\u5df2\u8fde\u63a5 \u00b7 ${result.user.email}`;
    $('#login').textContent = '\u91cd\u65b0\u767b\u5f55';
  } catch (error) {
    content = null;
    $('#status').textContent = '\u672a\u8fde\u63a5';
    show(error.message, true);
    $('#login').textContent = '\u767b\u5f55\u540e\u53f0';
  }
}

$('#save-site').onclick = async () => {
  if (!content) {
    show('\u8bf7\u5148\u767b\u5f55\u540e\u53f0\uff0c\u518d\u4fdd\u5b58\u4fe1\u606f\u3002', true);
    return;
  }
  try {
    const site = content.site;
    ['serviceCount', 'rating', 'years', 'heroImage', 'storyImage', 'video', 'phone', 'wechat', 'mapUrl', 'subway'].forEach(key => {
      site[key] = $(`#${key}`).value.trim();
    });
    site.slogan = $('#slogan').value.split('\n').map(value => value.trim()).filter(Boolean);
    site.address = $('#address').value.split('\n').map(value => value.trim()).filter(Boolean);
    await api('/api/content', { method: 'PUT', body: JSON.stringify(content) });
    show('\u95e8\u5e97\u4fe1\u606f\u5df2\u4fdd\u5b58\u3002');
  } catch (error) {
    show(error.message, true);
  }
};

$('#save-packages').onclick = async () => {
  if (!content) {
    show('\u8bf7\u5148\u767b\u5f55\u540e\u53f0\uff0c\u518d\u4fdd\u5b58\u5957\u9910\u3002', true);
    return;
  }
  try {
    document.querySelectorAll('[data-package][data-key]').forEach(input => {
      content.packages[Number(input.dataset.package)][input.dataset.key] = input.value.trim();
    });
    await api('/api/content', { method: 'PUT', body: JSON.stringify(content) });
    show('\u5957\u9910\u4fe1\u606f\u5df2\u4fdd\u5b58\u3002');
  } catch (error) {
    show(error.message, true);
  }
};

async function upload(path, file) {
  if (!file) throw new Error('\u8bf7\u9009\u62e9\u6587\u4ef6\u3002');
  const data = await fileToBase64(file);
  await api('/api/upload', { method: 'POST', body: JSON.stringify({ path, data }) });
}

$('#upload-photo').onclick = async () => {
  if (!content) {
    show('\u8bf7\u5148\u767b\u5f55\u540e\u53f0\uff0c\u518d\u4e0a\u4f20\u7167\u7247\u3002', true);
    return;
  }
  try {
    const name = $('#photo-name').value.trim();
    if (!/^photo-[a-z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(name)) {
      throw new Error('\u6587\u4ef6\u540d\u8bf7\u4f7f\u7528 photo-40.jpg \u8fd9\u7c7b\u683c\u5f0f\u3002');
    }
    await upload(`assets/${name}`, $('#photo-file').files[0]);
    const existing = content.gallery.find(item => item.image === name);
    if (existing) {
      existing.category = $('#photo-category').value;
      existing.title = $('#photo-title').value.trim() || existing.title;
    } else {
      content.gallery.push({ image: name, category: $('#photo-category').value, title: $('#photo-title').value.trim() || '\u65b0\u7684\u5ba2\u7247', layout: '' });
    }
    await api('/api/content', { method: 'PUT', body: JSON.stringify(content) });
    renderGallery();
    show('\u5ba2\u7247\u5df2\u4e0a\u4f20\u5e76\u4fdd\u5b58\u3002');
  } catch (error) {
    show(error.message, true);
  }
};

$('#upload-package').onclick = async () => {
  if (!content) {
    show('\u8bf7\u5148\u767b\u5f55\u540e\u53f0\uff0c\u518d\u66f4\u6362\u5957\u9910\u56fe\u7247\u3002', true);
    return;
  }
  try {
    await upload(`assets/${$('#package-image').value}`, $('#package-file').files[0]);
    show('\u5957\u9910\u56fe\u7247\u5df2\u66f4\u6362\u3002');
  } catch (error) {
    show(error.message, true);
  }
};

load();
