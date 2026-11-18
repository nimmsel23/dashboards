// Boards are full pages: no nested frames or duplicate navigation.
const content = document.querySelector('.prose-boards');
const headings = content ? [...content.children].filter(el => el.tagName === 'H3') : [];
const keys = ['praxis', 'entwicklung', 'persoenlich'];
if (headings.length === keys.length) {
 const nav=document.createElement('nav');nav.className='hub-tabs';nav.setAttribute('aria-label','Bereiche');
 const sections=headings.map((heading,index)=>{
  const key=keys[index],panel=document.createElement('div'),link=document.createElement('a');
  panel.className='hub-panel';panel.setAttribute('aria-labelledby','bereich-'+key);
  link.href='#'+key;link.textContent=['Praxis & Geschäft','VitalOS & Entwicklung','Persönlich'][index];nav.append(link);
  heading.before(panel);heading.id='bereich-'+key;
  let el=heading;while(el&&(el===heading||!headings.includes(el))){const next=el.nextElementSibling;panel.append(el);el=next;}
  return {key,link,panel};
 });
 document.querySelector('nav.local')?.replaceWith(nav);document.querySelector('.workspace-link')?.setAttribute('hidden','');
 const boards=new Map();
 for(const {key,panel} of sections){for(const link of panel.querySelectorAll('a')){const url=new URL(link.href);if(url.origin==='https://nimmsel23.github.io'&&/^\/(?:dashboards\/[a-z0-9-]+|[a-z0-9]+-dev)\/$/.test(url.pathname)){boards.set('#'+key+'/board'+url.pathname,url.href);link.removeAttribute('target');}}}
 function render(){const legacy=boards.get(location.hash);if(legacy){location.replace(legacy);return;}const key=location.hash.slice(1).split('/')[0],current=sections.find(s=>s.key===key)||sections[0];for(const s of sections){s.panel.hidden=s!==current;if(s===current)s.link.setAttribute('aria-current','page');else s.link.removeAttribute('aria-current');}}
 window.addEventListener('hashchange',render);render();
}

