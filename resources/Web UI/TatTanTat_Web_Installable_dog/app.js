const input = document.getElementById('searchInput');
const cards = [...document.querySelectorAll('.product-card')];
const mobileMenu = document.getElementById('mobileMenu');
const mainNav = document.getElementById('mainNav');

function filterProducts(term){
  term = term.trim().toLowerCase();
  cards.forEach(card => {
    const hay = card.dataset.search.toLowerCase();
    card.style.display = (!term || hay.includes(term)) ? '' : 'none';
  });
}
document.getElementById('searchBtn').addEventListener('click',()=>filterProducts(input.value));
input.addEventListener('keydown',e=>{ if(e.key==='Enter') filterProducts(input.value); });

document.querySelectorAll('.quick-searches button').forEach(btn=>{
  btn.addEventListener('click',()=>{
    input.value = btn.textContent;
    filterProducts(btn.textContent);
    document.getElementById('productGrid').scrollIntoView({behavior:'smooth',block:'start'});
  });
});

document.querySelectorAll('.category-card').forEach(btn=>{
  btn.addEventListener('click',()=>{
    input.value = btn.dataset.category;
    filterProducts(btn.dataset.category);
    document.getElementById('productGrid').scrollIntoView({behavior:'smooth'});
  });
});

document.querySelectorAll('.heart').forEach(btn=>{
  btn.addEventListener('click',()=>{
    btn.classList.toggle('liked');
    btn.textContent = btn.classList.contains('liked') ? '♥' : '♡';
  });
});

mobileMenu.addEventListener('click',()=>mainNav.classList.toggle('open'));

function openSellModal(){
  document.getElementById('sellModal').classList.add('show');
  document.getElementById('sellModal').setAttribute('aria-hidden','false');
}
function closeSellModal(){
  document.getElementById('sellModal').classList.remove('show');
  document.getElementById('sellModal').setAttribute('aria-hidden','true');
}
document.getElementById('sellModal').addEventListener('click',e=>{
  if(e.target.id==='sellModal') closeSellModal();
});
