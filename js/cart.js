const CART_KEY = 'phonestore_cart';
const COUPONS = { 'PHONE10':10, 'SALE20':20, 'VIP30':30 };

function getCart(){ try{return JSON.parse(localStorage.getItem(CART_KEY))||[];}catch{return[];} }
function saveCart(c){ localStorage.setItem(CART_KEY,JSON.stringify(c)); updateCartBadge(); }

function addToCart(productId, color, storage, qty=1){
  const cart=getCart();
  const key=`${productId}-${color}-${storage}`;
  const idx=cart.findIndex(i=>i.key===key);
  if(idx>-1){ cart[idx].qty+=qty; }
  else {
    const p=getProductById(productId);
    cart.push({key,productId:p.id,name:p.name,brand:p.brand,image:p.image,price:p.price,color,storage,qty});
  }
  saveCart(cart);
  showToast('🛒 Đã thêm vào giỏ hàng!','success');
  const badge=document.querySelector('.cart-badge');
  if(badge){badge.classList.remove('bump');void badge.offsetWidth;badge.classList.add('bump');}
}

function removeFromCart(key){
  const cart=getCart().filter(i=>i.key!==key);
  saveCart(cart);
  showToast('🗑️ Đã xóa sản phẩm','info');
}

function updateQty(key, delta){
  const cart=getCart();
  const idx=cart.findIndex(i=>i.key===key);
  if(idx>-1){
    cart[idx].qty=Math.max(1,cart[idx].qty+delta);
    saveCart(cart);
  }
}

function setQty(key, qty){
  const cart=getCart();
  const idx=cart.findIndex(i=>i.key===key);
  if(idx>-1){ cart[idx].qty=Math.max(1,parseInt(qty)||1); saveCart(cart); }
}

function getCartCount(){ return getCart().reduce((s,i)=>s+i.qty,0); }

function getCartTotal(){ return getCart().reduce((s,i)=>s+i.price*i.qty,0); }

function clearCart(){ localStorage.removeItem(CART_KEY); updateCartBadge(); }

function applyCoupon(code){
  const c=COUPONS[code.toUpperCase()];
  return c?{valid:true,discount:c}:{valid:false,discount:0};
}

function updateCartBadge(){
  const badges=document.querySelectorAll('.cart-badge');
  const count=getCartCount();
  badges.forEach(b=>{ b.textContent=count; b.style.display=count>0?'flex':'none'; });
}
