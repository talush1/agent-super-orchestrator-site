// sw-register.js
(async()=>{
  if(!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.register('service-worker.js',{scope:'./'}).catch(console.error);
  if(!reg) return;
  try {
    const status = await navigator.permissions.query({name:'periodic-background-sync'}).catch(()=>null);
    if(!status || status.state==='granted'){
      if('periodicSync' in reg) await reg.periodicSync.register('aso-refresh',{minInterval:24*60*60*1000});
    }
  } catch(e){}
})();