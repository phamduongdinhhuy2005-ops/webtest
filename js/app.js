// Toast notification
function showToast(msg, type='info'){
  let container=document.querySelector('.toast-container');
  if(!container){container=document.createElement('div');container.className='toast-container';document.body.appendChild(container);}
  const toast=document.createElement('div');
  const icons={success:'✅',error:'❌',info:'ℹ️',warning:'⚠️'};
  toast.className=`toast toast-${type}`;
  toast.innerHTML=`<span class="toast-icon">${icons[type]||'ℹ️'}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(()=>{toast.classList.add('hiding');setTimeout(()=>toast.remove(),300);},3000);
}

// Navbar scroll effect
function initNavbar(){
  const nav=document.querySelector('.navbar');
  if(!nav) return;
  window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',window.scrollY>50));
  // Active link
  const path=window.location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('.nav-link').forEach(a=>{
    const href=a.getAttribute('href');
    if(href&&(path===href||(path===''&&href==='index.html'))) a.classList.add('active');
  });
  updateCartBadge();
}

// Reveal on scroll
function initReveal(){
  const els=document.querySelectorAll('.reveal,.reveal-left,.reveal-right');
  if(!els.length) return;
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting) e.target.classList.add('visible');});
  },{threshold:0.12});
  els.forEach(el=>obs.observe(el));
}

// Countdown timer
function initCountdown(targetDate){
  const el=document.getElementById('countdown');
  if(!el) return;
  function update(){
    const diff=new Date(targetDate)-new Date();
    if(diff<=0){el.innerHTML='<span>Đã kết thúc</span>';return;}
    const h=Math.floor(diff/3600000);
    const m=Math.floor((diff%3600000)/60000);
    const s=Math.floor((diff%60000)/1000);
    const fmt=n=>String(n).padStart(2,'0');
    document.getElementById('cd-hours').textContent=fmt(h);
    document.getElementById('cd-mins').textContent=fmt(m);
    document.getElementById('cd-secs').textContent=fmt(s);
  }
  update(); setInterval(update,1000);
}

// Render stars
function renderStars(rating){
  const full=Math.floor(rating);
  const half=rating%1>=0.5;
  let s='';
  for(let i=0;i<full;i++) s+='★';
  if(half) s+='☆';
  return `<span class="stars">${s}</span>`;
}

// Render product card
function renderProductCard(p){
  return `
  <div class="product-card reveal" onclick="location.href='product-detail.html?id=${p.id}'" id="product-${p.id}">
    <div class="product-card-img">
      <img src="${p.image}" alt="${p.name}" loading="lazy">
      ${p.badge?`<div class="product-card-badge"><span class="badge badge-${p.badge}">${p.badge==='hot'?'🔥 Hot':p.badge==='new'?'✨ Mới':'🏷️ Sale'}</span></div>`:''}
      <div class="product-card-actions">
        <button class="product-action-btn" title="Yêu thích" onclick="event.stopPropagation();toggleWish(${p.id},this)">♡</button>
        <button class="product-action-btn" title="Xem nhanh" onclick="event.stopPropagation();quickView(${p.id})">👁</button>
      </div>
    </div>
    <div class="product-card-body">
      <div class="product-brand">${p.brand}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-rating">
        ${renderStars(p.rating)}
        <span class="count">(${p.reviews.toLocaleString()})</span>
      </div>
      <div class="product-pricing">
        <span class="price-current">${formatPrice(p.price)}</span>
        ${p.discount?`<span class="price-original">${formatPrice(p.originalPrice)}</span><span class="price-discount">-${p.discount}%</span>`:''}
      </div>
    </div>
    <div class="product-card-footer">
      <button class="btn-add-cart" onclick="event.stopPropagation();quickAddCart(${p.id})">
        🛒 Thêm vào giỏ
      </button>
    </div>
  </div>`;
}

// Quick add to cart (use first color/storage)
function quickAddCart(id){
  const p=getProductById(id);
  addToCart(id, p.colors[0], p.storage[0], 1);
}

// Toggle wishlist
function toggleWish(id, btn){
  const wishes=JSON.parse(localStorage.getItem('wishes')||'[]');
  const idx=wishes.indexOf(id);
  if(idx>-1){wishes.splice(idx,1);btn.textContent='♡';showToast('Đã xóa khỏi yêu thích','info');}
  else{wishes.push(id);btn.textContent='❤';showToast('Đã thêm vào yêu thích ❤️','success');}
  localStorage.setItem('wishes',JSON.stringify(wishes));
}

// Quick view (redirect)
function quickView(id){ location.href=`product-detail.html?id=${id}`; }

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g, char => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  }[char]));
}

// Init
document.addEventListener('DOMContentLoaded',()=>{
  initNavbar();
  initReveal();
});

// ============================================
// CHATBOT LOGIC
// ============================================
function toggleChat() {
  const window = document.getElementById('chatbot-window');
  window.classList.toggle('hidden');
  if(!window.classList.contains('hidden')){
    document.getElementById('chat-input').focus();
  }
}

async function sendChat() {
  const inputEl = document.getElementById('chat-input');
  const message = inputEl.value.trim();
  if(!message) return;
  
  const messagesBox = document.getElementById('chat-messages');
  
  // 1. Thêm tin nhắn của người dùng vào UI
  messagesBox.innerHTML += `<div class="chat-msg user-msg">${escapeHtml(message)}</div>`;
  inputEl.value = '';
  messagesBox.scrollTop = messagesBox.scrollHeight;
  
  // 2. Hiện "AI đang gõ..."
  const typingId = 'typing-' + Date.now();
  messagesBox.innerHTML += `<div class="chat-msg ai-msg typing-indicator" id="${typingId}">Đang trả lời...</div>`;
  messagesBox.scrollTop = messagesBox.scrollHeight;

  try {
    // 3. Gọi Backend Node.js
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    
    const data = await response.json();
    if(!response.ok) throw new Error(data.error || 'Lỗi từ server');
    
    // 4. Xóa chữ "đang gõ" và hiện tin nhắn AI
    document.getElementById(typingId).remove();
    messagesBox.innerHTML += `<div class="chat-msg ai-msg">${escapeHtml(data.reply)}</div>`;
    
  } catch (error) {
    document.getElementById(typingId).remove();
    messagesBox.innerHTML += `<div class="chat-msg ai-msg" style="color:var(--accent)">${escapeHtml(error.message || 'Xin lỗi, máy chủ AI đang bận hoặc chưa được bật. Vui lòng thử lại sau!')}</div>`;
  }
  messagesBox.scrollTop = messagesBox.scrollHeight;
}
