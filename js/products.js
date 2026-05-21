let filtered=[];
let activeFilters={brands:[],maxPrice:40000000,minPrice:0,badges:[]};
let sortBy='popular';

function initProductsPage(){
  filtered=[...products];
  renderSidebar();
  applyFilters();
  // Search from URL param
  const q=new URLSearchParams(location.search).get('q');
  if(q){document.getElementById('search-input').value=q;filterBySearch(q);}
  const cat=new URLSearchParams(location.search).get('cat');
  if(cat){activeFilters.brands=[cat];applyFilters();}
}

function renderSidebar(){
  // Brands
  const brands=[...new Set(products.map(p=>p.brand))];
  const bc=document.getElementById('brand-filters');
  if(bc) bc.innerHTML=brands.map(b=>`
    <label class="filter-option" onclick="toggleBrand('${b}',this)">
      <div class="filter-checkbox" id="cb-${b}">✓</div>
      <span class="filter-option-label">${b} (${products.filter(p=>p.brand===b).length})</span>
    </label>`).join('');
  // Price slider
  const slider=document.getElementById('price-slider');
  if(slider){slider.addEventListener('input',e=>{activeFilters.maxPrice=+e.target.value;updatePriceLabel();applyFilters();});}
}

function toggleBrand(brand,el){
  const cb=el.querySelector('.filter-checkbox');
  const idx=activeFilters.brands.indexOf(brand);
  if(idx>-1){activeFilters.brands.splice(idx,1);cb.classList.remove('checked');el.classList.remove('checked');}
  else{activeFilters.brands.push(brand);cb.classList.add('checked');el.classList.add('checked');}
  applyFilters();
}

function updatePriceLabel(){
  const el=document.getElementById('price-max-label');
  if(el) el.textContent=formatPrice(activeFilters.maxPrice);
}

function applyFilters(){
  filtered=products.filter(p=>{
    if(activeFilters.brands.length&&!activeFilters.brands.includes(p.brand)&&!activeFilters.brands.includes(p.category)) return false;
    if(p.price>activeFilters.maxPrice) return false;
    if(activeFilters.badges.length&&!activeFilters.badges.includes(p.badge)) return false;
    return true;
  });
  applySort();
}

function applySort(){
  switch(sortBy){
    case 'price-asc': filtered.sort((a,b)=>a.price-b.price); break;
    case 'price-desc': filtered.sort((a,b)=>b.price-a.price); break;
    case 'newest': filtered.sort((a,b)=>b.id-a.id); break;
    case 'rating': filtered.sort((a,b)=>b.rating-a.rating); break;
    default: filtered.sort((a,b)=>b.reviews-a.reviews);
  }
  renderGrid();
}

function renderGrid(){
  const grid=document.getElementById('products-grid');
  const count=document.getElementById('results-count');
  if(count) count.textContent=filtered.length;
  if(!grid) return;
  if(!filtered.length){
    grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🔍</div><h3>Không tìm thấy sản phẩm</h3><p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p><button class="btn btn-outline" onclick="clearFilters()">Xóa bộ lọc</button></div>`;
    return;
  }
  grid.innerHTML=filtered.map(p=>renderProductCard(p)).join('');
  initReveal();
}

function filterBySearch(q){
  const query=q.toLowerCase();
  filtered=products.filter(p=>p.name.toLowerCase().includes(query)||p.brand.toLowerCase().includes(query));
  applySort();
}

function clearFilters(){
  activeFilters={brands:[],maxPrice:40000000,minPrice:0,badges:[]};
  document.querySelectorAll('.filter-checkbox.checked').forEach(el=>{el.classList.remove('checked');el.closest('.filter-option').classList.remove('checked');});
  const slider=document.getElementById('price-slider');
  if(slider) slider.value=40000000;
  updatePriceLabel();
  applyFilters();
}

function onSortChange(val){ sortBy=val; applySort(); }

function onSearch(val){
  if(val.trim()) filterBySearch(val);
  else {filtered=[...products];applySort();}
}

function setAiRecommendationStatus(text, type='idle'){
  const status=document.getElementById('ai-rec-status');
  if(!status) return;
  status.textContent=text;
  status.className=`ai-recommend-status ${type}`;
}

function renderAiRecommendationCard(item){
  return `
    <article class="ai-rec-card">
      <button class="ai-rec-media" onclick="location.href='product-detail.html?id=${item.id}'" type="button">
        <img src="${item.image}" alt="${escapeHtml(item.name)}" loading="lazy">
      </button>
      <div class="ai-rec-content">
        <div class="product-brand">${escapeHtml(item.brand)}</div>
        <h3>${escapeHtml(item.name)}</h3>
        <div class="product-rating">
          ${renderStars(item.rating)}
          <span class="count">(${Number(item.reviews||0).toLocaleString()})</span>
        </div>
        <div class="product-pricing">
          <span class="price-current">${formatPrice(item.price)}</span>
        </div>
        <p class="ai-rec-reason">${escapeHtml(item.reason || 'Sản phẩm phù hợp với nhu cầu bạn đã nhập.')}</p>
        <div class="ai-rec-actions">
          <button class="btn btn-primary btn-sm" onclick="quickAddCart(${item.id})">Thêm vào giỏ</button>
          <button class="btn btn-outline btn-sm" onclick="location.href='product-detail.html?id=${item.id}'">Xem chi tiết</button>
        </div>
      </div>
    </article>`;
}

async function requestAiRecommendations(){
  const needEl=document.getElementById('ai-need');
  const brandEl=document.getElementById('ai-brand');
  const budgetEl=document.getElementById('ai-budget');
  const results=document.getElementById('ai-recommend-results');
  if(!needEl||!results) return;

  const need=needEl.value.trim();
  if(!need){
    setAiRecommendationStatus('Cần nhập nhu cầu','error');
    results.innerHTML='<div class="ai-rec-empty">Nhập nhu cầu sử dụng để AI có cơ sở gợi ý sản phẩm phù hợp.</div>';
    needEl.focus();
    return;
  }

  const payload={
    need,
    brand: brandEl ? brandEl.value : '',
    maxPrice: budgetEl && budgetEl.value ? Number(budgetEl.value) : undefined,
    limit: 4
  };

  setAiRecommendationStatus('Đang phân tích','loading');
  results.innerHTML='<div class="ai-rec-loading"><div class="spinner"></div><span>AI đang chọn sản phẩm phù hợp...</span></div>';

  try{
    const response=await fetch('http://localhost:3000/api/ai-recommendations',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const data=await response.json();
    if(!response.ok) throw new Error(data.error||'Không thể lấy gợi ý AI');

    const recommendations=Array.isArray(data.recommendations)?data.recommendations:[];
    if(!recommendations.length){
      setAiRecommendationStatus('Chưa có kết quả','error');
      results.innerHTML='<div class="ai-rec-empty">AI chưa tìm thấy sản phẩm phù hợp. Thử nới ngân sách hoặc mô tả nhu cầu rộng hơn.</div>';
      return;
    }

    setAiRecommendationStatus(`${recommendations.length} gợi ý${data.modelUsed ? ` • ${data.modelUsed}` : ''}`,'success');
    results.innerHTML=recommendations.map(renderAiRecommendationCard).join('');
  }catch(error){
    setAiRecommendationStatus('Lỗi gợi ý','error');
    results.innerHTML=`<div class="ai-rec-empty">${escapeHtml(error.message || 'Không thể tạo gợi ý sản phẩm lúc này.')}</div>`;
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  if(document.getElementById('products-grid')) initProductsPage();
});
