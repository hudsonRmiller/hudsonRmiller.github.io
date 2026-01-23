const els=document.querySelectorAll('.fade-up,.fade-left,.fade-right');
window.addEventListener('load',()=>{
  els.forEach((e,i)=>{
    setTimeout(()=>{e.style.opacity=1;e.style.transform='none'},i*120);
  });
});
