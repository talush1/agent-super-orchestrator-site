// share-handler.js
(function(){
  const p = new URLSearchParams(location.search);
  if(!(p.has('title')||p.has('text')||p.has('url'))) return;
  const item = { id: Date.now(), title: p.get('title')||'', text: p.get('text')||'', url: p.get('url')||'', ts: new Date().toISOString() };
  try{ const list = JSON.parse(localStorage.getItem('aso:shares')||'[]'); list.unshift(item); localStorage.setItem('aso:shares', JSON.stringify(list)); }catch(e){}
})();