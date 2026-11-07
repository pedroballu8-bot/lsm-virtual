/* Layanan Pembelajaran Virtual - versi demo (frontend statis + localStorage) */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (t) => new Date(t).toLocaleString('id-ID');
const safeUrl = (u) => (/^https?:\/\//i.test(u) ? u : '#');

const DB_KEY = 'vls_db_v1';
const USER_KEY = 'vls_user_v1';

const seed = {
  courses: [
    {
      id: 'c1', nama: 'Pemrograman Web', dosen: 'Dr. Rina',
      materi: [
        { id: 'm1', judul: 'Pengantar HTML & CSS', tipe: 'teks', isi: 'HTML adalah bahasa markup untuk struktur halaman, CSS untuk tampilannya. Pelajari tag dasar, selector, dan box model.' },
        { id: 'm2', judul: 'Dokumentasi MDN (rujukan)', tipe: 'link', isi: 'https://developer.mozilla.org/id/' },
      ],
    },
    {
      id: 'c2', nama: 'Basis Data', dosen: 'Pak Budi',
      materi: [{ id: 'm3', judul: 'Model Relasional', tipe: 'teks', isi: 'Data disimpan dalam tabel berisi baris dan kolom. Primary key mengidentifikasi baris secara unik; foreign key menghubungkan tabel.' }],
    },
  ],
  tugas: [
    { id: 't1', courseId: 'c1', judul: 'Buat halaman profil', deskripsi: 'Buat halaman profil pribadi dengan HTML & CSS. Kumpulkan tautan repositori atau penjelasan singkat.', deadline: '2026-12-31T23:59' },
  ],
  submissions: [],
  ujian: [
    {
      id: 'u1', courseId: 'c1', judul: 'Kuis 1 - Dasar Web', durasi: 5,
      soal: [
        { q: 'Tag untuk tautan adalah...', opts: ['<link>', '<a>', '<href>', '<url>'], ans: 1 },
        { q: 'Properti CSS untuk mengubah warna teks adalah...', opts: ['font-color', 'text-style', 'color', 'foreground'], ans: 2 },
        { q: 'HTML adalah singkatan dari...', opts: ['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink Text Mode Language'], ans: 0 },
      ],
    },
  ],
  hasil: [],
};

let db = JSON.parse(localStorage.getItem(DB_KEY) || 'null') || seed;
let user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
let timerId = null;
const save = () => localStorage.setItem(DB_KEY, JSON.stringify(db));

/* ---------- Navigasi ---------- */
function renderNav() {
  const nav = $('#nav');
  if (!user) { nav.innerHTML = ''; return; }
  nav.innerHTML = `<span>${esc(user.nama)} (${user.role})</span><button class="ghost" id="logout">Keluar</button>`;
  $('#logout').onclick = () => { localStorage.removeItem(USER_KEY); user = null; location.hash = '#/'; render(); };
}

function render() {
  if (timerId) { clearInterval(timerId); timerId = null; }
  renderNav();
  const app = $('#app');
  if (!user) return loginView(app);
  const [, page, id] = (location.hash || '#/').split('/');
  if (page === 'course') return courseView(app, id);
  if (page === 'ujian') return examView(app, id);
  dashView(app);
}
window.addEventListener('hashchange', render);

/* ---------- Login ---------- */
function loginView(app) {
  app.innerHTML = `
    <div class="card" style="max-width:420px;margin:40px auto">
      <h2>Masuk</h2>
      <p class="muted">Demo tanpa password. Pilih peran untuk mencoba fitur.</p>
      <label>Nama</label><input id="nama" placeholder="Nama lengkap">
      <label>Peran</label>
      <select id="role"><option value="mahasiswa">Mahasiswa</option><option value="dosen">Dosen</option></select>
      <p><button id="go">Masuk</button></p>
    </div>`;
  $('#go').onclick = () => {
    const nama = $('#nama').value.trim();
    if (!nama) return alert('Nama wajib diisi');
    user = { nama, role: $('#role').value };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    location.hash = '#/'; render();
  };
}

/* ---------- Dashboard ---------- */
function dashView(app) {
  app.innerHTML = `<h1>Mata Kuliah</h1><div class="grid">${db.courses.map((c) => `
    <a class="card" href="#/course/${c.id}" style="text-decoration:none;color:inherit">
      <h3>${esc(c.nama)}</h3>
      <p class="muted">${esc(c.dosen)}</p>
      <span class="badge">${c.materi.length} materi</span>
      <span class="badge">${db.tugas.filter((t) => t.courseId === c.id).length} tugas</span>
      <span class="badge">${db.ujian.filter((u) => u.courseId === c.id).length} ujian</span>
    </a>`).join('')}</div>`;
}

/* ---------- Halaman mata kuliah ---------- */
function courseView(app, id, tab = 'materi') {
  const c = db.courses.find((x) => x.id === id);
  if (!c) { app.innerHTML = '<p>Mata kuliah tidak ditemukan.</p>'; return; }
  const dosen = user.role === 'dosen';
  app.innerHTML = `
    <p><a href="#/">&larr; Kembali</a></p>
    <h1>${esc(c.nama)}</h1><p class="muted">Dosen: ${esc(c.dosen)}</p>
    <div class="tabs">
      ${['materi', 'tugas', 'ujian'].map((t) => `<button class="${t === tab ? 'active' : ''}" data-tab="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}
    </div>
    <div id="tabbody"></div>`;
  app.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => courseView(app, id, b.dataset.tab)));
  const body = $('#tabbody');
  if (tab === 'materi') materiTab(body, c, dosen, () => courseView(app, id, 'materi'));
  if (tab === 'tugas') tugasTab(body, c, dosen, () => courseView(app, id, 'tugas'));
  if (tab === 'ujian') ujianTab(body, c, dosen);
}

function materiTab(body, c, dosen, refresh) {
  body.innerHTML = `
    <div class="card"><ul class="list">${c.materi.map((m) => `
      <li><strong>${esc(m.judul)}</strong> <span class="badge">${m.tipe}</span>
        <div>${m.tipe === 'link' ? `<a href="${esc(safeUrl(m.isi))}" target="_blank" rel="noopener noreferrer">${esc(m.isi)}</a>` : `<p>${esc(m.isi)}</p>`}</div>
      </li>`).join('') || '<li class="muted">Belum ada materi.</li>'}</ul></div>
    ${dosen ? `<div class="card"><h3>Tambah Materi</h3>
      <label>Judul</label><input id="mj">
      <label>Jenis</label><select id="mt"><option value="teks">Teks</option><option value="link">Tautan (PDF/video/slide)</option></select>
      <label>Isi / URL</label><textarea id="mi"></textarea>
      <p><button id="addm">Simpan</button></p></div>` : ''}`;
  if (dosen) $('#addm').onclick = () => {
    const judul = $('#mj').value.trim(), isi = $('#mi').value.trim();
    if (!judul || !isi) return alert('Lengkapi judul dan isi');
    c.materi.push({ id: uid(), judul, tipe: $('#mt').value, isi }); save(); refresh();
  };
}

function tugasTab(body, c, dosen, refresh) {
  const list = db.tugas.filter((t) => t.courseId === c.id);
  body.innerHTML = list.map((t) => {
    const subs = db.submissions.filter((s) => s.tugasId === t.id);
    const mine = subs.find((s) => s.user === user.nama);
    const late = new Date() > new Date(t.deadline);
    return `<div class="card">
      <h3>${esc(t.judul)}</h3><p>${esc(t.deskripsi)}</p>
      <p class="muted">Tenggat: ${fmt(t.deadline)} ${late ? '<span class="badge bad">Lewat tenggat</span>' : ''}</p>
      ${dosen ? `<h4>Pengumpulan (${subs.length})</h4><ul class="list">${subs.map((s) => `
        <li><strong>${esc(s.user)}</strong> <span class="muted">${fmt(s.waktu)}</span>
          <p>${esc(s.teks)} ${s.fileName ? `<br><span class="badge">Berkas: ${esc(s.fileName)}</span>` : ''}</p>
          <div class="row"><input type="number" min="0" max="100" placeholder="Nilai" value="${s.nilai ?? ''}" data-nilai="${s.id}" style="width:110px"><button data-simpan="${s.id}" class="sec">Simpan nilai</button></div>
        </li>`).join('') || '<li class="muted">Belum ada yang mengumpulkan.</li>'}</ul>`
      : mine ? `<p><span class="badge ok">Sudah dikumpulkan</span> ${fmt(mine.waktu)}</p><p>${esc(mine.teks)}</p>
          <p>Nilai: <strong>${mine.nilai ?? 'belum dinilai'}</strong></p>`
      : `<label>Jawaban / tautan</label><textarea data-teks="${t.id}"></textarea>
         <label>Lampiran (opsional, hanya nama berkas yang dicatat pada versi demo)</label><input type="file" data-file="${t.id}">
         <p><button data-kirim="${t.id}" ${late ? 'disabled' : ''}>Kumpulkan</button></p>`}
    </div>`;
  }).join('') || '<div class="card muted">Belum ada tugas.</div>';

  if (dosen) {
    body.insertAdjacentHTML('beforeend', `<div class="card"><h3>Buat Tugas</h3>
      <label>Judul</label><input id="tj"><label>Deskripsi</label><textarea id="td"></textarea>
      <label>Tenggat</label><input id="tdl" type="datetime-local"><p><button id="addt">Simpan</button></p></div>`);
    $('#addt').onclick = () => {
      const judul = $('#tj').value.trim(), dl = $('#tdl').value;
      if (!judul || !dl) return alert('Judul dan tenggat wajib diisi');
      db.tugas.push({ id: uid(), courseId: c.id, judul, deskripsi: $('#td').value.trim(), deadline: dl }); save(); refresh();
    };
    body.querySelectorAll('[data-simpan]').forEach((b) => (b.onclick = () => {
      const s = db.submissions.find((x) => x.id === b.dataset.simpan);
      const v = body.querySelector(`[data-nilai="${s.id}"]`).value;
      s.nilai = v === '' ? null : Math.min(100, Math.max(0, Number(v))); save(); alert('Nilai tersimpan');
    }));
  } else {
    body.querySelectorAll('[data-kirim]').forEach((b) => (b.onclick = () => {
      const tid = b.dataset.kirim;
      const teks = body.querySelector(`[data-teks="${tid}"]`).value.trim();
      const f = body.querySelector(`[data-file="${tid}"]`).files[0];
      if (!teks && !f) return alert('Isi jawaban atau pilih berkas');
      db.submissions.push({ id: uid(), tugasId: tid, user: user.nama, teks, fileName: f ? f.name : '', waktu: Date.now(), nilai: null });
      save(); refresh();
    }));
  }
}

function ujianTab(body, c, dosen) {
  const list = db.ujian.filter((u) => u.courseId === c.id);
  body.innerHTML = list.map((u) => {
    const mine = db.hasil.find((h) => h.ujianId === u.id && h.user === user.nama);
    const semua = db.hasil.filter((h) => h.ujianId === u.id);
    return `<div class="card"><h3>${esc(u.judul)}</h3>
      <p class="muted">${u.soal.length} soal &middot; ${u.durasi} menit</p>
      ${dosen ? `<ul class="list">${semua.map((h) => `<li>${esc(h.user)}: <strong>${h.skor}</strong> <span class="muted">${fmt(h.waktu)}</span></li>`).join('') || '<li class="muted">Belum ada peserta.</li>'}</ul>`
        : mine ? `<p>Skor Anda: <strong>${mine.skor}</strong> <span class="badge ok">Selesai</span></p>`
        : `<a class="btn" href="#/ujian/${u.id}">Mulai Ujian</a>`}
    </div>`;
  }).join('') || '<div class="card muted">Belum ada ujian.</div>';
}

/* ---------- Ujian ---------- */
function examView(app, id) {
  const u = db.ujian.find((x) => x.id === id);
  if (!u) { app.innerHTML = '<p>Ujian tidak ditemukan.</p>'; return; }
  if (user.role === 'dosen') { app.innerHTML = '<p>Dosen tidak dapat mengikuti ujian.</p>'; return; }
  if (db.hasil.find((h) => h.ujianId === id && h.user === user.nama)) { location.hash = `#/course/${u.courseId}`; return; }

  let sisa = u.durasi * 60;
  app.innerHTML = `
    <div class="timer">⏱ Sisa waktu: <span id="sisa"></span></div>
    <h1>${esc(u.judul)}</h1>
    <form id="form">${u.soal.map((s, i) => `
      <div class="card q"><strong>${i + 1}. ${esc(s.q)}</strong>
        ${s.opts.map((o, j) => `<label class="opt"><input type="radio" name="q${i}" value="${j}"> ${esc(o)}</label>`).join('')}
      </div>`).join('')}
      <button type="submit">Kirim Jawaban</button>
    </form>`;

  let selesai = false;
  const finish = (auto) => {
    if (selesai) return; selesai = true; clearInterval(timerId);
    let benar = 0;
    u.soal.forEach((s, i) => {
      const v = document.querySelector(`input[name="q${i}"]:checked`);
      if (v && Number(v.value) === s.ans) benar++;
    });
    const skor = Math.round((benar / u.soal.length) * 100);
    db.hasil.push({ id: uid(), ujianId: u.id, user: user.nama, skor, waktu: Date.now() }); save();
    alert(`${auto ? 'Waktu habis. ' : ''}Skor Anda: ${skor} (${benar}/${u.soal.length} benar)`);
    location.hash = `#/course/${u.courseId}`;
  };
  const tick = () => {
    const m = String(Math.floor(sisa / 60)).padStart(2, '0'), s = String(sisa % 60).padStart(2, '0');
    $('#sisa').textContent = `${m}:${s}`;
    if (sisa-- <= 0) finish(true);
  };
  tick(); timerId = setInterval(tick, 1000);
  $('#form').onsubmit = (e) => { e.preventDefault(); if (confirm('Kirim jawaban sekarang?')) finish(false); };
}

render();
