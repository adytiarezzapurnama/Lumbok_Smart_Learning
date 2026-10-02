const DB_NAME="lumbok-smart-learning", DB_VERSION=2;
const STORES=["packages","materials","questions","games","results","settings","submissions"];
let db, currentView="home", editing=null, studentQuiz=null;
let teacherAuthenticated = sessionStorage.getItem("lsl_teacher_session") === "1";
const DEFAULT_TEACHER_PIN = "LUMBOK2026";
let teacherPin = DEFAULT_TEACHER_PIN;
const TEACHER_VIEWS = new Set(["teacher","packages","materials","quiz","games","results","settings","submissions"]);

const seed = {
 packages:[{id:"pkg-ipa-8",name:"IPA Kelas VIII — Sistem Pernapasan",subject:"IPA",grade:"VIII",topic:"Sistem Pernapasan",description:"Paket contoh untuk pembelajaran IPA.",createdAt:"2026-10-02"}],
 materials:[{id:"mat-ipa-1",packageId:"pkg-ipa-8",title:"Mengenal Sistem Pernapasan",body:"Sistem pernapasan manusia berfungsi mengambil oksigen dan mengeluarkan karbon dioksida. Organ utamanya meliputi hidung, faring, laring, trakea, bronkus, bronkiolus, dan alveolus.",subject:"IPA",grade:"VIII"}],
 questions:[
 {id:"q-1",packageId:"pkg-ipa-8",question:"Tempat pertukaran gas oksigen dan karbon dioksida pada paru-paru adalah ...",options:["Trakea","Alveolus","Laring","Faring"],answer:1,explanation:"Alveolus merupakan tempat pertukaran gas.",score:100},
 {id:"q-2",packageId:"pkg-ipa-8",question:"Saluran yang menghubungkan laring dengan bronkus disebut ...",options:["Trakea","Faring","Hidung","Alveolus"],answer:0,explanation:"Trakea menghubungkan laring dengan bronkus.",score:100}],
 games:[],results:[],submissions:[]
};

function id(prefix){return prefix+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7)}
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{db=r.result;STORES.forEach(s=>{if(!db.objectStoreNames.contains(s))db.createObjectStore(s,{keyPath:"id"})})};r.onsuccess=()=>{db=r.result;resolve(db)};r.onerror=()=>reject(r.error)})}
function all(store){return new Promise((res,rej)=>{const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function put(store,obj){return new Promise((res,rej)=>{const r=db.transaction(store,"readwrite").objectStore(store).put(obj);r.onsuccess=()=>res(obj);r.onerror=()=>rej(r.error)})}
function remove(store,key){return new Promise((res,rej)=>{const r=db.transaction(store,"readwrite").objectStore(store).delete(key);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
async function seedDB(){for(const s of STORES.slice(0,5)){if((await all(s)).length===0)for(const x of (seed[s]||[]))await put(s,x)}
 const savedPin=(await all("settings")).find(x=>x.id==="teacher_pin");
 if(savedPin?.value) teacherPin=savedPin.value; else await put("settings",{id:"teacher_pin",value:DEFAULT_TEACHER_PIN,updatedAt:new Date().toISOString()});
} 
async function saveTeacherPin(pin){teacherPin=pin;await put("settings",{id:"teacher_pin",value:pin,updatedAt:new Date().toISOString()})}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(msg){const t=document.querySelector("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2300)}
function modal(html){document.querySelector("#modalBody").innerHTML=html;document.querySelector("#modal").showModal()}
function closeModal(){document.querySelector("#modal").close()}
function fmt(d){return d?new Date(d).toLocaleDateString("id-ID"): "-"}
function isTeacher(){return teacherAuthenticated}
function teacherLogin(){
 modal(`<div class="modal"><div class="modal-head"><div><div class="kicker">AKSES TERBATAS</div><h2>🔐 Login Guru</h2></div><button class="close" onclick="closeModal()">×</button></div><div class="notice">Area Studio Guru, pengelolaan materi, soal, game, hasil belajar, backup, restore, dan pengaturan hanya dapat digunakan setelah login guru.</div><form id="teacherLoginForm"><div class="field"><label>PIN Guru</label><input name="pin" type="password" autocomplete="current-password" required placeholder="Masukkan PIN Guru"></div><button class="btn btn-primary" style="width:100%">Masuk sebagai Guru</button></form><p class="muted" style="font-size:11px;margin-top:12px">PIN awal aplikasi: <b>${esc(DEFAULT_TEACHER_PIN)}</b>. PIN dapat diganti melalui Pengaturan Guru.</p></div>`);
 document.querySelector("#teacherLoginForm").onsubmit=async e=>{e.preventDefault();const pin=new FormData(e.currentTarget).get("pin");if(pin!==teacherPin){toast("PIN Guru salah");return}teacherAuthenticated=true;sessionStorage.setItem("lsl_teacher_session","1");closeModal();currentView="teacher";await render();toast("Login Guru berhasil")};
}
function teacherLogout(){teacherAuthenticated=false;sessionStorage.removeItem("lsl_teacher_session");currentView="student";render();toast("Guru telah keluar")};
function goView(view){if(TEACHER_VIEWS.has(view) && !isTeacher()){teacherLogin();return}currentView=view;render()}

async function counts(){const [p,m,q,g,r,s]=await Promise.all(["packages","materials","questions","games","results","submissions"].map(all));return {p:p.length,m:m.length,q:q.length,g:g.length,r:r.length,s:s.length}}

function layout(title,sub,body,actions=""){return `<div class="section-head"><div><div class="kicker">LUMBOK SMART LEARNING</div><h1 style="margin:4px 0">${title}</h1><div class="muted">${sub}</div></div><div>${actions}</div></div>${body}`}

async function renderHome(){
 const c=await counts();
 return `<div class="hero"><div><div class="kicker" style="color:#f6d55c">MODEL PEMBELAJARAN DIGITAL ADAPTIF</div><h1>Sinyal Boleh Terbatas,<br>Belajar Tetap Terhubung.</h1><p>LUMBOK SMART LEARNING mengintegrasikan materi, evaluasi, permainan edukatif, dan penyimpanan lokal dalam satu ekosistem yang dapat digunakan dengan atau tanpa internet.</p><button class="btn" style="background:#f6d55c;color:#173f5f" data-view="student">Mulai Mode Siswa →</button></div><div class="hero-badge"><b>Offline-first</b><p>Internet menjadi pendukung, bukan prasyarat fitur inti.</p><span class="badge">PWA • IndexedDB</span></div></div>
 <div class="section grid4">
 ${[['p','Paket Belajar'],['m','Materi'],['q','Soal'],['g','Game']].map(([k,l])=>`<div class="card"><div class="kicker">${l}</div><div class="stat">${c[k]}</div><div class="muted">tersimpan lokal</div></div>`).join("")}</div>
 <div class="section grid"><div class="card"><h3>🎓 Mode Siswa</h3><p class="muted">Akses materi, quiz, dan game yang sudah disiapkan guru.</p><button class="btn btn-primary" data-view="student">Buka</button></div><div class="card"><h3>🔐 Studio Guru</h3><p class="muted">Khusus guru untuk membuat dan mengubah seluruh konten pembelajaran.</p><button class="btn btn-primary" id="homeTeacherBtn">${isTeacher()?"Buka Studio Guru":"Login Guru"}</button></div><div class="card"><h3>🔒 Data Terlindungi</h3><p class="muted">Backup, restore, hasil belajar, materi, soal, paket, dan game dikelola guru.</p><span class="badge">Akses Guru</span></div></div>`;
}

async function renderSettings(){
 return layout("Pengaturan Guru","Kelola keamanan akses Guru pada perangkat ini.",`<div class="two-col"><div class="card"><div class="kicker">KEAMANAN</div><h2 style="margin-top:6px">🔐 Ganti PIN Guru</h2><p class="muted">PIN ini digunakan untuk membuka Studio Guru. Perubahan berlaku pada perangkat/browser ini.</p><form id="teacherPinForm"><div class="field"><label>PIN Saat Ini</label><input name="currentPin" type="password" autocomplete="current-password" required minlength="4"></div><div class="field"><label>PIN Baru</label><input name="newPin" type="password" autocomplete="new-password" required minlength="4" placeholder="Minimal 4 karakter"></div><div class="field"><label>Ulangi PIN Baru</label><input name="confirmPin" type="password" autocomplete="new-password" required minlength="4"></div><button class="btn btn-primary">Simpan PIN Baru</button></form></div><div class="card"><h3>Status Akses</h3><span class="badge">🔐 ${isTeacher()?"Guru sedang login":"Terkunci"}</span><p class="muted" style="margin-top:12px">Setelah mengganti PIN, sesi Guru saat ini tetap aktif. Gunakan tombol Keluar dari Studio Guru untuk menguji PIN baru.</p><div class="notice">PIN tersimpan di penyimpanan lokal aplikasi (IndexedDB) dan tidak dikirim ke internet.</div></div></div>`);
 const f=document.querySelector("#teacherPinForm");
 f.onsubmit=async e=>{e.preventDefault();const x=Object.fromEntries(new FormData(f));if(x.currentPin!==teacherPin){toast("PIN saat ini salah");return}if(x.newPin!==x.confirmPin){toast("Konfirmasi PIN baru tidak sama");return}if(x.newPin.length<4){toast("PIN minimal 4 karakter");return}await saveTeacherPin(x.newPin);f.reset();toast("PIN Guru berhasil diganti")};
}

async function renderTeacher(){
 const c=await counts();
 return layout("Studio Guru","Pusat pembuatan dan pengelolaan sumber belajar",`<div class="teacher-lockbar"><span class="badge">🔐 Akses Guru Aktif</span><button class="btn btn-secondary btn-sm" id="teacherLogout">Keluar dari Studio Guru</button></div><div class="grid4">
 ${[['📦',c.p,'Paket Pembelajaran','packages'],['📚',c.m,'Materi','materials'],['✓',c.q,'Bank Soal','quiz'],['🎮',c.g,'Game Library','games'],['📤',c.s,'Pengumpulan Tugas','submissions'],['⚙️','', 'Pengaturan Guru','settings']].map(x=>`<div class="card"><div style="font-size:25px">${x[0]}</div><div class="stat">${x[1]}</div><h3>${x[2]}</h3><button class="btn btn-primary btn-sm" data-view="${x[3]}">Buka</button></div>`).join("")}</div>
 <div class="section two-col"><div class="card"><h3>Alur kerja guru</h3><ol class="muted" style="line-height:2"><li>Buat atau impor konten.</li><li>Simpan paket secara lokal.</li><li>Siapkan distribusi kepada siswa.</li><li>Laksanakan pembelajaran.</li><li>Rekap dan cadangkan hasil.</li></ol></div><div class="card"><h3>Status penyimpanan</h3><p>IndexedDB aktif pada browser ini.</p><span class="badge">Local-first storage</span><p class="muted">Gunakan Backup sebelum menghapus data browser atau berpindah perangkat.</p></div></div>`);
}

async function renderPackages(){
 const ps=await all("packages");
 return layout("Paket Pembelajaran","Kelompokkan materi dan soal berdasarkan mapel, kelas, dan topik.",`<div class="toolbar"><button class="btn btn-primary" id="newPackage">+ Paket Baru</button><input id="packageSearch" placeholder="Cari paket..."></div><div class="grid" id="packageGrid">${ps.map(p=>`<div class="card package-card" data-search="${esc((p.name+" "+p.subject+" "+p.grade).toLowerCase())}"><span class="badge">${esc(p.subject)} • Kelas ${esc(p.grade)}</span><h3 style="margin-top:12px">${esc(p.name)}</h3><p class="muted">${esc(p.description||"")}</p><small class="muted">${esc(p.topic||"")}</small><div style="margin-top:15px"><button class="btn btn-secondary btn-sm edit-package" data-id="${p.id}">Edit</button> <button class="btn btn-danger btn-sm delete-package" data-id="${p.id}">Hapus</button></div></div>`).join("")||`<div class="empty">Belum ada paket.</div>`}</div>`);
}

function packageForm(p={}){modal(`<div class="modal"><div class="modal-head"><h2>${p.id?"Edit":"Buat"} Paket Pembelajaran</h2><button class="close" onclick="closeModal()">×</button></div><form id="packageForm"><div class="field"><label>Nama paket</label><input name="name" required value="${esc(p.name)}" placeholder="IPA_Kelas_VIII_Sistem_Pernapasan"></div><div class="form-grid"><div class="field"><label>Mata pelajaran</label><select name="subject"><option>Matematika</option><option>IPA</option><option>IPS</option><option>Bahasa Indonesia</option><option>Seni Budaya</option><option>PJOK</option><option>Prakarya</option></select></div><div class="field"><label>Kelas</label><select name="grade"><option>VII</option><option>VIII</option><option>IX</option></select></div></div><div class="field"><label>Topik</label><input name="topic" value="${esc(p.topic)}"></div><div class="field"><label>Deskripsi</label><textarea name="description">${esc(p.description)}</textarea></div><button class="btn btn-primary">Simpan</button></form></div>`);
 const f=document.querySelector("#packageForm"); if(p.subject)f.subject.value=p.subject;if(p.grade)f.grade.value=p.grade;
 f.onsubmit=async e=>{e.preventDefault();const x=Object.fromEntries(new FormData(f));x.id=p.id||id("pkg");x.createdAt=p.createdAt||new Date().toISOString();await put("packages",x);closeModal();toast("Paket tersimpan");render()};
}

async function renderMaterials(){
 const [ms,ps]=await Promise.all([all("materials"),all("packages")]);const pn=Object.fromEntries(ps.map(p=>[p.id,p.name]));
 return layout("Materi","Guru dapat membuat, memperbarui, mengganti, dan menghapus seluruh isi materi kapan saja.",`<div class="toolbar"><button class="btn btn-primary" id="newMaterial">+ Materi Baru</button><input id="materialSearch" placeholder="Cari judul, mapel, topik..."></div><div class="card"><div class="table-wrap"><table><thead><tr><th>Judul</th><th>Paket</th><th>Isi</th><th>Diperbarui</th><th>Aksi</th></tr></thead><tbody>${ms.map(m=>`<tr><td><b>${esc(m.title)}</b><br><span class="badge">${esc(m.subject||"-")} • ${esc(m.grade||"-")}</span></td><td>${esc(pn[m.packageId]||"Tanpa paket")}</td><td>${m.imageData||m.imageUrl?"🖼️ ":""}${m.videoData||m.videoUrl?"🎥 ":""}${m.fileData?"📎 ":""}${m.sourceUrl?"🔗 ":""}${m.activity?"📝 ":""}${m.questions?"❓":""}</td><td>${fmt(m.updatedAt)}</td><td><button class="btn btn-secondary btn-sm edit-material" data-id="${m.id}">Edit</button> <button class="btn btn-danger btn-sm delete-material" data-id="${m.id}">Hapus</button></td></tr>`).join("")||`<tr><td colspan="5">Belum ada materi.</td></tr>`}</tbody></table></div></div>`);
}
function fileToDataURL(file){return new Promise((resolve,reject)=>{if(!file)return resolve("");const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(file)})}
function safeUrl(url){try{const u=new URL(url);return ["http:","https:"].includes(u.protocol)?u.href:""}catch{return ""}}
function materialPreviewMarkup(m){
 let h=`<article class="material-view"><h3>${esc(m.title||"Tanpa judul")}</h3>${m.body?`<div class="material-body">${esc(m.body).replace(/\n/g,"<br>")}</div>`:""}`;
 if(m.mathContent)h+=`<div class="math-block"><div class="kicker">Rumus Matematika</div><div class="math-preview">${latexToMathML(m.mathContent)}</div><div class="muted math-source">${esc(m.mathContent)}</div></div>`;
 if(m.imageData||m.imageUrl)h+=`<div class="material-media"><img src="${esc(m.imageData||safeUrl(m.imageUrl))}" alt="${esc(m.imageAlt||m.title||"Gambar materi")}"></div>`;
 if(m.videoData||safeUrl(m.videoUrl))h+=`<div class="material-media"><video controls preload="metadata" src="${esc(m.videoData||safeUrl(m.videoUrl))}"></video></div>`;
 if(m.fileData){const ext=(m.fileName||"").split(".").pop().toLowerCase();const isPdf=ext==="pdf"||m.fileType==="application/pdf";h+=`<div class="resource-box">📎 <div><b>${esc(m.fileName||"File Materi")}</b><small class="muted" style="display:block">${isPdf?"PDF":"PPT/PPTX atau file pendukung"}</small></div><a class="btn btn-secondary btn-sm" target="_blank" rel="noopener" download="${esc(m.fileName||"materi")}" href="${esc(m.fileData)}">${isPdf?"Buka PDF":"Buka / Simpan File"}</a></div>`;}
 if(safeUrl(m.sourceUrl))h+=`<div class="resource-box">🔗 <b>Sumber belajar</b><a class="btn btn-secondary btn-sm" target="_blank" rel="noopener" href="${esc(safeUrl(m.sourceUrl))}">Buka link</a></div>`;
 if(m.activity)h+=`<div class="activity-box"><h4>📝 Aktivitas</h4><div>${esc(m.activity).replace(/\n/g,"<br>")}</div></div>`;
 if(m.questions)h+=`<div class="question-box"><h4>❓ Pertanyaan</h4><div>${esc(m.questions).replace(/\n/g,"<br>")}</div></div>`;
 return h+`</article>`
}
function latexToMathML(src=""){
 let x=src.trim(); if(!x)return ""; x=esc(x);
 x=x.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g,'<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');
 x=x.replace(/\\sqrt\{([^{}]+)\}/g,'<msqrt>$1</msqrt>');
 x=x.replace(/\^\{([^{}]+)\}/g,'<msup><mi></mi><mrow>$1</mrow></msup>');
 x=x.replace(/_\{([^{}]+)\}/g,'<msub><mi></mi><mrow>$1</mrow></msub>');
 const greek={alpha:'α',beta:'β',gamma:'γ',delta:'δ',theta:'θ',lambda:'λ',mu:'μ',pi:'π',sigma:'σ',phi:'φ',omega:'ω',Delta:'Δ',Sigma:'Σ',Pi:'Π',Omega:'Ω'};
 Object.entries(greek).forEach(([k,v])=>x=x.replaceAll('\\'+k,v));
 const symbols={times:'×',cdot:'·',pm:'±',le:'≤',leq:'≤',ge:'≥',geq:'≥',neq:'≠',infty:'∞',rightarrow:'→',leftarrow:'←',approx:'≈'};
 Object.entries(symbols).forEach(([k,v])=>x=x.replaceAll('\\'+k,v));
 x=x.replace(/\\left|\\right/g,''); x=x.replace(/\\text\{([^{}]*)\}/g,'$1'); x=x.replace(/\\([a-zA-Z]+)/g,'$1');
 return `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mrow>${x}</mrow></math>`;
}
function mathLiveEditorMarkup(value=""){
 return `<div class="mathlive-wrap"><div class="mathlive-toolbar"><div><b>Rumus Matematika</b><div class="muted">Ketik langsung seperti MathLive. Keyboard muncul saat ikon ditekan.</div></div><button type="button" class="math-icon-btn" id="openMathKeyboard" title="Buka keyboard matematika">⌨️ <span>Math</span></button></div><math-field id="mathField" smart-fence virtual-keyboard-mode="manual" class="mathlive-field">${esc(value)}</math-field><input type="hidden" id="mathContentHidden" name="mathContent" value="${esc(value)}"><div id="mathLiveStatus" class="muted mathlive-status">Keyboard MathLive tersembunyi. Klik ⌨️ Math untuk membukanya.</div></div>`;
}
function setupMathLive(){
 const field=document.querySelector('#mathField'), hidden=document.querySelector('#mathContentHidden'), btn=document.querySelector('#openMathKeyboard'), status=document.querySelector('#mathLiveStatus');
 if(!field||!hidden||!btn)return;
 const sync=()=>{hidden.value=field.value||''}; field.addEventListener('input',sync); sync();
 btn.onclick=()=>{if(window.mathVirtualKeyboard){try{window.mathVirtualKeyboard.show();field.focus();status.textContent='Keyboard MathLive aktif — ketik rumus seperti biasa.';}catch(e){status.textContent='MathLive belum siap.'}}else status.textContent='Library MathLive belum dimuat. Untuk offline, pastikan assets/mathlive/mathlive.min.js tersedia.'};
}
async function materialForm(m={}){
 const ps=await all("packages");modal(`<div class="modal"><div class="modal-head"><div><h2>${m.id?"Edit":"Buat"} Materi</h2><div class="muted">Semua bagian dapat diperbarui kapan saja.</div></div><button class="close" onclick="closeModal()">×</button></div><form id="materialForm"><div class="form-grid"><div class="field"><label>Paket</label><select name="packageId">${ps.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></div><div class="field"><label>Judul Materi</label><input name="title" required value="${esc(m.title)}" placeholder="Contoh: Pecahan dan Bentuk Aljabar"></div></div><div class="field"><label>Penjelasan</label><textarea name="body" placeholder="Tuliskan penjelasan materi..."></textarea></div><div class="card math-editor-card"><div class="kicker">MATEMATIKA</div>${mathLiveEditorMarkup(m.mathContent||"")}</div><div class="form-grid"><div class="field"><label>🖼️ Gambar</label><input type="file" name="image" accept="image/*"><small class="muted">Disimpan lokal agar dapat digunakan offline.</small>${m.imageData||m.imageUrl?`<div class="file-current">Gambar saat ini tersedia. <label><input type="checkbox" name="removeImage" value="1"> Hapus</label></div>`:""}</div><div class="field"><label>🎥 Video</label><input type="file" name="video" accept="video/*"><input name="videoUrl" value="${esc(m.videoUrl)}" placeholder="atau URL video (https://...)" style="margin-top:7px"><small class="muted">File video lokal bekerja offline; URL membutuhkan internet.</small>${m.videoData?`<div class="file-current">Video lokal saat ini tersedia. <label><input type="checkbox" name="removeVideo" value="1"> Hapus</label></div>`:""}</div></div><div class="form-grid"><div class="field"><label>📎 PDF / PPT / PPTX / LKPD / File</label><input type="file" name="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"><small class="muted">PDF dan PowerPoint dapat disimpan bersama materi untuk digunakan siswa.</small>${m.fileData?`<div class="file-current">${esc(m.fileName||"File tersedia")}. <label><input type="checkbox" name="removeFile" value="1"> Hapus</label></div>`:""}</div><div class="field"><label>🔗 Link sumber belajar</label><input name="sourceUrl" value="${esc(m.sourceUrl)}" placeholder="https://..."></div></div><div class="field"><label>📝 Aktivitas</label><textarea name="activity" placeholder="Petunjuk kegiatan, praktik, diskusi, tugas kelompok, dan sebagainya..."></textarea></div><div class="field"><label>❓ Pertanyaan</label><textarea name="questions" placeholder="Tuliskan pertanyaan pemantik atau pertanyaan pemahaman..."></textarea></div><div class="field"><label><input type="checkbox" name="published" value="1" ${m.published!==false?"checked":""}> Tampilkan kepada siswa</label></div><button class="btn btn-primary">Simpan Materi</button></form></div>`);
 const f=document.querySelector("#materialForm");if(m.packageId)f.packageId.value=m.packageId;f.body.value=m.body||"";f.activity.value=m.activity||"";f.questions.value=m.questions||"";setupMathLive();
 f.onsubmit=async e=>{e.preventDefault();const fd=new FormData(f),p=ps.find(z=>z.id===fd.get("packageId"));const x={...m,id:m.id||id("mat"),packageId:fd.get("packageId"),title:fd.get("title").trim(),body:fd.get("body"),mathContent:fd.get("mathContent").trim(),activity:fd.get("activity"),questions:fd.get("questions"),sourceUrl:safeUrl(fd.get("sourceUrl")),videoUrl:safeUrl(fd.get("videoUrl")),published:fd.get("published")==="1",subject:p?.subject||"",grade:p?.grade||"",updatedAt:new Date().toISOString(),createdAt:m.createdAt||new Date().toISOString()};const image=fd.get("image"),video=fd.get("video"),file=fd.get("file");if(fd.get("removeImage")){delete x.imageData;x.imageName="";x.imageAlt=""}else if(image?.size){x.imageData=await fileToDataURL(image);x.imageName=image.name;x.imageAlt=x.title}if(fd.get("removeVideo")){delete x.videoData;x.videoName=""}else if(video?.size){x.videoData=await fileToDataURL(video);x.videoName=video.name}if(fd.get("removeFile")){delete x.fileData;x.fileName="";x.fileType=""}else if(file?.size){x.fileData=await fileToDataURL(file);x.fileName=file.name;x.fileType=file.type}await put("materials",x);closeModal();toast("Materi tersimpan dan diperbarui");render()};
}

async function renderQuiz(){
 const [qs,ps]=await Promise.all([all("questions"),all("packages")]);const pn=Object.fromEntries(ps.map(p=>[p.id,p.name]));
 return layout("Bank Soal","Pilihan ganda, kunci jawaban, pembahasan, dan skor.",`<div class="toolbar"><button class="btn btn-primary" id="newQuestion">+ Soal Baru</button></div><div class="card"><div class="table-wrap"><table><thead><tr><th>Pertanyaan</th><th>Paket</th><th>Skor</th><th>Aksi</th></tr></thead><tbody>${qs.map(q=>`<tr><td>${esc(q.question)}</td><td>${esc(pn[q.packageId]||"-")}</td><td>${q.score||0}</td><td><button class="btn btn-secondary btn-sm edit-question" data-id="${q.id}">Edit</button> <button class="btn btn-danger btn-sm delete-question" data-id="${q.id}">Hapus</button></td></tr>`).join("")||`<tr><td colspan="4">Belum ada soal.</td></tr>`}</tbody></table></div></div>`);
}
async function questionForm(q={}){
 const ps=await all("packages");modal(`<div class="modal"><div class="modal-head"><h2>${q.id?"Edit":"Buat"} Soal</h2><button class="close" onclick="closeModal()">×</button></div><form id="questionForm"><div class="field"><label>Paket</label><select name="packageId">${ps.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></div><div class="field"><label>Materi terkait (opsional)</label><select name="materialId"><option value="">Semua materi dalam paket</option>${(await all("materials")).filter(m=>m.packageId===q.packageId||!q.packageId).map(m=>`<option value="${m.id}">${esc(m.title)}</option>`).join("")}</select></div><div class="field"><label>Pertanyaan</label><textarea name="question" required>${esc(q.question)}</textarea></div><div class="form-grid">${[0,1,2,3].map(i=>`<div class="field"><label>Opsi ${String.fromCharCode(65+i)}</label><input name="o${i}" required value="${esc(q.options?.[i]||"")}"></div>`).join("")}</div><div class="form-grid"><div class="field"><label>Kunci jawaban</label><select name="answer"><option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option></select></div><div class="field"><label>Skor</label><input type="number" name="score" value="${q.score||100}"></div></div><div class="field"><label>Pembahasan</label><textarea name="explanation">${esc(q.explanation)}</textarea></div><button class="btn btn-primary">Simpan</button></form></div>`);
 const f=document.querySelector("#questionForm");if(q.packageId)f.packageId.value=q.packageId;if(q.materialId)f.materialId.value=q.materialId;if(q.answer!=null)f.answer.value=q.answer;
 f.onsubmit=async e=>{e.preventDefault();const x=Object.fromEntries(new FormData(f));x.id=q.id||id("q");x.options=[x.o0,x.o1,x.o2,x.o3];delete x.o0;delete x.o1;delete x.o2;delete x.o3;x.answer=Number(x.answer);x.score=Number(x.score);x.materialId=x.materialId||"";await put("questions",x);closeModal();toast("Soal tersimpan");render()};
}

async function renderGames(){
 const gs=await all("games");return layout("Game Library","Kelola game edukatif berbasis HTML.",`<div class="toolbar"><label class="btn btn-primary">+ Import Game HTML<input id="gameImport" type="file" accept=".html,.htm" hidden></label></div><div class="grid">${gs.map(g=>`<div class="card"><span class="badge">HTML • Offline setelah disiapkan</span><h3>${esc(g.name)}</h3><p class="muted">${esc(g.subject||"")} • Kelas ${esc(g.grade||"")}</p><p>${esc(g.description||"")}</p><button class="btn btn-secondary btn-sm play-game" data-id="${g.id}">Preview</button> <button class="btn btn-danger btn-sm delete-game" data-id="${g.id}">Hapus</button></div>`).join("")||`<div class="empty">Belum ada game. Impor file HTML untuk memulai.</div>`}</div>`);
}

async function playGame(gameId){const g=(await all("games")).find(x=>x.id===gameId);if(!g)return;modal(`<div class="modal game-modal"><div class="modal-head"><h2>${esc(g.name)}</h2><button class="close" onclick="closeModal()">×</button></div><iframe title="${esc(g.name)}" class="game-frame" sandbox="allow-scripts allow-forms allow-modals allow-pointer-lock" srcdoc="${esc(g.html)}"></iframe></div>`)}
async function renderResults(){
 const rs=await all("results");return layout("Hasil Belajar","Riwayat hasil quiz yang tersimpan secara lokal.",`<div class="card"><div class="table-wrap"><table><thead><tr><th>Waktu</th><th>Siswa</th><th>Quiz</th><th>Nilai</th><th>Benar</th></tr></thead><tbody>${rs.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(r=>`<tr><td>${fmt(r.date)}</td><td>${esc(r.student||"-")}</td><td>${esc(r.title||"Quiz")}</td><td><b>${r.score}</b></td><td>${r.correct}/${r.total}</td></tr>`).join("")||`<tr><td colspan="5">Belum ada hasil.</td></tr>`}</tbody></table></div></div>`);
}

async function renderStudent(){
 const [ps,ms,qs,gs,subs]=await Promise.all(["packages","materials","questions","games","submissions"].map(all));
 return layout("Mode Siswa","Belajar dengan materi, quiz, game, dan pengumpulan tugas.",`<div class="notice">Jika koneksi terputus, konten yang sudah tersimpan di perangkat tetap dapat digunakan. Tugas yang dikirim juga tersimpan lokal di perangkat ini.</div>
 <div class="section-head"><div><h2>Paket Belajar</h2><p class="muted">Materi dan evaluasi pembelajaran tersedia di sini.</p></div><button class="btn btn-secondary" data-view="student-games">🎮 Buka Game Library</button></div>
 <div class="grid">${ps.map(p=>`<div class="card"><div class="subject"><div class="subject-icon">${esc(p.subject?.[0]||"L")}</div><div><b>${esc(p.name)}</b><div class="muted">Kelas ${esc(p.grade)}</div></div></div><p class="muted">${esc(p.description||"")}</p><button class="btn btn-primary btn-sm open-package" data-id="${p.id}">Belajar</button></div>`).join("")||`<div class="empty">Belum ada paket.</div>`}</div>
 <div class="section grid">
  <div class="card"><h3>📤 Upload Tugas</h3><p class="muted">Kirim PDF, Word, PowerPoint, Excel, gambar, ZIP, dan format umum lainnya.</p><button class="btn btn-primary" data-view="student-submissions">Upload Tugas</button></div>
  <div class="card"><h3>🎮 Game Library</h3><div class="stat">${gs.length}</div><p class="muted">Game tidak lagi ditempatkan di dalam Paket Belajar.</p><button class="btn btn-secondary" data-view="student-games">Lihat Game</button></div>
  <div class="card"><h3>📚 Materi tersedia</h3><div class="stat">${ms.length}</div><p class="muted">Materi lokal siap dibaca.</p></div>
 </div>
 <div class="section grid"><div class="card"><h3>✓ Soal tersedia</h3><div class="stat">${qs.length}</div><p class="muted">Evaluasi interaktif.</p></div><div class="card"><h3>📨 Tugas tersimpan</h3><div class="stat">${subs.length}</div><p class="muted">Pengumpulan pada perangkat ini.</p></div></div>`);
}

async function renderStudentGames(){
 const gs=await all("games");
 return layout("Game Library","Semua game pembelajaran siswa dikumpulkan di satu tempat dan tidak ditampilkan lagi di dalam Paket Belajar.",`<div class="section-head"><div><h2>🎮 Game Pembelajaran</h2><p class="muted">Game HTML dapat dimainkan langsung secara offline setelah tersedia di perangkat.</p></div><button class="btn btn-secondary" data-view="student">← Kembali ke Mode Siswa</button></div><div class="grid">${gs.map(g=>`<div class="card"><span class="badge">HTML • Offline</span><h3 style="margin-top:12px">${esc(g.name)}</h3><p class="muted">${esc(g.description||"Game edukatif tersimpan di perangkat")}</p><button class="btn btn-primary" data-student-play-game="${g.id}">▶ Mainkan Game</button></div>`).join("")||'<div class="empty">Game belum tersedia. Guru dapat mengimpor game melalui Game Library Guru.</div>'}</div>`);
}

function submissionAccept(){return '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.rtf,.jpg,.jpeg,.png,.webp,.gif,.zip,.rar,.7z,.odt,.ods,.odp';}
function formatBytes(n=0){if(n<1024)return `${n} B`;if(n<1024*1024)return `${(n/1024).toFixed(1)} KB`;return `${(n/1024/1024).toFixed(1)} MB`}
async function renderStudentSubmissions(){
 const [ps,subs]=await Promise.all([all("packages"),all("submissions")]);
 const recent=subs.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,10);
 return layout("Upload Tugas","Kirim tugas siswa dalam berbagai format. Data disimpan lokal agar tetap dapat digunakan saat offline.",`<div class="two-col"><div class="card"><div class="kicker">PENGUMPULAN TUGAS</div><h2 style="margin-top:6px">📤 Kirim Tugas</h2><div class="notice">Format yang didukung: PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, CSV, TXT/RTF, JPG/JPEG/PNG/WEBP/GIF, ZIP/RAR/7Z, ODT/ODS/ODP. Maksimal 20 MB per file.</div><form id="submissionForm"><div class="form-grid"><div class="field"><label>Nama Siswa</label><input name="student" required placeholder="Nama lengkap siswa"></div><div class="field"><label>Paket / Mata Pelajaran</label><select name="packageId"><option value="">Tidak terkait paket tertentu</option>${ps.map(p=>`<option value="${p.id}">${esc(p.name)} — Kelas ${esc(p.grade)}</option>`).join("")}</select></div></div><div class="field"><label>Judul Tugas</label><input name="title" required placeholder="Contoh: Tugas Sistem Pernapasan"></div><div class="field"><label>Keterangan (opsional)</label><textarea name="note" placeholder="Catatan untuk guru..."></textarea></div><div class="field"><label>File Tugas</label><input id="submissionFiles" name="files" type="file" multiple accept="${submissionAccept()}"><small class="muted">Bisa memilih beberapa file sekaligus. Maksimal 20 MB per file.</small></div><div id="submissionFileList" class="file-list"></div><button class="btn btn-primary" type="submit">📤 Kirim Tugas</button></form></div><div class="card"><h3>Alur pengumpulan</h3><ol class="muted" style="line-height:1.8"><li>Pilih nama siswa dan paket.</li><li>Masukkan judul tugas.</li><li>Pilih satu atau beberapa file.</li><li>Klik Kirim Tugas.</li><li>Guru dapat melihat dan mengunduhnya dari Pengumpulan Tugas.</li></ol><div class="notice">Pada mode offline, pengumpulan tersimpan di IndexedDB perangkat ini. Untuk memindahkannya ke perangkat guru, gunakan Backup/Restore aplikasi.</div></div></div><div class="section"><div class="card"><h3>Pengumpulan Terbaru</h3><div class="table-wrap"><table><thead><tr><th>Waktu</th><th>Siswa</th><th>Tugas</th><th>File</th></tr></thead><tbody>${recent.map(s=>`<tr><td>${fmt(s.createdAt)}</td><td>${esc(s.student)}</td><td>${esc(s.title)}</td><td>${s.files?.map(f=>esc(f.name)).join(", ")||"-"}</td></tr>`).join("")||'<tr><td colspan="4">Belum ada tugas dikirim dari perangkat ini.</td></tr>'}</tbody></table></div></div></div>`);
 const f=document.querySelector('#submissionForm'), filesInput=document.querySelector('#submissionFiles'), list=document.querySelector('#submissionFileList');
 filesInput?.addEventListener('change',()=>{const files=[...filesInput.files];list.innerHTML=files.map(x=>`<div class="file-chip">📎 ${esc(x.name)} <span>${formatBytes(x.size)}</span></div>`).join("")||""});
 f.onsubmit=async e=>{e.preventDefault();const files=[...filesInput.files];if(!files.length){toast("Pilih minimal satu file tugas");return}const tooBig=files.find(x=>x.size>20*1024*1024);if(tooBig){toast(`File ${tooBig.name} melebihi 20 MB`);return}const fd=new FormData(f);const stored=[];for(const file of files)stored.push({name:file.name,type:file.type||"application/octet-stream",size:file.size,data:await fileToDataURL(file)});await put("submissions",{id:id("sub"),student:String(fd.get("student")).trim(),packageId:String(fd.get("packageId")||""),title:String(fd.get("title")).trim(),note:String(fd.get("note")||""),files:stored,createdAt:new Date().toISOString()});f.reset();list.innerHTML="";toast("Tugas berhasil disimpan");await render()};
}

async function renderSubmissions(){
 const [subs,ps]=await Promise.all([all("submissions"),all("packages")]);const pn=Object.fromEntries(ps.map(p=>[p.id,p.name]));
 return layout("Pengumpulan Tugas","Guru dapat melihat dan mengunduh tugas yang tersimpan di perangkat ini atau hasil Restore dari perangkat siswa.",`<div class="notice">Pengumpulan tugas bersifat lokal/offline. Jika siswa mengumpulkan pada perangkat berbeda, gunakan Backup dari perangkat siswa lalu Restore di perangkat guru.</div><div class="card"><div class="table-wrap"><table><thead><tr><th>Waktu</th><th>Siswa</th><th>Tugas</th><th>Paket</th><th>File</th><th>Aksi</th></tr></thead><tbody>${subs.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(s=>`<tr><td>${fmt(s.createdAt)}</td><td><b>${esc(s.student)}</b></td><td>${esc(s.title)}${s.note?`<br><span class="muted">${esc(s.note)}</span>`:""}</td><td>${esc(pn[s.packageId]||"-")}</td><td>${s.files?.map(f=>`<div>📎 ${esc(f.name)} <small class="muted">(${formatBytes(f.size)})</small></div>`).join("")||"-"}</td><td>${s.files?.map((f,i)=>`<button class="btn btn-secondary btn-sm download-submission" data-sid="${s.id}" data-index="${i}">Unduh</button>`).join(" ")||""} <button class="btn btn-danger btn-sm delete-submission" data-id="${s.id}">Hapus</button></td></tr>`).join("")||'<tr><td colspan="6">Belum ada pengumpulan tugas.</td></tr>'}</tbody></table></div></div>`);
}

async function downloadSubmission(sid,index){const s=(await all("submissions")).find(x=>x.id===sid),f=s?.files?.[index];if(!f)return;const a=document.createElement('a');a.href=f.data;a.download=f.name;a.click();toast(`Mengunduh ${f.name}`)}

async function openPackage(pid){const [p,ms,qs]=await Promise.all([all("packages"),all("materials"),all("questions")]);const pack=p.find(x=>x.id===pid);const visible=ms.filter(x=>x.packageId===pid&&x.published!==false);const packageQs=qs.filter(x=>x.packageId===pid);modal(`<div class="modal"><div class="modal-head"><div><h2>${esc(pack?.name)}</h2><span class="badge">${esc(pack?.subject)} • ${esc(pack?.grade)}</span></div><button class="close" onclick="closeModal()">×</button></div><div class="section"><h3>📚 Materi Pembelajaran</h3>${visible.map(m=>materialPreviewMarkup(m)+`<button class="btn btn-primary btn-sm material-quiz" data-pid="${pid}" data-mid="${m.id}">Evaluasi materi ini</button>`).join("")||'<p class="muted">Belum ada materi untuk paket ini.</p>'}</div><div class="section"><h3>Evaluasi Paket</h3><p>${packageQs.length} soal tersedia dari bank soal paket ini.</p><button class="btn btn-primary" id="startQuiz" data-pid="${pid}">Mulai Quiz Paket</button></div></div>`);document.querySelector('#startQuiz')?.addEventListener('click',()=>startQuiz(pid));document.querySelectorAll('.material-quiz').forEach(b=>b.onclick=()=>startQuiz(pid,b.dataset.mid));}

async function startQuiz(pid,mid=null){
 const qs=(await all("questions")).filter(q=>q.packageId===pid&&(!q.materialId||!mid||q.materialId===mid));if(!qs.length){toast("Belum ada soal pada paket ini.");return}
 studentQuiz={pid,materialId:mid,qs,index:0,correct:0,score:0};closeModal();renderQuizRunner();
}
function renderQuizRunner(){
 const q=studentQuiz.qs[studentQuiz.index], total=studentQuiz.qs.length;
 modal(`<div class="modal"><div class="modal-head"><div><div class="kicker">Quiz ${studentQuiz.index+1}/${total}</div><h2>${esc(q.question)}</h2></div></div><div>${q.options.map((o,i)=>`<button class="quiz-option" data-i="${i}"><b>${String.fromCharCode(65+i)}.</b> ${esc(o)}</button>`).join("")}</div></div>`);
 document.querySelectorAll(".quiz-option").forEach(b=>b.onclick=()=>answerQuiz(Number(b.dataset.i)));
}
async function answerQuiz(i){
 const q=studentQuiz.qs[studentQuiz.index];if(i===q.answer){studentQuiz.correct++;studentQuiz.score+=q.score||100}
 studentQuiz.index++;
 if(studentQuiz.index<studentQuiz.qs.length){renderQuizRunner();return}
 const score=Math.round(studentQuiz.correct/studentQuiz.qs.length*100),student=prompt("Nama siswa untuk menyimpan hasil:")||"Siswa";
 await put("results",{id:id("res"),date:new Date().toISOString(),student,title:"Quiz "+studentQuiz.pid+(studentQuiz.materialId?" / materi "+studentQuiz.materialId:""),packageId:studentQuiz.pid,materialId:studentQuiz.materialId||null,score,correct:studentQuiz.correct,total:studentQuiz.qs.length});
 modal(`<div class="modal"><h2>Quiz selesai 🎉</h2><div class="stat">${score}</div><p>Jawaban benar: ${studentQuiz.correct} dari ${studentQuiz.qs.length}.</p><button class="btn btn-primary" onclick="closeModal();render()">Selesai</button></div>`);toast("Hasil belajar tersimpan");
}

async function exportBackup(){
 const data={version:1,app:"LUMBOK SMART LEARNING",exportedAt:new Date().toISOString()};
 for(const s of STORES)data[s]=await all(s);
 const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="lumbok-smart-learning-backup.json";a.click();URL.revokeObjectURL(a.href);toast("Backup dibuat");
}
async function restoreBackup(file){
 const data=JSON.parse(await file.text());for(const s of STORES)for(const x of (data[s]||[]))await put(s,x);const restoredPin=(data.settings||[]).find(x=>x.id==="teacher_pin");if(restoredPin?.value)teacherPin=restoredPin.value;toast("Data dipulihkan");render();
}

async function render(){
 if(TEACHER_VIEWS.has(currentView) && !isTeacher()){currentView="student";toast("Area tersebut hanya untuk Guru");}
 const c=document.querySelector("#content");
 const teacherOnly = document.querySelectorAll(".teacher-only");
 teacherOnly.forEach(x=>x.style.display=isTeacher()?"":"none");
 const teacherTop=document.querySelector("#teacherLoginTop");
 if(teacherTop){teacherTop.textContent=isTeacher()?"🔓 Keluar Guru":"🔐 Guru";teacherTop.title=isTeacher()?"Keluar dari akses Guru":"Akses Guru"}
 document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view===currentView));
 if(currentView==="home")c.innerHTML=await renderHome();
 else if(currentView==="teacher")c.innerHTML=await renderTeacher();
 else if(currentView==="settings")c.innerHTML=await renderSettings();
 else if(currentView==="packages")c.innerHTML=await renderPackages();
 else if(currentView==="materials")c.innerHTML=await renderMaterials();
 else if(currentView==="quiz")c.innerHTML=await renderQuiz();
 else if(currentView==="games")c.innerHTML=await renderGames();
 else if(currentView==="results")c.innerHTML=await renderResults();
 else if(currentView==="student")c.innerHTML=await renderStudent();
 else if(currentView==="student-games")c.innerHTML=await renderStudentGames();
 else if(currentView==="student-submissions")c.innerHTML=await renderStudentSubmissions();
 else if(currentView==="submissions")c.innerHTML=await renderSubmissions();
 bind();
}
async function bind(){
 const q=s=>document.querySelector(s);
 document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>goView(b.dataset.view));
 q("#homeTeacherBtn")?.addEventListener("click",()=>isTeacher()?goView("teacher"):teacherLogin());
 q("#teacherLogout")?.addEventListener("click",teacherLogout);
 q("#teacherLoginTop")?.addEventListener("click",isTeacher()?teacherLogout:teacherLogin);
 q("#teacherLogoutTop")?.addEventListener("click",teacherLogout);
 q("#backupBtn")?.addEventListener("click",()=>isTeacher()?exportBackup():teacherLogin());
 q("#backupHome")?.addEventListener("click",()=>isTeacher()?exportBackup():teacherLogin());
 q("#restoreBtn")?.addEventListener("click",()=>isTeacher()?q("#restoreInput").click():teacherLogin());
 q("#restoreInput")?.addEventListener("change",e=>isTeacher()&&e.target.files[0]&&restoreBackup(e.target.files[0]));
 q("#newPackage")?.addEventListener("click",()=>packageForm());
 document.querySelectorAll(".edit-package").forEach(b=>b.onclick=async()=>packageForm((await all("packages")).find(x=>x.id===b.dataset.id)));
 document.querySelectorAll(".delete-package").forEach(b=>b.onclick=async()=>{if(confirm("Hapus paket?")){await remove("packages",b.dataset.id);render()}});
 q("#packageSearch")?.addEventListener("input",e=>document.querySelectorAll(".package-card").forEach(x=>x.style.display=x.dataset.search.includes(e.target.value.toLowerCase())?"":"none"));
 q("#newMaterial")?.addEventListener("click",()=>materialForm()); q("#materialSearch")?.addEventListener("input",e=>document.querySelectorAll(".table-wrap tbody tr").forEach(x=>x.style.display=x.innerText.toLowerCase().includes(e.target.value.toLowerCase())?"":"none"));
 document.querySelectorAll(".edit-material").forEach(b=>b.onclick=async()=>materialForm((await all("materials")).find(x=>x.id===b.dataset.id)));
 document.querySelectorAll(".delete-material").forEach(b=>b.onclick=async()=>{if(confirm("Hapus materi?")){await remove("materials",b.dataset.id);render()}});
 q("#newQuestion")?.addEventListener("click",()=>questionForm());
 document.querySelectorAll("[data-student-play-game]").forEach(b=>b.onclick=()=>playGame(b.dataset.studentPlayGame));
 document.querySelectorAll(".download-submission").forEach(b=>b.onclick=()=>downloadSubmission(b.dataset.sid,Number(b.dataset.index)));
 document.querySelectorAll(".delete-submission").forEach(b=>b.onclick=async()=>{if(confirm("Hapus pengumpulan tugas ini?")){await remove("submissions",b.dataset.id);render()}});
 document.querySelectorAll(".edit-question").forEach(b=>b.onclick=async()=>questionForm((await all("questions")).find(x=>x.id===b.dataset.id)));
 document.querySelectorAll(".delete-question").forEach(b=>b.onclick=async()=>{if(confirm("Hapus soal?")){await remove("questions",b.dataset.id);render()}});
 q("#gameImport")?.addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;const html=await f.text();await put("games",{id:id("game"),name:f.name.replace(/\.html?$/i,""),fileName:f.name,html,description:"Game HTML impor",createdAt:new Date().toISOString()});toast("Game berhasil diimpor");render()});
 document.querySelectorAll(".delete-game").forEach(b=>b.onclick=async()=>{if(confirm("Hapus game?")){await remove("games",b.dataset.id);render()}});
 document.querySelectorAll(".play-game").forEach(b=>b.onclick=async()=>{const g=(await all("games")).find(x=>x.id===b.dataset.id);modal(`<div class="modal"><div class="modal-head"><h2>${esc(g.name)}</h2><button class="close" onclick="closeModal()">×</button></div><iframe title="${esc(g.name)}" style="width:100%;height:60vh;border:1px solid #ddd;border-radius:10px" sandbox="allow-scripts allow-forms allow-modals" srcdoc="${esc(g.html)}"></iframe></div>`)});
 document.querySelectorAll(".open-package").forEach(b=>b.onclick=()=>openPackage(b.dataset.id));document.querySelectorAll(".student-play-game").forEach(b=>b.onclick=()=>playGame(b.dataset.id));
}

let lastTextTarget=null;
document.addEventListener("focusin",e=>{if(e.target.matches("input:not([type=file]):not([type=hidden]),textarea"))lastTextTarget=e.target;});
function setupGlobalKeyboard(){const panel=document.querySelector("#globalKeyboardPanel"),toggle=document.querySelector("#globalKeyboardToggle"),field=document.querySelector("#globalMathField");if(!panel||!toggle||!field)return;const open=()=>{panel.hidden=false;toggle.setAttribute("aria-expanded","true");document.body.classList.add("keyboard-open");requestAnimationFrame(()=>{field.focus();try{window.mathVirtualKeyboard?.show?.();}catch(e){}})};const close=()=>{panel.hidden=true;toggle.setAttribute("aria-expanded","false");document.body.classList.remove("keyboard-open");try{window.mathVirtualKeyboard?.hide?.();}catch(e){}};toggle.onclick=()=>panel.hidden?open():close();document.querySelector("#globalKeyboardClose").onclick=close;field.addEventListener("focus",()=>{try{window.mathVirtualKeyboard?.show?.();}catch(e){}});document.querySelector("#globalMathInsert").onclick=()=>{if(!lastTextTarget){toast("Pilih kolom teks atau jawaban terlebih dahulu.");return}const value=field.value||"";if(!value){toast("Masukkan rumus terlebih dahulu.");return}const el=lastTextTarget,start=el.selectionStart??el.value.length,end=el.selectionEnd??el.value.length;if(typeof el.setRangeText==='function')el.setRangeText(value,start,end,'end');else el.value=(el.value||'')+value;el.dispatchEvent(new Event("input",{bubbles:true}));el.focus();toast("Rumus disisipkan")};document.querySelector("#globalMathClear").onclick=()=>{field.value="";field.focus()};}

function connection(){const el=document.querySelector("#connection");el.className="status "+(navigator.onLine?"online":"offline");el.textContent=navigator.onLine?"● Online":"● Offline"}
window.addEventListener("online",connection);window.addEventListener("offline",connection);
document.addEventListener("click",e=>{if(e.target.matches("dialog"))closeModal()});
(async()=>{await openDB();await seedDB();setupGlobalKeyboard();connection();render();if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{})})();
