const demoFacilities = [
 {id:"demo-1",name:"Rivers Community Medical Centre",category:"Hospital",city:"Port Harcourt",area:"GRA Phase 2",services:"General outpatient care, family medicine",image:"https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=900&q=80",label:"Sample listing"},
 {id:"demo-2",name:"Greenlife Family Clinic",category:"Clinic",city:"Port Harcourt",area:"D-Line",services:"Primary care, wellness consultations",image:"https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=900&q=80",label:"Sample listing"},
 {id:"demo-3",name:"Harbour Diagnostic Laboratory",category:"Laboratory",city:"Obio/Akpor",area:"Rumuola",services:"Diagnostic testing — confirm available tests",image:"https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=900&q=80",label:"Sample listing"},
 {id:"demo-4",name:"CarePoint Pharmacy",category:"Pharmacy",city:"Port Harcourt",area:"Mile 3",services:"Community pharmacy — confirm opening hours",image:"https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=900&q=80",label:"Sample listing"},
 {id:"demo-5",name:"WellSpring Specialist Clinic",category:"Clinic",city:"Port Harcourt",area:"Peter Odili Road",services:"Specialist clinic — verify specialties",image:"https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80",label:"Sample listing"},
 {id:"demo-6",name:"HealthBridge Medical Practice",category:"Doctor",city:"Obio/Akpor",area:"Rumuokoro",services:"Doctor consultation — confirm provider details",image:"https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=900&q=80",label:"Sample listing"}
];
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const escapeHTML = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let currentView = "home";

function getLocal(key, fallback=[]){try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch{return fallback}}
function setLocal(key,value){localStorage.setItem(key,JSON.stringify(value))}
function showToast(message){const t=$("#toast");t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2800)}
function navigate(view){
 const known=["home","directory","appointments","hospital","dashboard"];
 if(!known.includes(view)) view="home";
 currentView=view;
 $$(".view").forEach(v=>v.classList.toggle("active",v.dataset.page===view));
 $$(".nav-link").forEach(a=>a.classList.toggle("active",a.dataset.view===view));
 $("#mainNav").classList.remove("open");
 window.scrollTo({top:0,behavior:"smooth"});
 if(view==="directory") renderDirectory();
 if(view==="appointments") renderSavedAppointments();
 if(view==="dashboard") renderDashboard("overview");
}
function facilityCard(f){
 const cat=escapeHTML(f.category);
 return `<article class="provider-card">
   <div class="provider-image"><img src="${escapeHTML(f.image)}" alt="Illustrative healthcare setting" loading="lazy" onerror="this.style.display='none';this.parentElement.style.background='linear-gradient(135deg,#d9eee7,#8fc9be)'"><span class="tag">${cat}</span></div>
   <div class="provider-body"><div class="provider-title-row"><h3>${escapeHTML(f.name)}</h3><span class="provider-rating">★ Demo</span></div>
   <div class="provider-meta"><span>⌖</span>${escapeHTML(f.area)}, ${escapeHTML(f.city)}</div>
   <p class="provider-desc">${escapeHTML(f.services)}. This is a sample listing, not a verified provider.</p>
   <div class="provider-actions"><button class="provider-link" data-action="details" data-id="${escapeHTML(f.id)}">View details ↗</button><button class="btn btn-primary" data-action="book" data-id="${escapeHTML(f.id)}">Request visit</button></div></div>
 </article>`;
}
function allFacilities(){return [...demoFacilities,...getLocal("hc-submitted-facilities",[])]}
function renderFeatured(){ $("#featuredProviders").innerHTML=demoFacilities.slice(0,3).map(facilityCard).join(""); }
function renderDirectory(){
 const query=($("#directorySearch")?.value||"").trim().toLowerCase();
 const category=$("#categoryFilter")?.value||"All";
 const city=$("#cityFilter")?.value||"All";
 const items=allFacilities().filter(f=>{
  const text=[f.name,f.category,f.city,f.area,f.services].join(" ").toLowerCase();
  return (!query||text.includes(query))&&(category==="All"||f.category===category)&&(city==="All"||f.city===city||f.city==="Rivers State");
 });
 $("#directoryProviders").innerHTML=items.length?items.map(facilityCard).join():'<div class="empty-state">No sample listings match that search. Try another keyword or category.</div>';
 $("#resultsCount").textContent=`Showing ${items.length} sample listing${items.length===1?"":"s"}`;
}
function openAppointment(id){
 const f=allFacilities().find(x=>x.id===id);
 if(!f)return;
 const form=$("#appointmentForm");form.reset();
 form.elements.facilityId.value=f.id;form.elements.facilityName.value=f.name;
 $("#appointmentMessage").textContent="";
 const today=new Date();form.elements.date.min=today.toISOString().slice(0,10);
 $("#appointmentModal").classList.add("open");$("#appointmentModal").setAttribute("aria-hidden","false");
}
function closeModal(){$("#appointmentModal").classList.remove("open");$("#appointmentModal").setAttribute("aria-hidden","true")}
function renderSavedAppointments(){
 const items=getLocal("hc-appointments",[]);
 $("#savedAppointments").innerHTML=items.length?items.slice().reverse().map(a=>`<div class="saved-item"><div><strong>${escapeHTML(a.facilityName)}</strong><small>${escapeHTML(a.date)} · ${escapeHTML(a.time)} · Request by ${escapeHTML(a.patientName)}</small></div><span class="status-pill">Saved locally</span></div>`).join():'<div class="empty-state">No appointment requests saved on this device yet.<br>Browse providers and choose “Request visit”.</div>';
}
function renderDashboard(tab="overview"){
 const labels={overview:"Dashboard overview",facilities:"Facility directory",appointments:"Appointment requests",providers:"Provider profiles"};
 $("#dashHeading").textContent=labels[tab]||labels.overview;
 $$(".dash-link[data-dash]").forEach(b=>b.classList.toggle("active",b.dataset.dash===tab));
 const apps=getLocal("hc-appointments",[]);
 $("#dashAppointmentCount").textContent=String(apps.length).padStart(2,"0");
 $("#dashAppointments").innerHTML=apps.length?`<table class="dash-table"><thead><tr><th>Patient</th><th>Facility</th><th>Date</th><th>Status</th></tr></thead><tbody>${apps.slice(-5).reverse().map(a=>`<tr><td>${escapeHTML(a.patientName)}</td><td>${escapeHTML(a.facilityName)}</td><td>${escapeHTML(a.date)}</td><td><span class="table-status">Local demo</span></td></tr>`).join("")}</tbody></table>`:'<div class="empty-state">No locally saved requests yet.</div>';
 const facilities=allFacilities();
 $("#dashFacilities").innerHTML=facilities.slice(0,8).map(f=>`<div class="mini-facility"><span class="mini-facility-icon">✚</span><div><strong>${escapeHTML(f.name)}</strong><small>${escapeHTML(f.category)} · ${escapeHTML(f.city)} · Sample / unverified</small></div></div>`).join("");
 if(tab==="facilities") $("#dashDetailPanel").querySelector("h3").textContent="Facilities in the prototype directory";
 else if(tab==="appointments") $("#dashDetailPanel").querySelector("h3").textContent="Appointment requests are stored in this browser";
 else if(tab==="providers") $("#dashDetailPanel").querySelector("h3").textContent="Provider profiles — sample view";
 else $("#dashDetailPanel").querySelector("h3").textContent="Facility directory preview";
}
function searchFromHero(){
 $("#directorySearch").value=$("#heroSearch").value;
 $("#cityFilter").value="All";
 navigate("directory");
 renderDirectory();
}
$$("[data-view]").forEach(el=>el.addEventListener("click",e=>{e.preventDefault();navigate(el.dataset.view)}));
$$(".service-card").forEach(el=>el.addEventListener("click",()=>{navigate("directory");$("#categoryFilter").value=el.dataset.category;renderDirectory()}));
$("#heroSearchBtn").addEventListener("click",searchFromHero);
$("#heroSearch").addEventListener("keydown",e=>{if(e.key==="Enter")searchFromHero()});
$("#directorySearchBtn").addEventListener("click",renderDirectory);
$("#directorySearch").addEventListener("input",renderDirectory);
$("#categoryFilter").addEventListener("change",renderDirectory);
$("#cityFilter").addEventListener("change",renderDirectory);
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-action]");
 if(!b)return;
 const f=allFacilities().find(x=>x.id===b.dataset.id);
 if(!f)return;
 if(b.dataset.action==="book")openAppointment(f.id);
 if(b.dataset.action==="details")showToast(`${f.name} is a sample listing. Verify details directly before visiting.`);
});
$("#closeModal").addEventListener("click",closeModal);
$("#appointmentModal").addEventListener("click",e=>{if(e.target.id==="appointmentModal")closeModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
$("#appointmentForm").addEventListener("submit",e=>{
 e.preventDefault();const form=e.currentTarget;const data=Object.fromEntries(new FormData(form).entries());
 const item={...data,id:"req-"+Date.now(),createdAt:new Date().toISOString()};
 const apps=getLocal("hc-appointments",[]);apps.push(item);setLocal("hc-appointments",apps);
 $("#appointmentMessage").textContent="Request saved on this device. No provider has been contacted.";
 showToast("Demo request saved on this device.");form.reset();setTimeout(closeModal,900);
});
$("#clearAppointments").addEventListener("click",()=>{setLocal("hc-appointments",[]);renderSavedAppointments();renderDashboard();showToast("Local demo requests cleared.")});
$("#facilityForm").addEventListener("submit",e=>{
 e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget).entries());
 const f={...d,id:"submitted-"+Date.now(),area:d.city,services:d.services||"Services not supplied",image:"https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=900&q=80",label:"Submitted — not verified"};
 const list=getLocal("hc-submitted-facilities",[]);list.push(f);setLocal("hc-submitted-facilities",list);
 $("#facilityMessage").textContent="Saved in this browser for prototype testing. It has not been sent to a live administrator.";
 e.currentTarget.reset();showToast("Demo facility saved locally.");
});
$("#loginBtn")?.addEventListener("click",()=>showToast("Login is not connected yet. The backend starter is included in this project."));
$("#joinBtn")?.addEventListener("click",()=>navigate("hospital"));
$("#adminPreviewBtn").addEventListener("click",()=>navigate("dashboard"));
$("#backToSite").addEventListener("click",()=>navigate("home"));
$("#mobileMenu").addEventListener("click",()=>$("#mainNav").classList.toggle("open"));
$$("[data-dash]").forEach(b=>b.addEventListener("click",()=>renderDashboard(b.dataset.dash)));
renderFeatured();
