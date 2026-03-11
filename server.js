const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('이미지 파일만 업로드 가능합니다.'));
  }
});

// Upload images endpoint
app.post('/api/upload', upload.array('images', 20), (req, res) => {
  const files = req.files.map(f => ({
    filename: f.filename,
    url: `/uploads/${f.filename}`,
    originalname: f.originalname
  }));
  res.json({ success: true, files });
});

// Generate detail page HTML
app.post('/api/generate', (req, res) => {
  const data = req.body;
  const html = generateDetailPageHTML(data);
  res.json({ success: true, html });
});

// Delete uploaded image
app.delete('/api/upload/:filename', (req, res) => {
  const filePath = path.join('public/uploads', req.params.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: '파일을 찾을 수 없습니다.' });
  }
});

function generateDetailPageHTML(data) {
  const {
    brandName = '',
    productName = '',
    productCode = '',
    price = '',
    originalPrice = '',
    category = '',
    season = '',
    material = '',
    fit = '',
    color = '',
    sizes = [],
    productDescription = '',
    styleGuide = '',
    washingInstructions = [],
    mainImages = [],
    detailImages = [],
    styleImages = [],
    tags = [],
    template = 'musinsa'
  } = data;

  const discountRate = originalPrice && price
    ? Math.round((1 - parseInt(price.replace(/,/g, '')) / parseInt(originalPrice.replace(/,/g, ''))) * 100)
    : 0;

  const sizeList = Array.isArray(sizes) ? sizes : sizes.split(',').map(s => s.trim());
  const tagList = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());

  const mainImagesHTML = mainImages.map((img, i) => `
    <div class="main-img-slide ${i === 0 ? 'active' : ''}" data-index="${i}">
      <img src="${img.url || img}" alt="${productName} ${i + 1}" loading="${i === 0 ? 'eager' : 'lazy'}">
    </div>
  `).join('');

  const thumbnailsHTML = mainImages.map((img, i) => `
    <div class="thumb ${i === 0 ? 'active' : ''}" data-index="${i}" onclick="switchImage(${i})">
      <img src="${img.url || img}" alt="썸네일 ${i + 1}">
    </div>
  `).join('');

  const detailImagesHTML = detailImages.map((img, i) => `
    <div class="detail-img-block">
      <img src="${img.url || img}" alt="${productName} 상세 ${i + 1}" loading="lazy">
    </div>
  `).join('');

  const styleImagesHTML = styleImages.map((img, i) => `
    <div class="style-img-item">
      <img src="${img.url || img}" alt="스타일 ${i + 1}" loading="lazy">
    </div>
  `).join('');

  const sizesHTML = sizeList.map(s => `
    <button class="size-btn" onclick="selectSize(this)">${s}</button>
  `).join('');

  const tagsHTML = tagList.filter(t => t).map(t => `<span class="tag">#${t}</span>`).join('');

  const washHTML = washingInstructions.map(w => `
    <div class="wash-item">
      <span class="wash-icon">${w.icon || '🔵'}</span>
      <span>${w.text || w}</span>
    </div>
  `).join('');

  const specRows = [
    brandName && `<tr><td>브랜드</td><td>${brandName}</td></tr>`,
    productCode && `<tr><td>상품번호</td><td>${productCode}</td></tr>`,
    category && `<tr><td>카테고리</td><td>${category}</td></tr>`,
    season && `<tr><td>시즌</td><td>${season}</td></tr>`,
    material && `<tr><td>소재</td><td>${material}</td></tr>`,
    fit && `<tr><td>핏</td><td>${fit}</td></tr>`,
    color && `<tr><td>색상</td><td>${color}</td></tr>`,
  ].filter(Boolean).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} - ${productName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --black: #0a0a0a;
      --gray-900: #1a1a1a;
      --gray-700: #3d3d3d;
      --gray-500: #767676;
      --gray-300: #b0b0b0;
      --gray-100: #f0f0f0;
      --gray-50: #f8f8f8;
      --white: #ffffff;
      --accent: #222222;
      --red: #e84118;
      --font: 'Noto Sans KR', sans-serif;
    }

    body {
      font-family: var(--font);
      color: var(--black);
      background: var(--white);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    /* ─── HEADER ─── */
    .pd-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--white);
      border-bottom: 1px solid var(--gray-100);
      padding: 0 40px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .pd-header .logo {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: var(--black);
      text-decoration: none;
    }
    .pd-header .brand-tag {
      font-size: 12px;
      font-weight: 500;
      color: var(--gray-500);
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .pd-header .header-actions {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .pd-header .header-actions button {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 22px;
      color: var(--gray-700);
      transition: color 0.2s;
    }
    .pd-header .header-actions button:hover { color: var(--black); }

    /* ─── BREADCRUMB ─── */
    .breadcrumb {
      padding: 12px 40px;
      font-size: 12px;
      color: var(--gray-500);
      border-bottom: 1px solid var(--gray-100);
    }
    .breadcrumb span { margin: 0 6px; }

    /* ─── MAIN LAYOUT ─── */
    .pd-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 40px 40px 0;
    }

    .pd-top {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      margin-bottom: 80px;
    }

    /* ─── IMAGE GALLERY ─── */
    .gallery-wrap {
      display: grid;
      grid-template-columns: 80px 1fr;
      gap: 12px;
      position: sticky;
      top: 80px;
      align-self: start;
    }
    .gallery-thumbs {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 640px;
      overflow-y: auto;
    }
    .gallery-thumbs::-webkit-scrollbar { width: 3px; }
    .gallery-thumbs::-webkit-scrollbar-thumb { background: var(--gray-300); }
    .thumb {
      width: 80px;
      height: 80px;
      border: 2px solid transparent;
      cursor: pointer;
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .thumb.active, .thumb:hover { border-color: var(--black); }
    .thumb img { width: 100%; height: 100%; object-fit: cover; }

    .gallery-main {
      position: relative;
      overflow: hidden;
      background: var(--gray-50);
      aspect-ratio: 3/4;
    }
    .main-img-slide {
      display: none;
      width: 100%;
      height: 100%;
    }
    .main-img-slide.active { display: block; }
    .main-img-slide img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .main-img-slide img:hover { transform: scale(1.04); }

    .gallery-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 100%;
      display: flex;
      justify-content: space-between;
      padding: 0 16px;
      pointer-events: none;
    }
    .gallery-nav button {
      pointer-events: all;
      width: 40px; height: 40px;
      background: rgba(255,255,255,0.9);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      transition: background 0.2s;
    }
    .gallery-nav button:hover { background: var(--white); }

    .img-counter {
      position: absolute;
      bottom: 16px;
      right: 16px;
      background: rgba(0,0,0,0.5);
      color: white;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 20px;
    }
    .badge-new {
      position: absolute;
      top: 16px;
      left: 16px;
      background: var(--black);
      color: white;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.5px;
      padding: 4px 10px;
      text-transform: uppercase;
    }

    /* ─── PRODUCT INFO ─── */
    .pd-info { display: flex; flex-direction: column; gap: 0; }

    .pd-brand {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--gray-500);
      margin-bottom: 10px;
    }
    .pd-name {
      font-size: 28px;
      font-weight: 700;
      line-height: 1.3;
      letter-spacing: -0.5px;
      color: var(--black);
      margin-bottom: 8px;
    }
    .pd-sub-name {
      font-size: 15px;
      color: var(--gray-500);
      font-weight: 400;
      margin-bottom: 24px;
    }

    .pd-rating {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
    }
    .stars { color: #ffc107; font-size: 14px; }
    .rating-score { font-size: 14px; font-weight: 600; }
    .rating-count { font-size: 13px; color: var(--gray-500); }

    .pd-price-wrap {
      padding: 20px 0;
      border-top: 1px solid var(--gray-100);
      border-bottom: 1px solid var(--gray-100);
      margin-bottom: 24px;
    }
    .pd-original-price {
      font-size: 14px;
      color: var(--gray-400, #aaa);
      text-decoration: line-through;
      margin-bottom: 4px;
    }
    .pd-price-row {
      display: flex;
      align-items: baseline;
      gap: 12px;
    }
    .pd-discount { font-size: 28px; font-weight: 700; color: var(--red); }
    .pd-price {
      font-size: 28px;
      font-weight: 700;
      color: var(--black);
    }
    .pd-price-note {
      font-size: 12px;
      color: var(--gray-500);
      margin-top: 6px;
    }

    .pd-benefits {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      background: var(--gray-50);
      margin-bottom: 24px;
      border-left: 3px solid var(--black);
    }
    .benefit-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }
    .benefit-label {
      font-weight: 600;
      min-width: 80px;
      color: var(--gray-700);
    }
    .benefit-val { color: var(--gray-700); }

    /* COLOR */
    .pd-section { margin-bottom: 24px; }
    .pd-section-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--gray-700);
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
    }
    .color-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .color-chip {
      width: 32px; height: 32px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    .color-chip.active, .color-chip:hover { border-color: var(--black); }

    /* SIZE */
    .size-grid { display: flex; gap: 8px; flex-wrap: wrap; }
    .size-btn {
      min-width: 52px;
      height: 44px;
      padding: 0 12px;
      border: 1.5px solid var(--gray-200, #ddd);
      background: var(--white);
      font-size: 14px;
      font-family: var(--font);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      color: var(--black);
    }
    .size-btn:hover { border-color: var(--black); }
    .size-btn.active { background: var(--black); color: var(--white); border-color: var(--black); }
    .size-btn.sold-out { color: var(--gray-300); border-color: var(--gray-100); cursor: not-allowed;
      text-decoration: line-through; }
    .size-guide-link {
      font-size: 12px;
      color: var(--gray-500);
      text-decoration: underline;
      cursor: pointer;
    }

    /* QUANTITY */
    .qty-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .qty-label { font-size: 13px; font-weight: 600; color: var(--gray-700); min-width: 80px; }
    .qty-control {
      display: flex;
      align-items: center;
      border: 1.5px solid var(--gray-200, #ddd);
    }
    .qty-control button {
      width: 40px; height: 40px;
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: var(--gray-700);
      transition: background 0.2s;
    }
    .qty-control button:hover { background: var(--gray-50); }
    .qty-control input {
      width: 50px; height: 40px;
      border: none;
      border-left: 1px solid var(--gray-100);
      border-right: 1px solid var(--gray-100);
      text-align: center;
      font-size: 15px;
      font-family: var(--font);
      font-weight: 500;
    }
    .qty-control input:focus { outline: none; }

    /* CTA BUTTONS */
    .cta-group { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .btn-cart {
      height: 54px;
      border: 2px solid var(--black);
      background: var(--white);
      color: var(--black);
      font-size: 15px;
      font-weight: 700;
      font-family: var(--font);
      cursor: pointer;
      letter-spacing: 0.5px;
      transition: all 0.2s;
    }
    .btn-cart:hover { background: var(--gray-50); }
    .btn-buy {
      height: 54px;
      background: var(--black);
      color: var(--white);
      border: none;
      font-size: 15px;
      font-weight: 700;
      font-family: var(--font);
      cursor: pointer;
      letter-spacing: 0.5px;
      transition: background 0.2s;
    }
    .btn-buy:hover { background: var(--gray-900); }
    .btn-row { display: flex; gap: 10px; }
    .btn-wish {
      flex: 1;
      height: 48px;
      background: none;
      border: 1.5px solid var(--gray-200, #ddd);
      font-size: 13px;
      font-family: var(--font);
      cursor: pointer;
      color: var(--gray-700);
      transition: all 0.2s;
    }
    .btn-wish:hover { border-color: var(--black); color: var(--black); }
    .btn-share {
      width: 48px; height: 48px;
      background: none;
      border: 1.5px solid var(--gray-200, #ddd);
      font-size: 18px;
      cursor: pointer;
      color: var(--gray-700);
      transition: all 0.2s;
    }
    .btn-share:hover { border-color: var(--black); color: var(--black); }

    /* DELIVERY INFO */
    .delivery-info {
      padding: 16px 0;
      border-top: 1px solid var(--gray-100);
    }
    .delivery-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 5px 0;
    }
    .delivery-row .dl { color: var(--gray-500); }
    .delivery-row .dr { color: var(--gray-700); font-weight: 500; }

    /* ─── TABS ─── */
    .pd-tabs {
      border-bottom: 2px solid var(--gray-100);
      display: flex;
      gap: 0;
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 40px;
    }
    .tab-btn {
      padding: 16px 24px;
      font-size: 14px;
      font-weight: 500;
      font-family: var(--font);
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      cursor: pointer;
      color: var(--gray-500);
      letter-spacing: 0.3px;
      transition: all 0.2s;
    }
    .tab-btn.active { color: var(--black); border-bottom-color: var(--black); font-weight: 700; }
    .tab-btn:hover { color: var(--black); }

    .tab-content { display: none; }
    .tab-content.active { display: block; }

    /* ─── DETAIL TAB ─── */
    .pd-detail-section {
      max-width: 860px;
      margin: 0 auto;
      padding: 60px 40px;
    }

    .section-title {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--gray-100);
    }
    .section-title::after {
      content: '';
      display: block;
      width: 40px;
      height: 2px;
      background: var(--black);
      margin-top: 16px;
    }

    .product-story {
      font-size: 16px;
      line-height: 2;
      color: var(--gray-700);
      margin-bottom: 48px;
      white-space: pre-line;
    }

    .detail-images { display: flex; flex-direction: column; gap: 0; }
    .detail-img-block img {
      width: 100%;
      display: block;
    }

    .style-guide-section { padding: 40px 0; }
    .style-guide-text {
      font-size: 15px;
      line-height: 1.9;
      color: var(--gray-700);
      margin-bottom: 32px;
      white-space: pre-line;
    }
    .style-images {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .style-img-item img {
      width: 100%;
      aspect-ratio: 3/4;
      object-fit: cover;
    }

    /* SPEC TABLE */
    .spec-section { padding: 40px 0; }
    .spec-table {
      width: 100%;
      border-collapse: collapse;
    }
    .spec-table td {
      padding: 14px 20px;
      font-size: 14px;
      border-bottom: 1px solid var(--gray-100);
    }
    .spec-table td:first-child {
      width: 140px;
      color: var(--gray-500);
      font-weight: 500;
      background: var(--gray-50);
    }
    .spec-table td:last-child { color: var(--gray-700); }

    /* WASHING */
    .washing-section { padding: 40px 0; }
    .washing-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .wash-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 16px;
      background: var(--gray-50);
      min-width: 80px;
    }
    .wash-icon { font-size: 24px; }
    .wash-item span:last-child {
      font-size: 11px;
      color: var(--gray-500);
      text-align: center;
    }

    /* ─── INFO TAB ─── */
    .pd-info-section {
      max-width: 860px;
      margin: 0 auto;
      padding: 60px 40px;
    }
    .info-block { margin-bottom: 40px; }
    .info-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--gray-100);
    }
    .info-list { list-style: none; }
    .info-list li {
      font-size: 13px;
      color: var(--gray-700);
      padding: 6px 0;
      padding-left: 12px;
      position: relative;
    }
    .info-list li::before {
      content: '·';
      position: absolute;
      left: 0;
      color: var(--gray-500);
    }

    /* ─── SIZE TAB ─── */
    .pd-size-section {
      max-width: 860px;
      margin: 0 auto;
      padding: 60px 40px;
    }
    .size-chart-wrap { overflow-x: auto; }
    .size-chart {
      width: 100%;
      border-collapse: collapse;
      min-width: 500px;
    }
    .size-chart th {
      background: var(--black);
      color: var(--white);
      padding: 12px 16px;
      font-size: 13px;
      font-weight: 500;
      text-align: center;
    }
    .size-chart td {
      padding: 12px 16px;
      font-size: 13px;
      text-align: center;
      border-bottom: 1px solid var(--gray-100);
      color: var(--gray-700);
    }
    .size-chart tr:nth-child(even) td { background: var(--gray-50); }
    .size-note {
      font-size: 12px;
      color: var(--gray-500);
      margin-top: 16px;
      line-height: 1.8;
    }

    /* TAGS */
    .pd-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 24px 0;
      border-top: 1px solid var(--gray-100);
    }
    .tag {
      padding: 6px 14px;
      background: var(--gray-50);
      font-size: 13px;
      color: var(--gray-700);
      cursor: pointer;
      transition: all 0.2s;
    }
    .tag:hover { background: var(--gray-100); color: var(--black); }

    /* ─── FOOTER ─── */
    .pd-footer {
      background: var(--gray-50);
      padding: 40px;
      margin-top: 80px;
      text-align: center;
    }
    .pd-footer .footer-brand {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .pd-footer .footer-sub {
      font-size: 12px;
      color: var(--gray-500);
    }

    /* TOAST */
    .toast {
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: rgba(0,0,0,0.85);
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      font-size: 14px;
      opacity: 0;
      transition: all 0.3s;
      pointer-events: none;
      z-index: 999;
    }
    .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

    /* FIXED BOTTOM (mobile feel) */
    .fixed-bottom {
      display: none;
    }

    /* ─── RESPONSIVE ─── */
    @media (max-width: 900px) {
      .pd-header { padding: 0 20px; }
      .breadcrumb { padding: 10px 20px; }
      .pd-container { padding: 24px 20px 0; }
      .pd-top { grid-template-columns: 1fr; gap: 32px; }
      .gallery-wrap { grid-template-columns: 60px 1fr; position: static; }
      .pd-name { font-size: 22px; }
      .pd-price { font-size: 24px; }
      .pd-discount { font-size: 24px; }
      .pd-tabs { padding: 0 20px; overflow-x: auto; }
      .pd-detail-section, .pd-info-section, .pd-size-section { padding: 40px 20px; }
      .fixed-bottom {
        display: flex;
        position: fixed;
        bottom: 0; left: 0; right: 0;
        padding: 12px 16px;
        background: white;
        border-top: 1px solid var(--gray-100);
        gap: 10px;
        z-index: 200;
      }
      .fixed-bottom .btn-cart-sm {
        flex: 1; height: 48px;
        border: 2px solid var(--black);
        background: white; color: var(--black);
        font-size: 14px; font-weight: 700;
        font-family: var(--font); cursor: pointer;
      }
      .fixed-bottom .btn-buy-sm {
        flex: 2; height: 48px;
        background: var(--black); color: white;
        border: none;
        font-size: 14px; font-weight: 700;
        font-family: var(--font); cursor: pointer;
      }
    }
  </style>
</head>
<body>

<!-- HEADER -->
<header class="pd-header">
  <div>
    <div class="brand-tag">${brandName || 'BRAND'}</div>
  </div>
  <div class="header-actions">
    <button title="검색">🔍</button>
    <button title="위시리스트">♡</button>
    <button title="장바구니">🛒</button>
  </div>
</header>

<!-- BREADCRUMB -->
<nav class="breadcrumb">
  홈 <span>›</span> ${category || '카테고리'} <span>›</span> <strong>${productName}</strong>
</nav>

<!-- MAIN PRODUCT AREA -->
<div class="pd-container">
  <div class="pd-top">

    <!-- GALLERY -->
    <div class="gallery-wrap">
      <div class="gallery-thumbs">
        ${thumbnailsHTML || `<div class="thumb active"><div style="width:80px;height:80px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:10px;color:#aaa;">IMG</div></div>`}
      </div>
      <div class="gallery-main" id="gallery-main">
        ${mainImagesHTML || `<div class="main-img-slide active"><div style="width:100%;height:100%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:14px;">이미지를 등록해주세요</div></div>`}
        <div class="gallery-nav">
          <button onclick="prevImage()">‹</button>
          <button onclick="nextImage()">›</button>
        </div>
        <div class="img-counter" id="img-counter">1 / ${mainImages.length || 1}</div>
        ${season ? `<div class="badge-new">${season}</div>` : ''}
      </div>
    </div>

    <!-- PRODUCT INFO -->
    <div class="pd-info">
      <div class="pd-brand">${brandName}</div>
      <h1 class="pd-name">${productName || '상품명'}</h1>
      ${productCode ? `<div class="pd-sub-name">No. ${productCode}</div>` : ''}

      <div class="pd-rating">
        <div class="stars">★★★★★</div>
        <span class="rating-score">5.0</span>
        <span class="rating-count">(리뷰 0개)</span>
      </div>

      <div class="pd-price-wrap">
        ${originalPrice ? `<div class="pd-original-price">${originalPrice}원</div>` : ''}
        <div class="pd-price-row">
          ${discountRate > 0 ? `<span class="pd-discount">${discountRate}%</span>` : ''}
          <span class="pd-price">${price ? price + '원' : '가격 미정'}</span>
        </div>
        <div class="pd-price-note">VAT 포함 · 무료배송</div>
      </div>

      <div class="pd-benefits">
        <div class="benefit-item">
          <span class="benefit-label">적립</span>
          <span class="benefit-val">${price ? Math.floor(parseInt(price.replace(/,/g,'')) * 0.01).toLocaleString() + 'P 적립 (1%)' : '-'}</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-label">배송</span>
          <span class="benefit-val">오늘 주문 시 내일(영업일) 출고</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-label">반품</span>
          <span class="benefit-val">수령 후 7일 이내 교환/반품 가능</span>
        </div>
      </div>

      ${color ? `
      <div class="pd-section">
        <div class="pd-section-label"><span>색상</span> <span style="font-weight:400;color:#767676;">${color}</span></div>
      </div>` : ''}

      ${sizeList.length > 0 ? `
      <div class="pd-section">
        <div class="pd-section-label">
          <span>사이즈</span>
          <span class="size-guide-link" onclick="document.querySelector('[data-tab=size]').click()">사이즈 가이드 ›</span>
        </div>
        <div class="size-grid">${sizesHTML}</div>
      </div>` : ''}

      <div class="qty-wrap">
        <div class="qty-label">수량</div>
        <div class="qty-control">
          <button onclick="changeQty(-1)">−</button>
          <input type="number" id="qty" value="1" min="1" max="99">
          <button onclick="changeQty(1)">+</button>
        </div>
      </div>

      <div class="cta-group">
        <button class="btn-buy" onclick="handleBuy()">구매하기</button>
        <div class="btn-row">
          <button class="btn-cart" style="flex:1" onclick="handleCart()">장바구니 담기</button>
          <button class="btn-wish" onclick="handleWish()">♡ 위시</button>
          <button class="btn-share" onclick="handleShare()">↑</button>
        </div>
      </div>

      <div class="delivery-info">
        <div class="delivery-row"><span class="dl">배송방법</span><span class="dr">일반 배송</span></div>
        <div class="delivery-row"><span class="dl">배송비</span><span class="dr">무료 (50,000원 이상)</span></div>
        <div class="delivery-row"><span class="dl">배송기간</span><span class="dr">평균 1~3일 소요</span></div>
        <div class="delivery-row"><span class="dl">교환/반품</span><span class="dr">수령 후 7일 이내</span></div>
      </div>

      ${tagsHTML ? `<div class="pd-tags">${tagsHTML}</div>` : ''}
    </div>

  </div>
</div>

<!-- TABS -->
<div class="pd-tabs">
  <button class="tab-btn active" data-tab="detail" onclick="switchTab('detail', this)">상품 상세</button>
  <button class="tab-btn" data-tab="size" onclick="switchTab('size', this)">사이즈 정보</button>
  <button class="tab-btn" data-tab="info" onclick="switchTab('info', this)">구매정보</button>
</div>

<!-- TAB: DETAIL -->
<div id="tab-detail" class="tab-content active">
  <div class="pd-detail-section">

    ${productDescription ? `
    <div>
      <div class="section-title">Product Story</div>
      <p class="product-story">${productDescription}</p>
    </div>` : ''}

    ${detailImages.length > 0 ? `
    <div>
      <div class="section-title">Detail Images</div>
      <div class="detail-images">${detailImagesHTML}</div>
    </div>` : ''}

    ${styleGuide ? `
    <div class="style-guide-section">
      <div class="section-title">Style Guide</div>
      <p class="style-guide-text">${styleGuide}</p>
      ${styleImagesHTML ? `<div class="style-images">${styleImagesHTML}</div>` : ''}
    </div>` : ''}

    ${specRows ? `
    <div class="spec-section">
      <div class="section-title">Product Details</div>
      <table class="spec-table">
        <tbody>${specRows}</tbody>
      </table>
    </div>` : ''}

    ${washHTML ? `
    <div class="washing-section">
      <div class="section-title">세탁 안내</div>
      <div class="washing-grid">${washHTML}</div>
    </div>` : ''}

  </div>
</div>

<!-- TAB: SIZE -->
<div id="tab-size" class="tab-content">
  <div class="pd-size-section">
    <div class="section-title">사이즈 가이드</div>
    <div class="size-chart-wrap">
      <table class="size-chart">
        <thead>
          <tr>
            <th>SIZE</th>
            <th>어깨 (cm)</th>
            <th>가슴 (cm)</th>
            <th>소매 (cm)</th>
            <th>총장 (cm)</th>
          </tr>
        </thead>
        <tbody>
          ${sizeList.map(s => {
            const sizeMap = {
              'XS': ['41', '94', '58', '66'], 'S': ['43', '98', '59', '68'],
              'M': ['45', '102', '60', '70'], 'L': ['47', '106', '61', '72'],
              'XL': ['49', '110', '62', '74'], 'XXL': ['51', '114', '63', '76'],
              '44': ['40', '90', '57', '64'], '55': ['43', '98', '59', '68'],
              '66': ['46', '104', '61', '72'], '77': ['49', '110', '62', '74'],
              '88': ['52', '116', '64', '78']
            };
            const d = sizeMap[s] || ['-', '-', '-', '-'];
            return `<tr><td><strong>${s}</strong></td><td>${d[0]}</td><td>${d[1]}</td><td>${d[2]}</td><td>${d[3]}</td></tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <p class="size-note">
      * 측정 방법에 따라 1~3cm 오차가 발생할 수 있습니다.<br>
      * 모델 착용 사이즈: M (신장 180cm, 체중 70kg)<br>
      * 세탁 후 수축이 있을 수 있으니 한 사이즈 크게 구매하시는 것을 권장합니다.
    </p>
  </div>
</div>

<!-- TAB: INFO -->
<div id="tab-info" class="tab-content">
  <div class="pd-info-section">
    <div class="info-block">
      <div class="info-title">교환 / 반품 안내</div>
      <ul class="info-list">
        <li>상품 수령 후 7일 이내 교환 및 반품 신청이 가능합니다.</li>
        <li>단순 변심의 경우 왕복 배송비는 고객 부담입니다.</li>
        <li>상품의 태그 및 라벨 제거, 착용, 세탁, 수선한 경우 교환/반품이 불가합니다.</li>
        <li>상품 불량 또는 오배송의 경우 배송비 무료로 교환/반품 처리됩니다.</li>
        <li>주문 후 7일 이내 출고되지 않을 경우 자동 취소 처리됩니다.</li>
      </ul>
    </div>
    <div class="info-block">
      <div class="info-title">배송 안내</div>
      <ul class="info-list">
        <li>오후 2시 이전 결제 완료 시 당일 출고됩니다.</li>
        <li>배송 기간은 평균 1~3 영업일 소요됩니다.</li>
        <li>5만원 이상 구매 시 배송비 무료입니다.</li>
        <li>도서 산간 지역의 경우 추가 배송비가 발생할 수 있습니다.</li>
        <li>출고 후 배송 조회가 가능합니다.</li>
      </ul>
    </div>
    <div class="info-block">
      <div class="info-title">상품 관련 안내</div>
      <ul class="info-list">
        <li>모니터 환경에 따라 실제 색상과 다를 수 있습니다.</li>
        <li>제품 특성상 미세한 치수 차이가 있을 수 있습니다.</li>
        <li>초기 불량 발생 시 교환/환불이 가능합니다.</li>
        <li>세탁 방법은 상품에 부착된 라벨을 확인해 주세요.</li>
      </ul>
    </div>
  </div>
</div>

<!-- FIXED BOTTOM (mobile) -->
<div class="fixed-bottom">
  <button class="btn-cart-sm" onclick="handleCart()">장바구니</button>
  <button class="btn-buy-sm" onclick="handleBuy()">구매하기</button>
</div>

<!-- TOAST -->
<div class="toast" id="toast"></div>

<!-- FOOTER -->
<footer class="pd-footer">
  <div class="footer-brand">${brandName || 'BRAND'}</div>
  <div class="footer-sub">© 2025 ${brandName || 'Brand'}. All rights reserved.</div>
</footer>

<script>
  // Gallery
  let currentIdx = 0;
  const totalImgs = document.querySelectorAll('.main-img-slide').length;

  function switchImage(idx) {
    document.querySelectorAll('.main-img-slide').forEach((el, i) => {
      el.classList.toggle('active', i === idx);
    });
    document.querySelectorAll('.thumb').forEach((el, i) => {
      el.classList.toggle('active', i === idx);
    });
    currentIdx = idx;
    document.getElementById('img-counter').textContent = (idx + 1) + ' / ' + totalImgs;
  }
  function nextImage() { switchImage((currentIdx + 1) % totalImgs); }
  function prevImage() { switchImage((currentIdx - 1 + totalImgs) % totalImgs); }

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
  });

  // Touch swipe
  let touchX = 0;
  document.getElementById('gallery-main').addEventListener('touchstart', e => { touchX = e.touches[0].clientX; });
  document.getElementById('gallery-main').addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (dx > 50) prevImage();
    if (dx < -50) nextImage();
  });

  // Size
  function selectSize(btn) {
    if (btn.classList.contains('sold-out')) return;
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  // Qty
  function changeQty(delta) {
    const input = document.getElementById('qty');
    const val = Math.max(1, Math.min(99, parseInt(input.value) + delta));
    input.value = val;
  }

  // Toast
  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }

  // CTA
  function handleBuy() { showToast('구매 페이지로 이동합니다.'); }
  function handleCart() { showToast('장바구니에 담았습니다! 🛒'); }
  function handleWish() {
    const btn = document.querySelector('.btn-wish');
    const active = btn.textContent.includes('♥');
    btn.textContent = active ? '♡ 위시' : '♥ 위시';
    showToast(active ? '위시리스트에서 삭제했습니다.' : '위시리스트에 추가했습니다! ♥');
  }
  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: '${productName}', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => showToast('링크가 복사되었습니다!'));
    }
  }

  // Tabs
  function switchTab(tabName, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    btn.classList.add('active');
    document.getElementById('tab-' + tabName).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>
</body>
</html>`;
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
