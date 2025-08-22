// api.js
(function(){
  function base(){ return localStorage.getItem('aso:apiBase') || '' }
  function url(path){ const b=base(); return b? b.replace(/\/$/,'')+path : path }
  async function post(path, body){ return fetch(url(path),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})}) }
  async function get(path){ return fetch(url(path)) }
  window.api = { base, url, post, get };
})();