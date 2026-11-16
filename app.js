
const THRESHOLDS = {
  residential: { mei: [8, 15], dcc: [600, 1100], cod: [110, 160], cle: [5, 10], ftri: [85, 75] },
  industrial:  { mei: [10, 18], dcc: [800, 1500], cod: [150, 220], cle: [6, 12], ftri: [82, 72] },
  road:        { mei: [9, 16], dcc: [900, 1700], cod: [180, 260], cle: [5, 9], ftri: [88, 78] }
};

let state = {
  user: null,
  currentObjId: 'onega',
  objects: [
    { id: 'onega', name: 'ЖК Онега', profile: 'residential', budget: 680000, planProfit: 102000, factProfit: 81000, inflation: 8500, overhead: 2600, workdays: 22, equip: 42, fine: 15, idleDays: 5, ksDays: 38, wip: 54000, rate: 21, fotTotal: 34000, fotRework: 3900, workTotal: 165000, workFirst: 128000 },
    { id: 'ceh2', name: 'Цех Сборка-2', profile: 'industrial', budget: 850000, planProfit: 136000, factProfit: 125000, inflation: 5000, overhead: 3200, workdays: 22, equip: 65, fine: 20, idleDays: 2, ksDays: 26, wip: 40000, rate: 21, fotTotal: 48000, fotRework: 2100, workTotal: 240000, workFirst: 218000 },
    { id: 'm12', name: 'Трасса М-12 Участок', profile: 'road', budget: 1200000, planProfit: 180000, factProfit: 142000, inflation: 14000, overhead: 4100, workdays: 24, equip: 95, fine: 35, idleDays: 8, ksDays: 44, wip: 95000, rate: 21, fotTotal: 52000, fotRework: 4900, workTotal: 310000, workFirst: 245000 }
  ],
  contractors: [
    { name: 'ООО МонолитСтрой', work: 'Монолитный каркас', obj: 'ЖК Онега', delay: 4, cle: 11.8, ftri: 74.2, damage: 980 },
    { name: 'СК ФасадПром', work: 'Вентилируемый фасад', obj: 'ЖК Онега', delay: 1, cle: 4.5, ftri: 91.0, damage: 175 },
    { name: 'АО ЭлектроМонтаж', work: 'Внутренние сети', obj: 'Цех Сборка-2', delay: 0, cle: 3.1, ftri: 94.5, damage: 0 }
  ]
};

document.getElementById('report-date').textContent = new Date().toLocaleDateString('ru-RU');

function loginDemo(role) {
  const names = {
    director: 'Иванов А.С. (Директор по строительству)',
    pto: 'Смирнова Е.В. (Ведущий инженер ПТО)',
    prorab: 'Петров Д.Н. (Начальник участка)',
    contractor: 'ООО МонолитСтрой (Подрядчик)'
  };
  state.user = { name: names[role], role: role };
  initApp();
}

function registerUser() {
  const name = document.getElementById('reg-name').value.trim() || 'Новый пользователь';
  const role = document.getElementById('reg-role').value;
  state.user = { name: name, role: role };
  if (role === 'contractor') document.getElementById('c-name').value = name;
  initApp();
}

function logout() {
  state.user = null;
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('app-screen').classList.add('hidden');
  document.getElementById('user-panel').classList.add('hidden');
}

function initApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
  document.getElementById('user-panel').classList.remove('hidden');
  document.getElementById('current-user-label').textContent = state.user.name;

  const tabsEl = document.getElementById('nav-tabs');
  tabsEl.innerHTML = '';

  if (state.user.role === 'contractor') {
    addTab('cabinet', '🚜 Кабинет подрядчика', true);
    populateContractorObjs();
    switchTab('cabinet');
  } else {
    addTab('object', '📊 Диагностика объекта', true);
    if (state.user.role === 'director') {
      addTab('portfolio', '🏢 Портфель объектов', false);
      addTab('contractors', '🤝 Рейтинг подрядчиков', false);
    }
    const isProrab = state.user.role === 'prorab';
    document.getElementById('finance-inputs').classList.toggle('hidden', isProrab);
    document.getElementById('summary-money-card').classList.toggle('hidden', isProrab);
    populateObjSelector();
    loadSelectedObject();
    switchTab('object');
  }
}

function addTab(id, label, active) {
  const btn = document.createElement('button');
  btn.className = 'tab' + (active ? ' active' : '');
  btn.textContent = label;
  btn.dataset.tab = id;
  btn.onclick = function() { switchTab(id); };
  document.getElementById('nav-tabs').appendChild(btn);
}

function switchTab(id) {
  document.querySelectorAll('.tab').forEach(function(t) { t.classList.toggle('active', t.dataset.tab === id); });
  ['view-object', 'view-portfolio', 'view-contractors-dir', 'view-contractor-cabinet'].forEach(function(v) { document.getElementById(v).classList.add('hidden'); });
  if (id === 'object') document.getElementById('view-object').classList.remove('hidden');
  if (id === 'portfolio') { renderPortfolio(); document.getElementById('view-portfolio').classList.remove('hidden'); }
  if (id === 'contractors') { renderContractorsDir(); document.getElementById('view-contractors-dir').classList.remove('hidden'); }
  if (id === 'cabinet') document.getElementById('view-contractor-cabinet').classList.remove('hidden');
}

function populateObjSelector() {
  const sel = document.getElementById('obj-selector');
  sel.innerHTML = state.objects.map(function(o) {
    return '<option value="' + o.id + '"' + (o.id === state.currentObjId ? ' selected' : '') + '>' + o.name + '</option>';
  }).join('');
}

function loadSelectedObject() {
  state.currentObjId = document.getElementById('obj-selector').value;
  const o = state.objects.find(function(x) { return x.id === state.currentObjId; });
  if (!o) return;
  document.getElementById('obj-profile').value = o.profile;
  document.getElementById('in-budget').value = o.budget;
  document.getElementById('in-plan-profit').value = o.planProfit;
  document.getElementById('in-fact-profit').value = o.factProfit;
  document.getElementById('in-inflation').value = o.inflation;
  document.getElementById('in-overhead').value = o.overhead;
  document.getElementById('in-workdays').value = o.workdays;
  document.getElementById('in-equip').value = o.equip;
  document.getElementById('in-fine').value = o.fine;
  document.getElementById('in-idle-days').value = o.idleDays;
  document.getElementById('in-ks-days').value = o.ksDays;
  document.getElementById('in-wip').value = o.wip;
  document.getElementById('in-rate').value = o.rate;
  document.getElementById('in-fot-total').value = o.fotTotal;
  document.getElementById('in-fot-rework').value = o.fotRework;
  document.getElementById('in-work-total').value = o.workTotal;
  document.getElementById('in-work-first').value = o.workFirst;
  recalc();
}

function calculateMetrics(o) {
  const internalMarginLoss = Math.max(0, (o.planProfit - o.factProfit) - o.inflation);
  const mei = o.planProfit > 0 ? (internalMarginLoss / o.planProfit) * 100 : 0;
  const dcc = o.wip * (o.rate / 100) * (o.ksDays / 365);
  const cod = (o.workdays > 0 ? o.overhead / o.workdays : 0) + o.equip + o.fine;
  const idleLoss = cod * o.idleDays;
  const cle = o.fotTotal > 0 ? (o.fotRework / o.fotTotal) * 100 : 0;
  const ftri = o.workTotal > 0 ? (o.workFirst / o.workTotal) * 100 : 100;
  const totalLosses = internalMarginLoss + dcc + idleLoss + o.fotRework;
  const returnPotential = totalLosses * 0.65;
  return { mei: mei, dcc: dcc, cod: cod, cle: cle, ftri: ftri, internalMarginLoss: internalMarginLoss, idleLoss: idleLoss, totalLosses: totalLosses, returnPotential: returnPotential };
}

function getStatus(code, val, profile) {
  const t = THRESHOLDS[profile][code];
  if (code === 'ftri') {
    if (val >= t[0]) return { cls: 'st-green', txt: 'ЗЕЛЕНАЯ ЗОНА' };
    if (val >= t[1]) return { cls: 'st-yellow', txt: 'ЖЕЛТАЯ ЗОНА' };
    return { cls: 'st-red', txt: 'КРАСНАЯ ЗОНА' };
  } else {
    if (val <= t[0]) return { cls: 'st-green', txt: 'ЗЕЛЕНАЯ ЗОНА' };
    if (val <= t[1]) return { cls: 'st-yellow', txt: 'ЖЕЛТАЯ ЗОНА' };
    return { cls: 'st-red', txt: 'КРАСНАЯ ЗОНА' };
  }
}

function recalc() {
  const o = {
    profile: document.getElementById('obj-profile').value,
    budget: +document.getElementById('in-budget').value || 0,
    planProfit: +document.getElementById('in-plan-profit').value || 0,
    factProfit: +document.getElementById('in-fact-profit').value || 0,
    inflation: +document.getElementById('in-inflation').value || 0,
    overhead: +document.getElementById('in-overhead').value || 0,
    workdays: +document.getElementById('in-workdays').value || 22,
    equip: +document.getElementById('in-equip').value || 0,
    fine: +document.getElementById('in-fine').value || 0,
    idleDays: +document.getElementById('in-idle-days').value || 0,
    ksDays: +document.getElementById('in-ks-days').value || 0,
    wip: +document.getElementById('in-wip').value || 0,
    rate: +document.getElementById('in-rate').value || 0,
    fotTotal: +document.getElementById('in-fot-total').value || 0,
    fotRework: +document.getElementById('in-fot-rework').value || 0,
    workTotal: +document.getElementById('in-work-total').value || 0,
    workFirst: +document.getElementById('in-work-first').value || 0
  };

  const m = calculateMetrics(o);
  document.getElementById('res-losses').textContent = Math.round(m.totalLosses).toLocaleString('ru-RU') + ' тыс. р.';
  document.getElementById('res-losses-pct').textContent = (o.budget > 0 ? (m.totalLosses / o.budget * 100).toFixed(1) : 0) + '% от сметного бюджета';
  document.getElementById('res-return').textContent = '+' + Math.round(m.returnPotential).toLocaleString('ru-RU') + ' тыс. р.';

  const isProrab = state.user && state.user.role === 'prorab';
  const rows = [
    { code: 'mei', lbl: 'MEI', name: 'Коэф. «съеденной» маржи', val: m.mei.toFixed(1) + '%', raw: m.mei, hide: isProrab },
    { code: 'dcc', lbl: 'DCC', name: 'Цена заморозки в КС-2', val: Math.round(m.dcc).toLocaleString('ru-RU') + ' тыс. р.', raw: m.dcc, hide: isProrab },
    { code: 'cod', lbl: 'CoD', name: 'Цена 1 дня простоя', val: m.cod.toFixed(1) + ' тыс. р./дн', raw: m.cod, hide: false },
    { code: 'cle', lbl: 'CLE', name: 'Доля ФОТ на переделки', val: m.cle.toFixed(1) + '%', raw: m.cle, hide: false },
    { code: 'ftri', lbl: 'FTRI', name: 'Приемка с 1-го раза', val: m.ftri.toFixed(1) + '%', raw: m.ftri, hide: false }
  ];

  const tbody = document.getElementById('kpi-table-body');
  const recs = document.getElementById('recommendations-list');
  tbody.innerHTML = '';
  recs.innerHTML = '';

  const adviceMap = {
    mei: 'Ввести еженедельный план-фактный контроль маржинальности по видам работ и зафиксировать цены с ключевыми поставщиками.',
    dcc: 'Перевести закрытие актов КС-2/КС-3 в ЭДО и дробить крупные этапы на промежуточные акты каждые 15 дней.',
    cod: 'Внедрить недельно-суточное планирование (Last Planner System) и перевести аренду спецтехники на почасовую заявку.',
    cle: 'Привязать премиальную часть ФОТ прорабов и бригад к сдаче конструкций без предписаний и переделок.',
    ftri: 'Ввести обязательные чек-листы самоконтроля мастеров перед вызовом инженера строительного контроля.'
  };

  rows.forEach(function(r) {
    if (r.hide) return;
    const st = getStatus(r.code, r.raw, o.profile);
    tbody.innerHTML += '<tr><td><strong>' + r.lbl + '</strong></td><td>' + r.name + '</td><td><strong>' + r.val + '</strong></td><td><span class="status-pill ' + st.cls + '">' + st.txt + '</span></td></tr>';
    if (st.cls !== 'st-green') {
      const cls = st.cls === 'st-red' ? 'red' : 'yellow';
      recs.innerHTML += '<div class="rec-item ' + cls + '"><strong>[' + r.lbl + ' — ' + st.txt + ']</strong> ' + adviceMap[r.code] + '</div>';
    }
  });

  if (!recs.innerHTML) {
    recs.innerHTML = '<div class="rec-item">Все доступные показатели в зеленой зоне. Организация работает эффективно.</div>';
  }

  const parts = [
    { name: 'Внутреннее снижение маржи', val: m.internalMarginLoss, color: '#2563eb' },
    { name: 'Оплата переделок и брака (ФОТ)', val: o.fotRework, color: '#dc2626' },
    { name: 'Заморозка капитала в КС-2', val: m.dcc, color: '#d97706' },
    { name: 'Организационные простои', val: m.idleLoss, color: '#7c3aed' }
  ];
  document.getElementById('loss-bars').innerHTML = parts.map(function(p) {
    const pct = m.totalLosses > 0 ? Math.round(p.val / m.totalLosses * 100) : 0;
    return '<div style="margin-bottom:10px;"><div style="display:flex; justify-content:space-between; font-size:12px;"><span>' + p.name + '</span><strong>' + Math.round(p.val).toLocaleString('ru-RU') + ' тыс. р. (' + pct + '%)</strong></div><div class="bar-wrap"><div class="bar-fill" style="width:' + pct + '%; background:' + p.color + ';"></div></div></div>';
  }).join('');
}

function saveCurrentObject() {
  const idx = state.objects.findIndex(function(x) { return x.id === state.currentObjId; });
  if (idx === -1) return;
  const o = state.objects[idx];
  o.profile = document.getElementById('obj-profile').value;
  o.budget = +document.getElementById('in-budget').value || 0;
  o.planProfit = +document.getElementById('in-plan-profit').value || 0;
  o.factProfit = +document.getElementById('in-fact-profit').value || 0;
  o.inflation = +document.getElementById('in-inflation').value || 0;
  o.overhead = +document.getElementById('in-overhead').value || 0;
  o.workdays = +document.getElementById('in-workdays').value || 22;
  o.equip = +document.getElementById('in-equip').value || 0;
  o.fine = +document.getElementById('in-fine').value || 0;
  o.idleDays = +document.getElementById('in-idle-days').value || 0;
  o.ksDays = +document.getElementById('in-ks-days').value || 0;
  o.wip = +document.getElementById('in-wip').value || 0;
  o.rate = +document.getElementById('in-rate').value || 0;
  o.fotTotal = +document.getElementById('in-fot-total').value || 0;
  o.fotRework = +document.getElementById('in-fot-rework').value || 0;
  o.workTotal = +document.getElementById('in-work-total').value || 0;
  o.workFirst = +document.getElementById('in-work-first').value || 0;
  alert('Данные объекта сохранены и обновлены в портфеле!');
}

function createNewObjectPrompt() {
  const name = prompt('Введите название нового объекта (например, ЖК Северный):');
  if (!name) return;
  const id = 'obj_' + Date.now();
  state.objects.push({ id: id, name: name, profile: 'residential', budget: 500000, planProfit: 75000, factProfit: 68000, inflation: 4000, overhead: 2000, workdays: 22, equip: 30, fine: 10, idleDays: 2, ksDays: 25, wip: 30000, rate: 21, fotTotal: 25000, fotRework: 1200, workTotal: 120000, workFirst: 106000 });
  state.currentObjId = id;
  populateObjSelector();
  loadSelectedObject();
}

function renderPortfolio() {
  const profNames = { residential: 'Жилое', industrial: 'Промышленное', road: 'Дорожное' };
  document.getElementById('portfolio-body').innerHTML = state.objects.map(function(o) {
    const m = calculateMetrics(o);
    return '<tr><td><strong>' + o.name + '</strong></td><td>' + profNames[o.profile] + '</td><td>' + o.budget.toLocaleString('ru-RU') + '</td><td>' + m.mei.toFixed(1) + '%</td><td>' + Math.round(m.dcc).toLocaleString('ru-RU') + '</td><td>' + m.cod.toFixed(1) + '</td><td>' + m.cle.toFixed(1) + '%</td><td>' + m.ftri.toFixed(1) + '%</td><td class="text-red"><strong>' + Math.round(m.totalLosses).toLocaleString('ru-RU') + '</strong></td><td class="text-green"><strong>+' + Math.round(m.returnPotential).toLocaleString('ru-RU') + '</strong></td></tr>';
  }).join('');
}

function renderContractorsDir() {
  document.getElementById('contractors-dir-body').innerHTML = state.contractors.map(function(c) {
    let st = { cls: 'st-green', txt: 'НАДЕЖНЫЙ ПОДРЯДЧИК' };
    if (c.ftri < 75 || c.cle > 10 || c.delay >= 4) st = { cls: 'st-red', txt: 'КРИТИЧЕСКИЙ РИСК' };
    else if (c.ftri < 85 || c.cle > 6 || c.delay >= 2) st = { cls: 'st-yellow', txt: 'ТРЕБУЕТ КОНТРОЛЯ' };
    return '<tr><td><strong>' + c.name + '</strong></td><td>' + c.work + '</td><td>' + c.obj + '</td><td>' + c.delay + ' дн.</td><td>' + c.cle.toFixed(1) + '%</td><td>' + c.ftri.toFixed(1) + '%</td><td><strong>' + c.damage.toLocaleString('ru-RU') + ' тыс. р.</strong></td><td><span class="status-pill ' + st.cls + '">' + st.txt + '</span></td></tr>';
  }).join('');
}

function populateContractorObjs() {
  document.getElementById('c-obj').innerHTML = state.objects.map(function(o) { return '<option value="' + o.name + '">' + o.name + '</option>'; }).join('');
}

function submitContractorReport() {
  const name = document.getElementById('c-name').value.trim() || 'Подрядчик';
  const work = document.getElementById('c-worktype').value.trim() || 'СМР';
  const objName = document.getElementById('c-obj').value;
  const delay = +document.getElementById('c-delay').value || 0;
  const fot = +document.getElementById('c-fot').value || 1;
  const rework = +document.getElementById('c-rework').value || 0;
  const total = +document.getElementById('c-total').value || 1;
  const first = +document.getElementById('c-first').value || 0;

  const cle = (rework / fot) * 100;
  const ftri = (first / total) * 100;
  const objData = state.objects.find(function(o) { return o.name === objName; }) || state.objects[0];
  const m = calculateMetrics(objData);
  const damage = Math.round(delay * m.cod + rework);

  const idx = state.contractors.findIndex(function(x) { return x.name === name && x.obj === objName; });
  const rec = { name: name, work: work, obj: objName, delay: delay, cle: cle, ftri: ftri, damage: damage };
  if (idx >= 0) state.contractors[idx] = rec; else state.contractors.unshift(rec);

  let badge = '<span class="status-pill st-green">ЗЕЛЕНАЯ ЗОНА — ОТЛИЧНО</span>';
  if (ftri < 75 || cle > 10 || delay >= 4) badge = '<span class="status-pill st-red">КРАСНАЯ ЗОНА — РИСК ШТРАФОВ</span>';
  else if (ftri < 85 || cle > 6 || delay >= 2) badge = '<span class="status-pill st-yellow">ЖЕЛТАЯ ЗОНА — ЕСТЬ ЗАМЕЧАНИЯ</span>';

  document.getElementById('contractor-self-eval').innerHTML = '<p>✅ Отчет отправлен в панель Директора генподрядчика!</p><div class="metric-box" style="margin-bottom:12px;"><div class="lbl">Ваш интегральный статус</div><div style="margin:6px 0;">' + badge + '</div><div class="lbl">FTRI (сдача с 1-го раза): <strong>' + ftri.toFixed(1) + '%</strong> | CLE (брак): <strong>' + cle.toFixed(1) + '%</strong></div></div><p class="muted-text">Нажмите «Выйти» и зайдите в Демо-режим «Директор», чтобы увидеть вашу компанию в общем рейтинге подрядчиков.</p>';
}
