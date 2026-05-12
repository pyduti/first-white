(function(){
  window.__app=window.__app||{};
  var app=window.__app;

  function debounce(fn,wait){
    var t;
    return function(){
      var ctx=this,args=arguments;
      clearTimeout(t);
      t=setTimeout(function(){fn.apply(ctx,args)},wait);
    };
  }

  function initAOS(){
    if(app.aosInit)return;
    app.aosInit=true;
    if(!window.AOS)return;
    var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduced)return;
    document.querySelectorAll('[data-aos][data-avoid-layout="true"]').forEach(function(el){
      el.removeAttribute('data-aos');
    });
    AOS.init({
      once:false,
      duration:600,
      easing:'ease-out',
      offset:120,
      mirror:false,
      disable:function(){
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      }
    });
    app.refreshAOS=function(){
      try{AOS.refresh();}catch(e){}
    };
  }

  function initNav(){
    if(app.navInit)return;
    app.navInit=true;
    var toggle=document.querySelector('.c-nav__toggle');
    var nav=document.querySelector('.c-nav#main-nav');
    if(!toggle||!nav)return;
    var list=nav.querySelector('.c-nav__list');

    function getFocusables(){
      if(!list)return[];
      return Array.prototype.slice.call(list.querySelectorAll('a,button,[tabindex]:not([tabindex="-1"])'));
    }

    function openMenu(){
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded','true');
      document.body.classList.add('u-no-scroll');
      var focusables=getFocusables();
      if(focusables.length)focusables[0].focus();
    }

    function closeMenu(){
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded','false');
      document.body.classList.remove('u-no-scroll');
    }

    toggle.addEventListener('click',function(){
      if(nav.classList.contains('is-open')){closeMenu();}else{openMenu();}
    });

    document.addEventListener('keydown',function(e){
      if(e.key==='Escape'&&nav.classList.contains('is-open')){
        closeMenu();
        toggle.focus();
        return;
      }
      if(e.key==='Tab'&&nav.classList.contains('is-open')){
        var focusables=getFocusables();
        if(!focusables.length)return;
        var first=focusables[0];
        var last=focusables[focusables.length-1];
        if(e.shiftKey){
          if(document.activeElement===first){
            e.preventDefault();
            last.focus();
          }
        }else{
          if(document.activeElement===last){
            e.preventDefault();
            first.focus();
          }
        }
      }
    });

    document.addEventListener('click',function(e){
      if(!nav.classList.contains('is-open'))return;
      if(!nav.contains(e.target)&&!toggle.contains(e.target)){
        closeMenu();
      }
    });

    nav.querySelectorAll('.c-nav__link').forEach(function(link){
      link.addEventListener('click',function(){
        closeMenu();
      });
    });

    window.addEventListener('resize',debounce(function(){
      if(window.innerWidth>=1024){
        closeMenu();
        document.body.classList.remove('u-no-scroll');
      }
    },150));
  }

  function initAnchors(){
    if(app.anchorsInit)return;
    app.anchorsInit=true;
    var path=location.pathname;
    var isHome=path==='/'||path==='/index.html'||path==='';

    function smoothScroll(hash){
      var target=document.querySelector(hash);
      if(!target)return false;
      var headerEl=document.querySelector('.l-header');
      var offset=headerEl?headerEl.getBoundingClientRect().height:80;
      var top=target.getBoundingClientRect().top+window.pageYOffset-offset;
      window.scrollTo({top:top,behavior:'smooth'});
      return true;
    }

    if(isHome){
      document.querySelectorAll('a[href^="/#"]').forEach(function(link){
        var full=link.getAttribute('href');
        var hash=full.replace(/^//,'');
        link.setAttribute('href',hash);
        link.addEventListener('click',function(e){
          var h=link.getAttribute('href');
          if(h==='#'||h==='#!')return;
          if(smoothScroll(h))e.preventDefault();
        });
      });
    }

    document.querySelectorAll('a[href^="#"]').forEach(function(link){
      var hash=link.getAttribute('href');
      if(hash==='#'||hash==='#!')return;
      link.addEventListener('click',function(e){
        var h=link.getAttribute('href');
        if(h==='#'||h==='#!')return;
        if(smoothScroll(h))e.preventDefault();
      });
    });

    if(isHome&&location.hash){
      setTimeout(function(){
        var hash=location.hash;
        if(hash&&hash!=='#'&&hash!=='#!'){
          var target=document.querySelector(hash);
          if(target){
            var headerEl=document.querySelector('.l-header');
            var offset=headerEl?headerEl.getBoundingClientRect().height:80;
            var top=target.getBoundingClientRect().top+window.pageYOffset-offset;
            window.scrollTo({top:top,behavior:'smooth'});
          }
        }
      },100);
    }
  }

  function initActiveNav(){
    if(app.activeNavInit)return;
    app.activeNavInit=true;
    var path=location.pathname;
    var isHome=path==='/'||path==='/index.html'||path==='';

    document.querySelectorAll('.c-nav__link').forEach(function(link){
      link.removeAttribute('aria-current');
      link.classList.remove('is-active');
      var href=link.getAttribute('href');
      if(!href)return;
      var hashIndex=href.indexOf('#');
      var linkPath=hashIndex!==-1?href.substring(0,hashIndex):href;

      if(isHome){
        if(href==='/'||href==='/index.html'||href===''||linkPath==='/'||linkPath==='/index.html'||linkPath===''){
          link.setAttribute('aria-current','page');
          link.classList.add('is-active');
        }
      }else{
        if(linkPath&&linkPath!=='/'&&linkPath!=='/index.html'&&linkPath!==''){
          var normalPath=path.replace(//$/,'');
          var normalLink=linkPath.replace(//$/,'');
          if(normalPath===normalLink||normalPath.endsWith(normalLink)){
            link.setAttribute('aria-current','page');
            link.classList.add('is-active');
          }
        }
      }
    });
  }

  function initImages(){
    if(app.imagesInit)return;
    app.imagesInit=true;
    document.querySelectorAll('img').forEach(function(img){
      var isCritical=img.classList.contains('c-logo__img')||img.hasAttribute('data-critical');
      if(!isCritical&&!img.getAttribute('loading')){
        img.setAttribute('loading','lazy');
      }
      if(!img.classList.contains('img-fluid')){
        img.classList.add('img-fluid');
      }
      img.addEventListener('error',function(){
        if(img.dataset.fallbackSet)return;
        img.dataset.fallbackSet='1';
        var w=img.getAttribute('width')||100;
        var h=img.getAttribute('height')||100;
        var svg='data:image/svg+xml,%3Csvg xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg' width%3D''+w+'' height%3D''+h+'' viewBox%3D'0 0 '+w+' '+h+''%3E%3Crect width%3D''+w+'' height%3D''+h+'' fill%3D'%23f0ebe8'%2F%3E%3Ctext x%3D'50%25' y%3D'50%25' dominant-baseline%3D'middle' text-anchor%3D'middle' font-size%3D'14' fill%3D'%23999'%3EImage unavailable%3C%2Ftext%3E%3C%2Fsvg%3E';
        img.src=svg;
        img.style.objectFit='contain';
        if(img.classList.contains('c-logo__img')){
          img.style.maxHeight='40px';
        }
      });
    });
  }

  function initForms(){
    if(app.formsInit)return;
    app.formsInit=true;

    document.querySelectorAll('.needs-validation').forEach(function(form){
      if(form.dataset.formHandled)return;
      form.dataset.formHandled='1';

      form.addEventListener('submit',function(e){
        e.preventDefault();
        e.stopPropagation();

        if(!form.checkValidity()){
          form.classList.add('was-validated');
          var firstInvalid=form.querySelector(':invalid');
          if(firstInvalid)firstInvalid.focus();
          return;
        }

        form.classList.add('was-validated');

        var submitBtn=form.querySelector('[type="submit"]');
        if(submitBtn){
          submitBtn.disabled=true;
          var originalText=submitBtn.textContent;
          submitBtn.innerHTML='<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';
        }

        var formData={};
        var elements=form.elements;
        for(var i=0;i<elements.length;i++){
          var el=elements[i];
          if(el.name&&el.type!=='submit'){
            if(el.type==='checkbox'){
              formData[el.name]=el.checked;
            }else{
              formData[el.name]=el.value;
            }
          }
        }

        fetch('process.php',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify(formData)
        })
        .then(function(response){
          if(response.ok){
            app.notify('Thank you! Your message has been sent. We'll be in touch within 24 hours.','success');
            form.reset();
            form.classList.remove('was-validated');
            var action=form.getAttribute('action');
            if(action&&action!=='#'&&action!=='process.php'){
              setTimeout(function(){window.location.href=action;},1500);
            }
          }else{
            app.notify('Something went wrong. Please try again or contact us directly.','error');
          }
        })
        .catch(function(){
          app.notify('Unable to send your message. Please check your connection and try again.','error');
        })
        .finally(function(){
          if(submitBtn){
            submitBtn.disabled=false;
            submitBtn.textContent=originalText||'Submit';
          }
        });
      });
    });
  }

  function initNotify(){
    if(app.notifyInit)return;
    app.notifyInit=true;
    app.notify=function(message,type){
      var container=document.getElementById('toast-container');
      if(!container){
        container=document.createElement('div');
        container.id='toast-container';
        container.setAttribute('role','alert');
        container.setAttribute('aria-live','polite');
        container.setAttribute('aria-atomic','true');
        document.body.appendChild(container);
      }
      var toast=document.createElement('div');
      toast.className='c-toast c-toast--'+(type||'info');
      toast.setAttribute('role','status');
      toast.textContent=message;
      container.appendChild(toast);
      setTimeout(function(){
        toast.classList.add('is-hiding');
        setTimeout(function(){
          if(toast.parentNode)toast.parentNode.removeChild(toast);
        },400);
      },5000);
    };
  }

  function initAnime(){
    if(app.animeInit)return;
    app.animeInit=true;
    if(!window.anime)return;
    var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduced)return;
    var selectors=['.card','.c-benefit-card','.feature-card','.animal-card','.c-button--primary','.c-button--success'];
    selectors.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        el.addEventListener('mouseenter',function(){
          anime({targets:el,translateY:-4,opacity:1,duration:200,easing:'easeOutQuad'});
        });
        el.addEventListener('mouseleave',function(){
          anime({targets:el,translateY:0,opacity:1,duration:200,easing:'easeOutQuad'});
        });
      });
    });
  }

  function initMobileGaps(){
    if(app.mobileGapsInit)return;
    app.mobileGapsInit=true;

    function hasGapClass(el){
      var result=false;
      el.classList.forEach(function(cls){
        if(/^gap-/.test(cls)||/^g-/.test(cls))result=true;
      });
      return result;
    }

    function applyGaps(){
      var isMobile=window.innerWidth<576;
      document.querySelectorAll('.d-flex').forEach(function(el){
        var children=el.children;
        if(children.length<=1)return;
        if(isMobile&&!hasGapClass(el)&&!el.dataset.gapAdded){
          el.classList.add('gap-3');
          el.dataset.gapAdded='1';
        }else if(!isMobile&&el.dataset.gapAdded==='1'){
          el.classList.remove('gap-3');
          delete el.dataset.gapAdded;
        }
      });
    }

    applyGaps();
    window.addEventListener('resize',debounce(applyGaps,150),{passive:true});
  }

  function initScrollHeader(){
    if(app.scrollHeaderInit)return;
    app.scrollHeaderInit=true;
    var header=document.querySelector('.l-header');
    if(!header)return;
    window.addEventListener('scroll',function(){
      if(window.scrollY>10){
        header.classList.add('is-scrolled');
      }else{
        header.classList.remove('is-scrolled');
      }
    },{passive:true});
  }

  function initFooterYear(){
    if(app.footerYearInit)return;
    app.footerYearInit=true;
    var el=document.getElementById('footer-year');
    if(el)el.textContent=new Date().getFullYear();
  }

  app.init=function(){
    if(app.initialized)return;
    app.initialized=true;
    initAOS();
    initNav();
    initAnchors();
    initActiveNav();
    initImages();
    initForms();
    initNotify();
    initAnime();
    initMobileGaps();
    initScrollHeader();
    initFooterYear();
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',app.init);
  }else{
    app.init();
  }
})();