const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const KEY = 'mengkalang_v1', R = { penduduk: 'Penduduk', admin: 'Admin Desa', kades: 'Kepala Desa', rt: 'Ketua RT/RW' };
const JS = ['Surat Keterangan Domisili', 'Surat Keterangan Tidak Mampu (SKTM)', 'Surat Keterangan Usaha (SKU)', 'Surat Pengantar KTP/KK', 'Surat Keterangan Kelahiran', 'Surat Keterangan Kematian', 'Surat Pengantar Kepindahan'];
const ST = { rt: ['Menunggu RT/RW', 'wait'], adm: ['Menunggu Admin', 'wait'], kd: ['Menunggu Kepala Desa', 'wait'], ok: ['Selesai', 'ok'], no: ['Ditolak', 'no'] };
const bdg = s => `<span class="bd ${ST[s][1]}">${ST[s][0]}</span>`;
const MAXB = 1572864, OKT = ['application/pdf', 'image/jpeg', 'image/png'];
const MENU = {
  admin: [['home', '🏠', 'Beranda'], ['pend', '👥', 'Data Penduduk'], ['peng', '📨', 'Pengajuan Surat'], ['arsip', '🗄️', 'Arsip Surat']],
  penduduk: [['home', '🏠', 'Beranda'], ['ajuan', '📝', 'Ajukan Surat'], ['riwayat', '📜', 'Riwayat & Status'], ['profil', '🪪', 'Profil & Dokumen']],
  kades: [['home', '🏠', 'Beranda'], ['ttd', '✍️', 'Tanda Tangan'], ['arsip', '🗄️', 'Arsip Surat']],
  rt: [['home', '🏠', 'Beranda'], ['ver', '✅', 'Verifikasi Warga'], ['warga', '👥', 'Warga RT']]
};
const HINT = { penduduk: 'Demo: NIK 6271010101900001, sandi 123456', admin: 'Demo: admin / admin123', kades: 'Demo: kades / kades123', rt: 'Demo: rt01 / rt123 (RT 01) atau rt02 / rt123' };
let S = load(), me = null, role = 'penduduk', page = 'home', tmp = {}, q = '';

/* ===== Data ===== */
function seed() {
  const d = {
    users: [
      { id: 'admin', pw: 'admin123', role: 'admin', nama: 'Rahmat Hidayat' },
      { id: 'kades', pw: 'kades123', role: 'kades', nama: 'H. Suparman, S.Sos' },
      { id: 'rt01', pw: 'rt123', role: 'rt', nama: 'Sutrisno', rt: '01', rw: '01' },
      { id: 'rt02', pw: 'rt123', role: 'rt', nama: 'Marlina', rt: '02', rw: '01' }],
    pend: [], peng: [], n: 2
  };
  [['Ahmad Sukardi', 'Jl. Merdeka', '01'], ['Siti Aminah', 'Jl. Melati', '01'], ['Budi Santoso', 'Jl. Pahlawan', '02'], ['Dewi Lestari', 'Jl. Mawar', '02'], ['Slamet Riyadi', 'Jl. Merdeka', '01'], ['Rina Wulandari', 'Jl. Melati', '02']]
    .forEach(([nama, a, rt], i) => d.pend.push({ nik: '6271010101900' + String(i + 1).padStart(3, '0'), nama, tl: 'Palangka Raya, 0' + (i + 1) + '-01-1990', jk: i % 2 ? 'Perempuan' : 'Laki-laki', alamat: a + ' No. ' + (10 + i), rt, rw: '01', hp: '08125500' + (100 + i), status: 'Aktif', pw: '123456', docs: {} }));
  d.peng.push({ id: 1, nik: d.pend[0].nik, nama: d.pend[0].nama, rt: '01', jenis: JS[0], perlu: 'Persyaratan administrasi bank', tgl: '2026-10-12', status: 'rt', files: [], cat: '', log: [{ t: '2026-10-12', x: 'Pengajuan dibuat oleh warga' }] });
  d.peng.push({ id: 2, nik: d.pend[2].nik, nama: d.pend[2].nama, rt: '02', jenis: JS[2], perlu: 'Pengajuan kredit usaha', tgl: '2026-10-10', status: 'kd', files: [], cat: '', log: [{ t: '2026-10-10', x: 'Pengajuan dibuat oleh warga' }, { t: '2026-10-11', x: 'Disetujui RT/RW' }, { t: '2026-10-13', x: 'Disetujui Admin Desa' }] });
  return d;
}
function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) return s; } catch (e) { } return seed(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Penyimpanan penuh. Hapus lampiran lama atau pakai file lebih kecil.'); } }
function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('show'), 2600); }
const L = (p, x) => p.log.push({ t: today(), x });

/* ===== Login ===== */
function setRole(r) {
  role = r; document.body.dataset.role = r;
  $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.r === r));
  $('#lu').placeholder = r === 'penduduk' ? 'NIK (16 digit)' : 'Nama pengguna';
  $('#hint').textContent = HINT[r]; $('#reg').hidden = r !== 'penduduk';
}
$('#tabs').onclick = e => { const b = e.target.closest('button'); if (b) setRole(b.dataset.r); };
$('#fLogin').onsubmit = e => {
  e.preventDefault();
  const u = $('#lu').value.trim(), p = $('#lp').value;
  me = role === 'penduduk' ? S.pend.find(x => x.nik === u && x.pw === p) : S.users.find(x => x.id === u && x.pw === p && x.role === role);
  if (!me) return toast('Pengguna atau kata sandi salah');
  me.role = role; page = 'home'; tmp = {};
  $('#login').hidden = true; $('#app').hidden = false; render();
};

/* ===== Render ===== */
function render() {
  const m = MENU[me.role];
  $('#side').innerHTML = `<div class="brand"><span>🏛️</span><div><b>Desa Mengkalang</b><small>Administrasi Kependudukan</small></div></div>
    <nav>${m.map(x => `<a href="#" data-act="nav" data-id="${x[0]}" class="${x[0] === page ? 'on' : ''}"><i>${x[1]}</i>${x[2]}</a>`).join('')}</nav><div class="rl">${R[me.role]}</div>`;
  $('#ttl').textContent = m.find(x => x[0] === page)[2];
  $('#who').textContent = me.nama + (me.rt ? ` (RT ${me.rt}/RW ${me.rw})` : '');
  $('#page').innerHTML = (V[me.role + '.' + page] || V[page])();
  bindDZ($('#page'));
}
const st = (n, l) => `<div class="st"><b>${n}</b><span>${l}</span></div>`;
const mine = () => me.role === 'penduduk' ? S.peng.filter(p => p.nik === me.nik) : me.role === 'rt' ? S.peng.filter(p => p.rt === me.rt) : S.peng;
const cnt = (l, s) => l.filter(p => s.includes(p.status)).length;
function tPeng(l, empty = 'Belum ada data.') {
  return l.length ? `<div class="tw"><table><thead><tr><th>ID</th><th>Pemohon</th><th>Jenis surat</th><th>Tanggal</th><th>Status</th><th></th></tr></thead><tbody>${l.map(p =>
    `<tr><td>#${p.id}</td><td>${esc(p.nama)} <small class="mu">RT ${p.rt}</small></td><td>${esc(p.jenis)}</td><td>${p.tgl}</td><td>${bdg(p.status)}</td><td><button class="b sm" data-act="lihat" data-id="${p.id}">Detail</button></td></tr>`).join('')}</tbody></table></div>` : `<p class="em">${empty}</p>`;
}
const dz = (k, label, cur) => `<div><b>${label}</b><label class="dz ${cur ? 'has' : ''}" data-k="${k}"><input type="file" hidden accept=".pdf,.jpg,.jpeg,.png"><span class="pv">${cur ? (cur.type.startsWith('image') ? `<img src="${cur.data}" alt="">` : '📄') : '☁️'}</span><span>Tarik &amp; lepas atau klik untuk memilih</span><small>${cur ? esc(cur.name) : 'PDF, JPG, PNG. Maksimal 1,5 MB'}</small></label></div>`;

const V = {};
V.home = () => {
  const l = mine(), r = me.role;
  const c = {
    admin: [st(S.pend.length, 'Total penduduk'), st(cnt(l, ['adm']), 'Perlu diverifikasi'), st(cnt(l, ['kd']), 'Menunggu tanda tangan'), st(cnt(l, ['ok']), 'Surat selesai')],
    penduduk: [st(l.length, 'Total pengajuan'), st(cnt(l, ['rt', 'adm', 'kd']), 'Sedang diproses'), st(cnt(l, ['ok']), 'Selesai'), st(cnt(l, ['no']), 'Ditolak')],
    kades: [st(cnt(l, ['kd']), 'Menunggu tanda tangan'), st(cnt(l, ['ok']), 'Sudah ditandatangani'), st(cnt(l, ['no']), 'Ditolak'), st(S.pend.length, 'Jumlah penduduk')],
    rt: [st(cnt(l, ['rt']), 'Menunggu verifikasi'), st(S.pend.filter(p => p.rt === me.rt).length, 'Warga RT ' + me.rt), st(l.length, 'Total pengajuan'), st(cnt(l, ['no']), 'Ditolak')]
  }[r];
  const d = { admin: 'Kelola data penduduk dan proses pengajuan yang sudah disetujui RT/RW.', penduduk: 'Ajukan surat, unggah KTP/KK, dan pantau statusnya.', kades: 'Tinjau dan tandatangani surat yang sudah diverifikasi admin.', rt: 'Verifikasi pengajuan warga di wilayah RT Anda.' }[r];
  return `<div class="hi"><h2>Selamat datang, ${esc(me.nama)}</h2><p>${d}</p></div><div class="sg">${c.join('')}</div>
  <div class="cd"><h3>Alur pengajuan</h3><div class="flow"><span>Penduduk</span>›<span>Ketua RT/RW</span>›<span>Admin Desa</span>›<span>Kepala Desa</span>›<span>Surat selesai</span></div></div>
  <div class="cd"><h3>Aktivitas terbaru</h3>${tPeng(l.slice(-6).reverse())}</div>`;
};
V['penduduk.riwayat'] = () => `<div class="cd">${tPeng(mine().slice().reverse(), 'Belum ada pengajuan. Buat di menu Ajukan Surat.')}</div>`;
V['rt.ver'] = () => `<div class="cd">${tPeng(mine().filter(p => p.status === 'rt'), 'Tidak ada pengajuan yang menunggu verifikasi.')}</div>`;
V['kades.ttd'] = () => `<div class="cd">${tPeng(S.peng.filter(p => p.status === 'kd'), 'Tidak ada surat yang menunggu tanda tangan.')}</div>`;
V['admin.arsip'] = V['kades.arsip'] = () => `<div class="cd">${tPeng(S.peng.filter(p => p.status === 'ok'), 'Belum ada surat selesai.')}</div>`;
const filP = () => S.peng.filter(p => !q || p.status === q).slice().reverse();
V['admin.peng'] = () => `<div class="bar"><select id="fs"><option value="">Semua status</option>${Object.entries(ST).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select></div><div class="cd" id="tp">${tPeng(filP())}</div>`;
V['rt.warga'] = () => `<div class="cd"><div class="tw"><table><thead><tr><th>NIK</th><th>Nama</th><th>Alamat</th><th>RT/RW</th><th>HP</th></tr></thead><tbody>${S.pend.filter(p => p.rt === me.rt).map(p => `<tr><td>${p.nik}</td><td>${esc(p.nama)}</td><td>${esc(p.alamat)}</td><td>${p.rt}/${p.rw}</td><td>${esc(p.hp)}</td></tr>`).join('')}</tbody></table></div></div>`;

/* Data penduduk (admin) */
const tPend = () => {
  const l = S.pend.filter(p => !q || (p.nama + p.nik).toLowerCase().includes(q.toLowerCase()));
  return l.length ? `<div class="tw"><table><thead><tr><th>NIK</th><th>Nama</th><th>Alamat</th><th>RT/RW</th><th>KTP</th><th>KK</th><th>Aksi</th></tr></thead><tbody>${l.map(p =>
    `<tr><td>${p.nik}</td><td>${esc(p.nama)}</td><td>${esc(p.alamat)}</td><td>${p.rt}/${p.rw}</td><td>${p.docs?.ktp ? `<a href="#" data-act="bukaDoc" data-id="${p.nik}" data-k="ktp">Lihat</a>` : '-'}</td><td>${p.docs?.kk ? `<a href="#" data-act="bukaDoc" data-id="${p.nik}" data-k="kk">Lihat</a>` : '-'}</td>
    <td><button class="b sm" data-act="fPend" data-id="${p.nik}">Ubah</button> <button class="b sm dng" data-act="hPend" data-id="${p.nik}">Hapus</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="em">Data tidak ditemukan.</p>';
};
V['admin.pend'] = () => `<div class="bar"><input id="q" type="search" placeholder="Cari NIK atau nama..."><button class="b pri" data-act="fPend" data-id="">+ Tambah penduduk</button></div><div class="cd" id="tb">${tPend()}</div>`;

/* Penduduk: ajukan + profil */
V['penduduk.ajuan'] = () => `<div class="cd"><h3>Form pengajuan surat</h3>
  <div class="fg"><label>Jenis surat<select id="aj">${JS.map(j => `<option>${j}</option>`).join('')}</select></label><label>Pemohon<input value="${esc(me.nama)} (${me.nik})" disabled></label>
  <label class="w">Keperluan<textarea id="ap" rows="3" placeholder="Contoh: persyaratan pembukaan rekening bank"></textarea></label></div>
  <div class="ug">${dz('ktp', 'Foto KTP *', tmp.ktp || me.docs?.ktp)}${dz('kk', 'Kartu Keluarga (KK) *', tmp.kk || me.docs?.kk)}${dz('pdf', 'Surat pengantar / pendukung (PDF atau gambar)', tmp.pdf)}</div>
  <button class="b pri" data-act="kirim">Kirim pengajuan</button></div>`;
V['penduduk.profil'] = () => `<div class="cd"><h3>Data diri</h3><dl class="kv"><dt>NIK</dt><dd>${me.nik}</dd><dt>Nama</dt><dd>${esc(me.nama)}</dd><dt>Tempat, tgl lahir</dt><dd>${esc(me.tl)}</dd><dt>Alamat</dt><dd>${esc(me.alamat)} RT ${me.rt}/RW ${me.rw}</dd><dt>No. HP</dt><dd>${esc(me.hp)}</dd></dl>
  <h3>Dokumen tersimpan</h3><p class="mu">Dokumen ini dipakai otomatis saat mengajukan surat.</p><div class="ug">${dz('ktp', 'Foto KTP', tmp.ktp || me.docs?.ktp)}${dz('kk', 'Kartu Keluarga (KK)', tmp.kk || me.docs?.kk)}</div><button class="b pri" data-act="simpanDoc">Simpan dokumen</button></div>`;

/* ===== Upload ===== */
function readF(f) {
  return new Promise((ok, no) => {
    if (!OKT.includes(f.type)) return no('Format harus PDF, JPG, atau PNG');
    if (f.size > MAXB) return no('Ukuran file maksimal 1,5 MB');
    const r = new FileReader(); r.onload = () => ok({ name: f.name, type: f.type, size: f.size, data: r.result }); r.readAsDataURL(f);
  });
}
function bindDZ(root) {
  $$('.dz', root).forEach(z => {
    const i = $('input', z), k = z.dataset.k;
    const go = async f => {
      if (!f) return;
      try { tmp[k] = await readF(f); $('.pv', z).innerHTML = tmp[k].type.startsWith('image') ? `<img src="${tmp[k].data}" alt="">` : '📄'; $('small', z).textContent = `${tmp[k].name} (${(f.size / 1048576).toFixed(2)} MB)`; z.classList.add('has'); }
      catch (m) { toast(m); }
    };
    i.onchange = () => go(i.files[0]);
    ['dragenter', 'dragover'].forEach(ev => z.addEventListener(ev, e => { e.preventDefault(); z.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => z.addEventListener(ev, e => { e.preventDefault(); z.classList.remove('over'); }));
    z.addEventListener('drop', e => go(e.dataTransfer.files[0]));
  });
}
function bukaFile(f) { const w = window.open('about:blank'); fetch(f.data).then(r => r.blob()).then(b => { if (w) w.location = URL.createObjectURL(b); }); }

/* ===== Modal ===== */
const openM = h => { $('#mc').innerHTML = h; $('#modal').hidden = false; bindDZ($('#mc')); };
const closeM = () => { $('#modal').hidden = true; };
const val = id => $('#' + id)?.value.trim();
function lihat(id) {
  const p = S.peng.find(x => x.id == id); tmp = {};
  const can = { rt: p.status === 'rt' && me.role === 'rt', admin: p.status === 'adm' && me.role === 'admin', kades: p.status === 'kd' && me.role === 'kades' }[me.role];
  const lbl = { rt: 'Setujui pengantar', admin: 'Verifikasi & teruskan ke Kades', kades: 'Tanda tangani surat' }[me.role];
  openM(`<h3>Pengajuan #${p.id}: ${esc(p.jenis)}</h3>
  <dl class="kv"><dt>Pemohon</dt><dd>${esc(p.nama)} (${p.nik})</dd><dt>RT</dt><dd>${p.rt}</dd><dt>Keperluan</dt><dd>${esc(p.perlu)}</dd><dt>Tanggal</dt><dd>${p.tgl}</dd><dt>Status</dt><dd>${bdg(p.status)}</dd>${p.noSurat ? `<dt>Nomor surat</dt><dd>${p.noSurat}</dd>` : ''}${p.cat ? `<dt>Catatan</dt><dd>${esc(p.cat)}</dd>` : ''}</dl>
  <b>Lampiran</b><ul class="fl">${p.files.map((f, i) => `<li><span>${f.label}: ${esc(f.name)}</span><button class="b sm" data-act="buka" data-id="${p.id}" data-k="${i}">Buka</button></li>`).join('') || '<li>Tidak ada lampiran</li>'}</ul>
  <b>Riwayat</b><ul class="tl">${p.log.map(l => `<li><small>${l.t}</small>${esc(l.x)}</li>`).join('')}</ul>
  ${can ? `<label>Catatan / alasan penolakan<textarea id="cat" rows="2"></textarea></label><div class="acts"><button class="b pri" data-act="dec" data-id="${p.id}" data-k="1">${lbl}</button><button class="b dng" data-act="dec" data-id="${p.id}" data-k="0">Tolak</button></div>` : ''}
  ${me.role === 'admin' && p.status !== 'no' ? `<div class="ug">${dz('surat', 'Unggah surat resmi (PDF)', p.suratPdf)}</div><button class="b" data-act="simpanSurat" data-id="${p.id}">Simpan surat PDF</button>` : ''}
  ${p.status === 'ok' ? `<div class="acts"><button class="b pri" data-act="cetak" data-id="${p.id}">Cetak surat</button>${p.suratPdf ? `<button class="b" data-act="buka" data-id="${p.id}" data-k="sp">Buka surat PDF</button>` : ''}</div>` : ''}`);
}
function fPend(nik) {
  const d = S.pend.find(x => x.nik === nik) || { jk: 'Laki-laki', rt: '01', rw: '01' };
  openM(`<h3>${nik ? 'Ubah' : 'Tambah'} data penduduk</h3><div class="fg">
  <label>NIK<input id="f_nik" maxlength="16" value="${d.nik || ''}" ${nik ? 'disabled' : ''}></label><label>Nama lengkap<input id="f_nama" value="${esc(d.nama)}"></label>
  <label>Tempat, tanggal lahir<input id="f_tl" value="${esc(d.tl)}"></label><label>Jenis kelamin<select id="f_jk"><option ${d.jk === 'Laki-laki' ? 'selected' : ''}>Laki-laki</option><option ${d.jk === 'Perempuan' ? 'selected' : ''}>Perempuan</option></select></label>
  <label class="w">Alamat<input id="f_alamat" value="${esc(d.alamat)}"></label><label>RT<input id="f_rt" maxlength="2" value="${d.rt}"></label><label>RW<input id="f_rw" maxlength="2" value="${d.rw}"></label>
  <label>No. HP<input id="f_hp" value="${esc(d.hp)}"></label>${nik ? '' : '<label>Kata sandi awal<input id="f_pw" value="123456"></label>'}</div>
  <div class="acts"><button class="b pri" data-act="sPend" data-id="${nik}">Simpan</button></div>`);
}
function fReg() {
  openM(`<h3>Pendaftaran akun penduduk</h3><div class="fg"><label>NIK<input id="f_nik" maxlength="16"></label><label>Nama lengkap<input id="f_nama"></label>
  <label class="w">Alamat<input id="f_alamat"></label><label>RT<input id="f_rt" maxlength="2" placeholder="01"></label><label>RW<input id="f_rw" maxlength="2" placeholder="01"></label>
  <label>No. HP<input id="f_hp"></label><label>Kata sandi<input id="f_pw" type="password"></label></div><div class="acts"><button class="b pri" data-act="sReg">Daftar</button></div>`);
}
function cetak(id) {
  const p = S.peng.find(x => x.id == id), d = S.pend.find(x => x.nik === p.nik) || {};
  const w = window.open('', '_blank'); if (!w) return toast('Izinkan pop-up untuk mencetak');
  w.document.write(`<html><head><title>${p.noSurat}</title><style>body{font:14px/1.6 "Times New Roman",serif;padding:40px 64px}.k{text-align:center;border-bottom:3px double #000;padding-bottom:8px;margin-bottom:18px}h2,h3,p{margin:0}td{padding:2px 8px;vertical-align:top}.t{margin:30px 0 0 55%;text-align:center}.q{border:1px dashed #555;padding:6px;font:11px Arial;margin:8px 0}</style></head><body>
  <div class="k"><h3>PEMERINTAH DESA MENGKALANG</h3><h2>KANTOR KEPALA DESA</h2></div>
  <p style="text-align:center"><u><b>${esc(p.jenis.toUpperCase())}</b></u><br>Nomor: ${p.noSurat}</p><br>
  <p>Yang bertanda tangan di bawah ini Kepala Desa Mengkalang menerangkan bahwa:</p>
  <table><tr><td>Nama</td><td>: ${esc(p.nama)}</td></tr><tr><td>NIK</td><td>: ${p.nik}</td></tr><tr><td>Tempat, tgl lahir</td><td>: ${esc(d.tl)}</td></tr><tr><td>Alamat</td><td>: ${esc(d.alamat)} RT ${p.rt}/RW ${d.rw || '01'}</td></tr></table>
  <p>Benar warga desa ini. Surat diberikan untuk keperluan: <b>${esc(p.perlu)}</b>.</p><p>Demikian surat ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
  <div class="t">Mengkalang, ${p.ttd.at}<br>Kepala Desa<div class="q">Ditandatangani secara elektronik<br>${p.noSurat}</div><b><u>${esc(p.ttd.by)}</u></b></div></body></html>`);
  w.document.close(); setTimeout(() => w.print(), 400);
}

/* ===== Aksi ===== */
const A = {
  nav: id => { page = id; tmp = {}; q = ''; render(); },
  out: () => { me = null; $('#app').hidden = true; $('#login').hidden = false; $('#lp').value = ''; closeM(); },
  tutup: closeM, reg: fReg, lihat, fPend, cetak,
  buka: (id, b) => { const p = S.peng.find(x => x.id == id), f = b.dataset.k === 'sp' ? p.suratPdf : p.files[+b.dataset.k]; bukaFile(f); },
  bukaDoc: (nik, b) => bukaFile(S.pend.find(x => x.nik === nik).docs[b.dataset.k]),
  hPend: nik => { const d = S.pend.find(x => x.nik === nik); if (confirm(`Hapus data ${d.nama}?`)) { S.pend.splice(S.pend.indexOf(d), 1); save(); $('#tb').innerHTML = tPend(); toast('Data dihapus'); } },
  sPend: (nik) => {
    const v = { nama: val('f_nama'), tl: val('f_tl'), jk: val('f_jk'), alamat: val('f_alamat'), rt: val('f_rt'), rw: val('f_rw'), hp: val('f_hp') };
    if (!v.nama || !v.alamat) return toast('Nama dan alamat wajib diisi');
    if (nik) Object.assign(S.pend.find(x => x.nik === nik), v);
    else {
      const n = val('f_nik'); if (!/^\d{16}$/.test(n)) return toast('NIK harus 16 digit angka');
      if (S.pend.some(x => x.nik === n)) return toast('NIK sudah terdaftar');
      S.pend.push({ nik: n, ...v, status: 'Aktif', pw: val('f_pw') || '123456', docs: {} });
    }
    save(); closeM(); render(); toast('Data tersimpan');
  },
  sReg: () => {
    const n = val('f_nik'), nama = val('f_nama'), pw = val('f_pw');
    if (!/^\d{16}$/.test(n)) return toast('NIK harus 16 digit angka');
    if (!nama || !val('f_alamat') || !pw || !val('f_rt')) return toast('Lengkapi semua data');
    if (S.pend.some(x => x.nik === n)) return toast('NIK sudah terdaftar');
    S.pend.push({ nik: n, nama, tl: '-', jk: '-', alamat: val('f_alamat'), rt: val('f_rt').padStart(2, '0'), rw: (val('f_rw') || '01').padStart(2, '0'), hp: val('f_hp'), status: 'Aktif', pw, docs: {} });
    save(); closeM(); $('#lu').value = n; toast('Akun dibuat. Silakan masuk.');
  },
  simpanDoc: () => { me.docs = me.docs || {}; ['ktp', 'kk'].forEach(k => { if (tmp[k]) me.docs[k] = tmp[k]; }); save(); toast('Dokumen tersimpan'); render(); },
  kirim: () => {
    const ktp = tmp.ktp || me.docs?.ktp, kk = tmp.kk || me.docs?.kk, perlu = val('ap');
    if (!perlu) return toast('Isi keperluan surat');
    if (!ktp || !kk) return toast('Foto KTP dan KK wajib diunggah');
    const files = [{ label: 'KTP', ...ktp }, { label: 'KK', ...kk }]; if (tmp.pdf) files.push({ label: 'Pendukung', ...tmp.pdf });
    const id = Math.max(0, ...S.peng.map(x => x.id)) + 1;
    S.peng.push({ id, nik: me.nik, nama: me.nama, rt: me.rt, jenis: val('aj'), perlu, tgl: today(), status: 'rt', files, cat: '', log: [{ t: today(), x: 'Pengajuan dibuat oleh warga' }] });
    save(); tmp = {}; page = 'riwayat'; render(); toast('Pengajuan terkirim ke Ketua RT/RW');
  },
  dec: (id, b) => {
    const p = S.peng.find(x => x.id == id), ok = b.dataset.k === '1', c = val('cat') || '';
    if (!ok && !c) return toast('Isi alasan penolakan');
    const w = { rt: ['RT/RW', 'adm'], admin: ['Admin Desa', 'kd'], kades: ['Kepala Desa', 'ok'] }[me.role];
    if (!ok) { p.status = 'no'; p.cat = c; L(p, `Ditolak ${w[0]}: ${c}`); }
    else {
      p.status = w[1]; if (c) p.cat = c; L(p, `Disetujui ${w[0]}${p.status === 'ok' ? ' dan ditandatangani' : ''}`);
      if (p.status === 'ok') { p.noSurat = `${String(++S.n).padStart(3, '0')}/DS-MKL/${new Date().getFullYear()}`; p.ttd = { by: me.nama, at: today() }; }
    }
    save(); closeM(); render(); toast(ok ? 'Berhasil diproses' : 'Pengajuan ditolak');
  },
  simpanSurat: id => { if (!tmp.surat) return toast('Pilih file surat terlebih dahulu'); S.peng.find(x => x.id == id).suratPdf = tmp.surat; save(); toast('Surat PDF tersimpan'); closeM(); }
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  e.preventDefault(); A[b.dataset.act]?.(b.dataset.id, b);
});
document.addEventListener('input', e => { if (e.target.id === 'q') { q = e.target.value; $('#tb').innerHTML = tPend(); } });
document.addEventListener('change', e => { if (e.target.id === 'fs') { q = e.target.value; $('#tp').innerHTML = tPeng(filP()); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeM(); });
setRole('penduduk');