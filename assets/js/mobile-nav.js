(function(){
  'use strict';
  function initNavToggle(){
    var toggle = document.getElementById('navToggle');
    if(!toggle) return;
    var nav = toggle.closest('nav');
    if(!nav) return;
    var menu = nav.querySelector('ul');
    if(!menu) return;

    function setExpanded(open){
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
      nav.classList.toggle('open', !!open);
      // body lock for small screens
      if(open){ document.documentElement.classList.add('nav-open'); document.body.classList.add('nav-open'); }
      else { document.documentElement.classList.remove('nav-open'); document.body.classList.remove('nav-open'); }
    }

    // initialize
    setExpanded(false);

    // click to toggle
    toggle.addEventListener('click', function(e){
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      setExpanded(!expanded);
    });

    // keyboard: Enter/Space handled by button default, Escape closes
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') setExpanded(false); });

    // click-away to close
    document.addEventListener('click', function(e){ if(!nav.contains(e.target) && nav.classList.contains('open')) setExpanded(false); });

    // close on resize to larger screens
    window.addEventListener('resize', function(){ if(window.innerWidth > 700) setExpanded(false); });
  }

  // init on DOM ready
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNavToggle);
  else initNavToggle();
})();
