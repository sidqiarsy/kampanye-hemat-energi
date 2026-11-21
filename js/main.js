/**
 * VOLTIA - MAIN APPLICATION LOGIC
 * Mengatur Navigasi Halaman (SPA), Visualisasi Chart.js dengan Palet Warna Baru:
 * #15370D (Forest Green), #728E6D (Sage), #E5CD82 (Gold), #FFF2B4 (Cream),
 * Filter Grafik, Tantangan 7 Hari, dan Generator Tips Harian.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ----------------------------------------------------
  // 1. DATA INITIALIZATION & FALLBACK
  // ----------------------------------------------------
  let dataKuesioner = null;

  async function muatDataKuesioner() {
    try {
      const response = await fetch('./data/data-perilaku-energi.json');
      if (!response.ok) throw new Error('Fetch lokal dibatasi browser');
      dataKuesioner = await response.json();
    } catch (e) {
      console.warn('Menggunakan data cadangan DATA_ENERGI:', e);
      if (typeof DATA_ENERGI !== 'undefined') {
        dataKuesioner = DATA_ENERGI;
      }
    }

    if (dataKuesioner) {
      inisialisasiKPI();
      inisialisasiTabelButir();
      inisialisasiTabelRombel();
      inisialisasiGrafik();
    } else {
      console.error('Data kuesioner tidak dapat dimuat.');
    }
  }

  // ----------------------------------------------------
  // 2. NAVIGASI HALAMAN (SPA)
  // ----------------------------------------------------
  const pages = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('.nav-link');
  const menubarNav = document.getElementById('menubarNav');
  const hamburgerBtn = document.getElementById('hamburgerBtn');

  function navigateToPage(pageId, tabTarget = null) {
    pages.forEach(page => {
      page.classList.toggle('active', page.id === pageId);
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.page === pageId);
    });

    // Tutup menu mobile jika sedang terbuka
    if (menubarNav) {
      menubarNav.classList.remove('open');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Handle filter tab pada halaman data
    if (pageId === 'data' && tabTarget) {
      setTimeout(() => {
        const targetBtn = document.querySelector(`.retro-tab-btn[data-filter="${tabTarget}"]`);
        if (targetBtn) targetBtn.click();
      }, 150);
    }
  }

  // Event listener untuk semua link navigasi
  document.querySelectorAll('a.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const pageTarget = this.dataset.page;
      const tabTarget = this.dataset.tab;
      const scrollTarget = this.dataset.scroll;
      if (pageTarget) {
        navigateToPage(pageTarget, tabTarget);
        if (scrollTarget) {
          setTimeout(() => {
            const targetEl = document.getElementById(scrollTarget);
            if (targetEl) {
              targetEl.scrollIntoView({ behavior: 'smooth' });
            }
          }, 150);
        }
      }
    });
  });

  // Hamburger menu mobile
  if (hamburgerBtn && menubarNav) {
    hamburgerBtn.addEventListener('click', () => {
      menubarNav.classList.toggle('open');
    });
  }

  // Klik logo kembali ke beranda
  const logoIcon = document.getElementById('logoIcon');
  if (logoIcon) {
    logoIcon.addEventListener('click', () => navigateToPage('home'));
  }

  // ----------------------------------------------------
  // 3. RINGKASAN DATA KARTU KPI
  // ----------------------------------------------------
  function inisialisasiKPI() {
    if (!dataKuesioner) return;
    const { ringkasan, meta } = dataKuesioner;

    const elRataRata = document.getElementById('kpiRataRata');
    const elResponden = document.getElementById('kpiResponden');
    const elTertinggi = document.getElementById('kpiTertinggi');
    const elKategori = document.getElementById('kpiKategori');

    if (elRataRata) elRataRata.textContent = ringkasan.rata_rata_skor.toFixed(2);
    if (elResponden) elResponden.textContent = meta.jumlah_responden;
    if (elTertinggi && ringkasan.sorotan.butir_tertinggi[0]) {
      const top = ringkasan.sorotan.butir_tertinggi[0];
      elTertinggi.textContent = `${top.kode} (${top.rata_rata.toFixed(2)})`;
    }
    if (elKategori && ringkasan.kategori_persen) {
      elKategori.textContent = `${ringkasan.kategori_persen['Sangat Baik']}%`;
    }
  }

  // ----------------------------------------------------
  // 4. CHART.JS DENGAN PALET WARNA BARU
  // #15370D (Forest), #728E6D (Sage), #E5CD82 (Gold), #FFF2B4 (Cream)
  // ----------------------------------------------------
  let chartInstances = {};

  function inisialisasiGrafik() {
    if (!dataKuesioner || typeof Chart === 'undefined') return;

    // Default font dan warna teks Chart.js
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    Chart.defaults.color = '#15370D';
    Chart.defaults.borderColor = '#d4dec9';

    renderChartButir();
    renderChartKategori();
    renderChartJurusan();
    renderChartGayaBelajar();
    renderChartSebaranSkor();
  }

  // GRAFIK 1: 10 Kebiasaan Harian Siswa (Bar Horizontal)
  function renderChartButir() {
    const ctx = document.getElementById('chartButir');
    if (!ctx) return;

    const items = dataKuesioner.per_butir;
    const labels = items.map(item => `${item.kode}: ${item.label}`);
    const dataValues = items.map(item => item.rata_rata);

    // Palet warna ramah
    const backgroundColors = dataValues.map(val => {
      if (val >= 3.45) return '#15370D'; // Sangat Rajin (Forest Green)
      if (val <= 3.25) return '#E5CD82'; // Perlu Ditingkatkan (Warm Gold)
      return '#728E6D'; // Sudah Baik (Sage Green)
    });

    if (chartInstances.chartButir) chartInstances.chartButir.destroy();

    chartInstances.chartButir = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Nilai Rata-Rata (Skala 1 - 4)',
          data: dataValues,
          backgroundColor: backgroundColors,
          borderColor: '#15370D',
          borderWidth: 2,
          borderRadius: 0,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#15370D',
            titleColor: '#FFF2B4',
            bodyColor: '#ffffff',
            titleFont: { family: 'Courier New', weight: 'bold' },
            bodyFont: { family: 'Courier New' },
            padding: 10,
            borderColor: '#E5CD82',
            borderWidth: 1.5,
            callbacks: {
              afterLabel: function(context) {
                const item = items[context.dataIndex];
                return `Siswa yang Sering: ${item.persen_sering}% | Jarang: ${item.persen_jarang}%`;
              }
            }
          }
        },
        scales: {
          x: {
            min: 2.8,
            max: 4.0,
            grid: { color: '#e8eedf' },
            ticks: {
              stepSize: 0.2,
              font: { weight: 'bold' }
            },
            title: {
              display: true,
              text: 'Skor Rata-Rata (Makin tinggi, makin rajin hemat listrik)',
              font: { weight: 'bold' }
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              font: { weight: '600' }
            }
          }
        }
      }
    });
  }

  // GRAFIK 2: Kategori Siswa (Doughnut Chart)
  function renderChartKategori() {
    const ctx = document.getElementById('chartKategori');
    if (!ctx) return;

    const kategoriData = dataKuesioner.ringkasan.kategori;
    const labels = [
      'Sangat Baik (59.4%)',
      'Baik (36.8%)',
      'Cukup (3.6%)',
      'Perlu Perhatian (0.2%)'
    ];
    const dataValues = [
      kategoriData['Sangat Baik'],
      kategoriData['Baik'],
      kategoriData['Cukup'],
      kategoriData['Kurang']
    ];

    if (chartInstances.chartKategori) chartInstances.chartKategori.destroy();

    chartInstances.chartKategori = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: [
            '#15370D', // Sangat Baik (Forest Green)
            '#728E6D', // Baik (Sage Green)
            '#E5CD82', // Cukup (Warm Gold)
            '#c8553d'  // Kurang / Perhatian (Terracotta Accent)
          ],
          borderColor: '#15370D',
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { weight: 'bold' },
              padding: 14,
              boxWidth: 16
            }
          },
          tooltip: {
            backgroundColor: '#15370D',
            titleColor: '#FFF2B4',
            padding: 10,
            callbacks: {
              label: function(context) {
                const total = 636;
                const pct = ((context.parsed / total) * 100).toFixed(1);
                return ` ${context.label}: ${context.parsed} siswa (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  // GRAFIK 3: Nilai Rata-Rata Tiap Jurusan (Bar Chart)
  function renderChartJurusan() {
    const ctx = document.getElementById('chartJurusan');
    if (!ctx) return;

    const jurusanList = dataKuesioner.per_jurusan;
    const labels = jurusanList.map(j => `${j.kode}`);
    const dataValues = jurusanList.map(j => j.rata_rata_skor);

    if (chartInstances.chartJurusan) chartInstances.chartJurusan.destroy();

    chartInstances.chartJurusan = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Nilai Rata-Rata',
          data: dataValues,
          backgroundColor: labels.map(kode => {
            if (kode === 'PMN') return '#15370D'; // Paling Rajin
            if (kode === 'PPLG' || kode === 'MPLB') return '#E5CD82'; // Perlu Ditingkatkan
            return '#728E6D'; // Baik
          }),
          borderColor: '#15370D',
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#15370D',
            titleColor: '#FFF2B4',
            padding: 10,
            callbacks: {
              title: function(context) {
                const j = jurusanList[context[0].dataIndex];
                return `${j.kode} - ${j.nama}`;
              },
              afterLabel: function(context) {
                const j = jurusanList[context.dataIndex];
                return `Total Responden: ${j.jumlah_responden} siswa | Nilai: ${j.rata_rata_skor.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          y: {
            min: 3.0,
            max: 3.7,
            grid: { color: '#e8eedf' },
            ticks: { stepSize: 0.1, font: { weight: 'bold' } },
            title: { display: true, text: 'Nilai Rata-Rata (Skala 1 - 4)', font: { weight: 'bold' } }
          },
          x: {
            grid: { display: false },
            ticks: { font: { weight: 'bold' } }
          }
        }
      }
    });
  }

  // GRAFIK 4: Berdasarkan Cara Belajar Siswa (Bar Chart)
  function renderChartGayaBelajar() {
    const ctx = document.getElementById('chartGayaBelajar');
    if (!ctx) return;

    const belajarList = dataKuesioner.per_gaya_belajar;
    const labels = belajarList.map(g => {
      if (g.gaya_belajar === 'Kinestetik') return 'Praktik Langsung (201)';
      if (g.gaya_belajar === 'Auditori') return 'Mendengarkan (145)';
      return 'Melihat / Visual (289)';
    });
    const dataValues = belajarList.map(g => g.rata_rata_skor);

    if (chartInstances.chartGayaBelajar) chartInstances.chartGayaBelajar.destroy();

    chartInstances.chartGayaBelajar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Nilai Rata-Rata',
          data: dataValues,
          backgroundColor: ['#15370D', '#728E6D', '#E5CD82'],
          borderColor: '#15370D',
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#15370D',
            titleColor: '#FFF2B4',
            padding: 10,
            callbacks: {
              afterLabel: function(context) {
                const g = belajarList[context.dataIndex];
                return `Kategori Sangat Baik: ${g.kategori_persen['Sangat Baik']}% siswa`;
              }
            }
          }
        },
        scales: {
          y: {
            min: 3.2,
            max: 3.5,
            ticks: { stepSize: 0.05, font: { weight: 'bold' } },
            title: { display: true, text: 'Nilai Rata-Rata', font: { weight: 'bold' } }
          },
          x: {
            grid: { display: false },
            ticks: { font: { weight: 'bold' } }
          }
        }
      }
    });
  }

  // GRAFIK 5: Sebaran Nilai Siswa (Histogram)
  function renderChartSebaranSkor() {
    const ctx = document.getElementById('chartSebaranSkor');
    if (!ctx) return;

    const sebaran = dataKuesioner.sebaran_skor_total;
    const labels = sebaran.map(s => s.skor_total.toString());
    const dataValues = sebaran.map(s => s.jumlah);

    if (chartInstances.chartSebaranSkor) chartInstances.chartSebaranSkor.destroy();

    chartInstances.chartSebaranSkor = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Jumlah Siswa',
          data: dataValues,
          backgroundColor: labels.map(skor => (parseInt(skor) >= 35 ? '#15370D' : '#E5CD82')),
          borderColor: '#15370D',
          borderWidth: 1.5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#15370D',
            titleColor: '#FFF2B4',
            padding: 10,
            callbacks: {
              title: function(context) {
                return `Nilai Total: ${context[0].label} / 40`;
              },
              label: function(context) {
                return `Jumlah Siswa: ${context.parsed.y} orang`;
              }
            }
          }
        },
        scales: {
          y: {
            title: { display: true, text: 'Banyak Siswa (Orang)', font: { weight: 'bold' } },
            ticks: { font: { weight: 'bold' } }
          },
          x: {
            title: { display: true, text: 'Nilai Total Kuesioner (10 - 40)', font: { weight: 'bold' } },
            ticks: { font: { weight: 'bold' } }
          }
        }
      }
    });
  }

  // ----------------------------------------------------
  // 5. TABEL DATA 10 BUTIR & 18 ROMBEL
  // ----------------------------------------------------
  function inisialisasiTabelButir() {
    const tbody = document.getElementById('tabelButirBody');
    if (!tbody || !dataKuesioner) return;

    tbody.innerHTML = '';
    dataKuesioner.per_butir.forEach(b => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family:var(--font-mono); font-weight:800;">${b.kode}</td>
        <td><strong>${b.label}</strong><br><span style="font-size:0.85rem; color:#3d5a36;">"${b.pertanyaan}"</span></td>
        <td style="font-family:var(--font-mono); font-weight:800; font-size:1.05rem;">${b.rata_rata.toFixed(2)}</td>
        <td style="font-family:var(--font-mono); color:#15370D; font-weight:700;">${b.persen_sering}% Sering</td>
        <td style="font-family:var(--font-mono); color:#8d2214; font-weight:700;">${b.persen_jarang}% Jarang</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function inisialisasiTabelRombel() {
    const tbody = document.getElementById('tabelRombelBody');
    const filterInput = document.getElementById('filterRombelInput');
    if (!tbody || !dataKuesioner) return;

    function renderTabel(list) {
      tbody.innerHTML = '';
      list.forEach(r => {
        const tr = document.createElement('tr');
        const badgeBg = r.rata_rata_skor >= 3.40 ? '#E5CD82' : '#FFF2B4';
        tr.innerHTML = `
          <td style="font-family:var(--font-mono); font-weight:800;">${r.rombel}</td>
          <td>${r.jurusan}</td>
          <td style="font-family:var(--font-mono);">${r.jumlah_responden} siswa</td>
          <td style="font-family:var(--font-mono); font-weight:800;">${r.rata_rata_skor.toFixed(2)}</td>
          <td style="font-family:var(--font-mono);">${r.rata_rata_total.toFixed(2)}</td>
          <td style="font-family:var(--font-mono); font-weight:700;">${r.kategori_persen['Sangat Baik']}%</td>
          <td><span style="background:${badgeBg}; border:1px solid #15370D; padding:2px 8px; font-size:0.75rem; font-family:var(--font-mono); font-weight:700;">Sangat Baik: ${r.kategori['Sangat Baik']}</span></td>
        `;
        tbody.appendChild(tr);
      });
    }

    renderTabel(dataKuesioner.per_rombel);

    if (filterInput) {
      filterInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = dataKuesioner.per_rombel.filter(r => 
          r.rombel.toLowerCase().includes(query) || r.jurusan.toLowerCase().includes(query)
        );
        renderTabel(filtered);
      });
    }
  }

  // ----------------------------------------------------
  // 6. FILTER TAB GRAFIK DI HALAMAN DATA
  // ----------------------------------------------------
  const tabButtons = document.querySelectorAll('.retro-tab-btn');
  const cardButir = document.getElementById('cardButir');
  const cardKategori = document.getElementById('cardKategori');
  const cardJurusan = document.getElementById('cardJurusan');
  const cardBelajar = document.getElementById('cardBelajar');
  const cardSebaran = document.getElementById('cardSebaran');
  const cardTabel = document.getElementById('cardTabel');
  const gridKategoriJurusan = document.getElementById('gridKategoriJurusan');
  const gridBelajarSebaran = document.getElementById('gridBelajarSebaran');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      tabButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      const filter = this.dataset.filter;

      [cardButir, cardKategori, cardJurusan, cardBelajar, cardSebaran, cardTabel].forEach(el => {
        if (el) el.style.display = 'block';
      });
      if (gridKategoriJurusan) gridKategoriJurusan.style.display = 'grid';
      if (gridBelajarSebaran) gridBelajarSebaran.style.display = 'grid';

      if (filter === 'all') {
        // Tampilkan semua
      } else if (filter === 'butir') {
        [cardKategori, cardJurusan, cardBelajar, cardSebaran, cardTabel].forEach(el => el && (el.style.display = 'none'));
        if (gridKategoriJurusan) gridKategoriJurusan.style.display = 'none';
        if (gridBelajarSebaran) gridBelajarSebaran.style.display = 'none';
      } else if (filter === 'kategori') {
        [cardButir, cardJurusan, cardBelajar, cardTabel].forEach(el => el && (el.style.display = 'none'));
        if (gridKategoriJurusan) gridKategoriJurusan.style.display = 'block';
        if (gridBelajarSebaran) gridBelajarSebaran.style.display = 'block';
        if (cardJurusan) cardJurusan.style.display = 'none';
        if (cardBelajar) cardBelajar.style.display = 'none';
      } else if (filter === 'jurusan') {
        [cardButir, cardKategori, cardBelajar, cardSebaran, cardTabel].forEach(el => el && (el.style.display = 'none'));
        if (gridKategoriJurusan) gridKategoriJurusan.style.display = 'block';
        if (gridBelajarSebaran) gridBelajarSebaran.style.display = 'none';
        if (cardKategori) cardKategori.style.display = 'none';
      } else if (filter === 'belajar') {
        [cardButir, cardKategori, cardJurusan, cardSebaran, cardTabel].forEach(el => el && (el.style.display = 'none'));
        if (gridKategoriJurusan) gridKategoriJurusan.style.display = 'none';
        if (gridBelajarSebaran) gridBelajarSebaran.style.display = 'block';
        if (cardSebaran) cardSebaran.style.display = 'none';
      } else if (filter === 'tabel') {
        [cardButir, cardKategori, cardJurusan, cardBelajar, cardSebaran].forEach(el => el && (el.style.display = 'none'));
        if (gridKategoriJurusan) gridKategoriJurusan.style.display = 'none';
        if (gridBelajarSebaran) gridBelajarSebaran.style.display = 'none';
      }

      window.dispatchEvent(new Event('resize'));
    });
  });

  // ----------------------------------------------------
  // 7. TANTANGAN 7 HARI HEMAT ENERGI (INTERAKTIF)
  // ----------------------------------------------------
  const challengeItems = document.querySelectorAll('.challenge-item');
  const progressFill = document.getElementById('challengeProgressFill');
  const progressText = document.getElementById('challengeProgressText');
  const rewardBox = document.getElementById('challengeRewardBox');

  let completedChallenges = new Set();

  try {
    const saved = localStorage.getItem('voltia_completed_challenges');
    if (saved) {
      completedChallenges = new Set(JSON.parse(saved));
    }
  } catch (e) {}

  function updateChallengeUI() {
    let count = 0;
    challengeItems.forEach(item => {
      const idx = item.dataset.index;
      const isDone = completedChallenges.has(idx);
      item.classList.toggle('completed', isDone);
      const checkbox = item.querySelector('.custom-checkbox');
      if (checkbox) checkbox.textContent = isDone ? '✓' : '';
      if (isDone) count++;
    });

    const percent = Math.round((count / challengeItems.length) * 100);
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressText) {
      let level = 'PEMULA';
      if (percent >= 100) level = 'JUARA HEMAT ENERGI ⭐';
      else if (percent >= 50) level = 'SAHABAT ENERGI ⚡';
      else if (percent > 0) level = 'MULAI BERAKSI 🌱';
      progressText.textContent = `${count} / ${challengeItems.length} HARI (${percent}%) - ${level}`;
    }

    if (rewardBox) {
      rewardBox.style.display = count === challengeItems.length ? 'block' : 'none';
    }

    try {
      localStorage.setItem('voltia_completed_challenges', JSON.stringify(Array.from(completedChallenges)));
    } catch (e) {}
  }

  challengeItems.forEach(item => {
    item.addEventListener('click', function() {
      const idx = this.dataset.index;
      if (completedChallenges.has(idx)) {
        completedChallenges.delete(idx);
      } else {
        completedChallenges.add(idx);
      }
      updateChallengeUI();
    });
  });

  updateChallengeUI();

  // ----------------------------------------------------
  // 8. GENERATOR TIPS HARIAN (BAHASA AWAM & PRAKTIS)
  // ----------------------------------------------------
  const daftarTips = [
    "Cabut charger laptop atau HP saat baterai sudah penuh. Charger yang tetap menancap tanpa alat ternyata tetap menyedot listrik tanpa kita sadari!",
    "Buka jendela dan tirai kelas saat pagi hari (jam 7 sampai 10). Cahaya matahari alami bikin kelas terang tanpa perlu menyalakan lampu.",
    "Pasang suhu remote AC ruangan di angka 24°C atau 25°C. Ruangan tetap sejuk nyaman, dan listrik bisa hemat sampai 18%.",
    "Turunkan kecerahan layar monitor laptopmu ke 60%. Selain menghemat baterai hingga 25%, matamu juga tidak cepat lelah saat belajar.",
    "Matikan layar komputer lab saat ditinggal istirahat. Hal sederhana ini sangat menghemat tagihan listrik sekolah.",
    "Jangan malu mengingatkan teman sekelas yang lupa mematikan saklar lampu atau kipas angin saat keluar kelas. Sampaikan dengan santai dan ramah!",
    "Untuk teman yang rumah atau kosnya dekat sekolah (< 800 meter), yuk biasakan jalan kaki santai. Sehat dan bebas emisi motor!",
    "Bila bepergian dengan tujuan searah, ajak teman satu rayon untuk berangkat bareng. Lebih seru dan hemat bensin!",
    "Sebelum bel pulang sekolah berbunyi, yuk luangkan 1 menit mengecek meja: pastikan stopkontak komputer dan lampu sudah padam total."
  ];

  const btnAcakTips = document.getElementById('btnAcakTips');
  const tipDisplay = document.getElementById('tipDisplay');

  if (btnAcakTips && tipDisplay) {
    btnAcakTips.addEventListener('click', () => {
      btnAcakTips.style.transform = 'scale(0.95)';
      setTimeout(() => btnAcakTips.style.transform = '', 100);

      const randomIndex = Math.floor(Math.random() * daftarTips.length);
      tipDisplay.style.opacity = 0;
      setTimeout(() => {
        tipDisplay.textContent = `"${daftarTips[randomIndex]}"`;
        tipDisplay.style.opacity = 1;
      }, 150);
    });
  }

  // ----------------------------------------------------
  // 9. IKRAR KOMITMEN DIGITAL SISWA
  // ----------------------------------------------------
  const btnSubmitPledge = document.getElementById('btnSubmitPledge');
  const pledgeName = document.getElementById('pledgeName');
  const pledgeRombel = document.getElementById('pledgeRombel');
  const pledgeAction = document.getElementById('pledgeAction');
  const pledgeResult = document.getElementById('pledgeResult');
  const certName = document.getElementById('certName');
  const certRombel = document.getElementById('certRombel');
  const certAction = document.getElementById('certAction');
  const certTimestamp = document.getElementById('certTimestamp');

  if (btnSubmitPledge) {
    btnSubmitPledge.addEventListener('click', () => {
      const name = pledgeName.value.trim();
      const rombel = pledgeRombel.value;
      const action = pledgeAction.value;

      if (!name) {
        alert('Silakan tuliskan namamu terlebih dahulu!');
        pledgeName.focus();
        return;
      }

      if (!rombel) {
        alert('Silakan pilih rombelmu!');
        pledgeRombel.focus();
        return;
      }

      certName.textContent = name.toUpperCase();
      certRombel.textContent = `${rombel} • SMK Wikrama Bogor`;
      certAction.textContent = `"${action}"`;

      const now = new Date();
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = now.toLocaleDateString('id-ID', options);
      const randomCode = 'VLT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      certTimestamp.textContent = `Kode Komitmen: #${randomCode} • Terverifikasi pada ${formattedDate}`;

      pledgeResult.style.display = 'block';
      pledgeResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  // ----------------------------------------------------
  // 9B. FITUR LANJUTAN FASE 3: ZONA FILTER, SIMULATOR, MITOS VS FAKTA
  // ----------------------------------------------------
  
  // 1. Zona Filter Switcher
  const aksiTabBtns = document.querySelectorAll('.aksi-tab-btn');
  const aksiCards = document.querySelectorAll('.rekomendasi-card-modern, .rekomendasi-card');

  aksiTabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      aksiTabBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const targetZona = this.dataset.zona;

      aksiCards.forEach(card => {
        if (targetZona === 'all' || card.dataset.zona === targetZona) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 2. Simulator Kalkulator Hemat Listrik Kelas & Lab (ESD Simulator)
  const sliderPc = document.getElementById('sliderPc');
  const sliderAc = document.getElementById('sliderAc');
  const sliderLampu = document.getElementById('sliderLampu');
  const valPc = document.getElementById('valPc');
  const valAc = document.getElementById('valAc');
  const valLampu = document.getElementById('valLampu');
  const outKwh = document.getElementById('calcOutputKwh');
  const outRupiah = document.getElementById('calcOutputRupiah');
  const outCo2 = document.getElementById('calcOutputCo2');
  const outImpact = document.getElementById('calcOutputImpact');

  function updateSimulator() {
    if (!sliderPc || !sliderAc || !sliderLampu) return;
    const countPc = parseInt(sliderPc.value, 10);
    const hoursAc = parseInt(sliderAc.value, 10);
    const countLampu = parseInt(sliderLampu.value, 10);

    if (valPc) valPc.textContent = `${countPc} Unit PC`;
    if (valAc) valAc.textContent = `${hoursAc} Jam/Hari`;
    if (valLampu) valLampu.textContent = `${countLampu} Titik`;

    // 22 Hari Sekolah Efektif per Bulan
    // Daya PC monitor standby: 0.05 kW x 1.5 jam jeda istirahat
    const kwhPc = countPc * 0.05 * 1.5 * 22;
    // Efisiensi AC 24C vs 16C: hemat 0.28 kW per jam
    const kwhAc = hoursAc * 0.28 * 22;
    // Lampu & proyektor ruang kosong: 0.04 kW x 1.5 jam
    const kwhLampu = countLampu * 0.04 * 1.5 * 22;

    const totalKwh = Math.round(kwhPc + kwhAc + kwhLampu);
    const totalRupiah = Math.round(totalKwh * 1444);
    const totalCo2 = Math.round(totalKwh * 0.79);
    const pohonEq = Math.max(1, Math.round(totalCo2 / 18));

    if (outKwh) outKwh.textContent = `${totalKwh.toLocaleString('id-ID')} kWh`;
    if (outRupiah) outRupiah.textContent = `Rp ${totalRupiah.toLocaleString('id-ID')}`;
    if (outCo2) outCo2.textContent = `${totalCo2.toLocaleString('id-ID')} kg CO₂`;
    if (outImpact) {
      outImpact.textContent = `🌱 Dampak Nyata: Setara dengan menyerap emisi karbon ${pohonEq} bibit pohon selama 1 tahun penuh!`;
    }
  }

  [sliderPc, sliderAc, sliderLampu].forEach(input => {
    if (input) {
      input.addEventListener('input', updateSimulator);
    }
  });
  updateSimulator();

  // 3. Mitos vs Fakta Reveal Button
  document.querySelectorAll('.myth-reveal-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const parent = this.closest('.myth-card');
      if (!parent) return;
      const answer = parent.querySelector('.myth-answer');
      if (!answer) return;
      const isVisible = answer.style.display === 'block';
      answer.style.display = isVisible ? 'none' : 'block';
      this.textContent = isVisible ? 'Cek Fakta Ilmiah 🔍' : 'Sembunyikan Penjelasan ▴';
    });
  });

  // 4. Salin Ikrar Komitmen ke Clipboard
  const btnCopyPledge = document.getElementById('btnCopyPledge');
  if (btnCopyPledge) {
    btnCopyPledge.addEventListener('click', () => {
      const name = certName ? certName.textContent : '';
      const rombel = certRombel ? certRombel.textContent : '';
      const action = certAction ? certAction.textContent : '';
      if (!name) return;

      const textToCopy = `[IKRAR SISWA HEMAT ENERGI VOLTIA]\nNama: ${name}\nRombel: ${rombel}\nKomitmen: ${action}\nMari wujudkan sekolah hijau dan hemat energi bersama SMK Wikrama Bogor!`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = btnCopyPledge.textContent;
        btnCopyPledge.textContent = 'Tersalin ke Clipboard! ✓';
        btnCopyPledge.style.background = '#15370D';
        btnCopyPledge.style.color = '#FFF2B4';
        setTimeout(() => {
          btnCopyPledge.textContent = originalText;
          btnCopyPledge.style.background = '';
          btnCopyPledge.style.color = '';
        }, 2000);
      }).catch(err => {
        alert('Teks komitmen siap dibagikan!');
      });
    });
  }

  // ----------------------------------------------------
  // 10. JALANKAN APLIKASI
  // ----------------------------------------------------
  muatDataKuesioner();

});