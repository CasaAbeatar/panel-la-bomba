/* Apariencia del panel: automática (sigue al aparato), clara u oscura. Se recuerda solo en este navegador.
   Va en el <head> para que la elección se aplique antes de pintar y no parpadee. */
(function(){
  var r=document.documentElement;
  function leer(){try{var v=localStorage.getItem('panel.tema');return v==='claro'||v==='oscuro'?v:'';}catch(e){return '';}}
  function poner(t){if(t==='claro')r.setAttribute('data-theme','light');else if(t==='oscuro')r.setAttribute('data-theme','dark');else r.removeAttribute('data-theme');}
  poner(leer());
  window.panelTema={leer:leer,poner:poner,guardar:function(t){try{if(t)localStorage.setItem('panel.tema',t);else localStorage.removeItem('panel.tema');}catch(e){}poner(t);}};
})();
