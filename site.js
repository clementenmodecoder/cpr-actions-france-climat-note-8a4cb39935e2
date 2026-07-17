/* Interactions globales du site (aucune dependance, degrade proprement sans JS) */
(function(){
  "use strict";

  /* Ombre du header au defilement */
  var top = document.querySelector("header.top");
  if(top){
    var onScroll = function(){ top.classList.toggle("scrolled", (window.scrollY||document.documentElement.scrollTop) > 8); };
    window.addEventListener("scroll", onScroll, {passive:true});
    onScroll();
  }

  /* Apparition progressive des blocs au defilement */
  try{
    if(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if(!("IntersectionObserver" in window)) return;
    var els = document.querySelectorAll(
      "section .card, section .kpi, .reason, .step, .newscard, .comp-card, .stat, .plan, .quote, .callout, .nextnav a, .infobox"
    );
    if(!els.length) return;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, {threshold:.06, rootMargin:"0px 0px -36px 0px"});
    var i = 0;
    els.forEach(function(el){
      /* deja visible a l'ecran au chargement : pas d'animation retardee */
      var r = el.getBoundingClientRect();
      var visible = r.top < (window.innerHeight||900) - 40;
      el.classList.add("rv");
      el.style.transitionDelay = (visible ? (i++ % 4) * 60 : (i++ % 6) * 45) + "ms";
      io.observe(el);
    });
  }catch(_){ /* jamais bloquant */ }
})();
