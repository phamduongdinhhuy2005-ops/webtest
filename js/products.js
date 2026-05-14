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
  if(count) count.textContent=`${filtered.length} sản phẩm`;
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

document.addEventListener('DOMContentLoaded',()=>{
  if(document.getElementById('products-grid')) initProductsPage();
});
