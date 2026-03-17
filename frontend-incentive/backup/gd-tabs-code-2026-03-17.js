// ===== GD 차량조회 =====
let gdVehicleInit = false;
let gdVehicleState = { q: '', page: 1, total: 0, loading: false, items: [], debounceTimer: null };

function loadGdVehicle() {
  if (gdVehicleInit) return;
  gdVehicleInit = true;
  const el = document.getElementById('gdVehicleContent');
  el.innerHTML = `
    <div style="max-width:520px;margin:0 auto">
      <div class="gd-search-spacer" style="height:30vh"></div>
      <div class="gd-search-wrap">
        <input class="gd-search-input" id="gdVehicleQ" type="search" placeholder="차량번호, 고객명, 전화번호"
          autocomplete="off" inputmode="search">
        <button class="gd-search-clear" id="gdVehicleClear" onclick="gdVehicleClear()">×</button>
      </div>
      <div class="gd-status show" id="gdVehicleStatus">검색어를 입력하세요</div>
      <div class="gd-list" id="gdVehicleList"></div>
      <button class="gd-load-more" id="gdVehicleMore" onclick="gdVehicleLoadMore()">더 보기</button>
    </div>`;

  const input = document.getElementById('gdVehicleQ');
  const vSpacer = el.querySelector('.gd-search-spacer');
  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (vSpacer) vSpacer.style.height = q ? '0' : '30vh';
    document.getElementById('gdVehicleClear').classList.toggle('show', q.length > 0);
    clearTimeout(gdVehicleState.debounceTimer);
    if (!q) {
      gdVehicleReset();
      document.getElementById('gdVehicleStatus').textContent = '검색어를 입력하세요';
      document.getElementById('gdVehicleStatus').classList.add('show');
      return;
    }
    gdVehicleState.debounceTimer = setTimeout(() => gdVehicleSearch(q, true), 300);
  });
}

function gdVehicleReset() {
  gdVehicleState = { ...gdVehicleState, q: '', page: 1, total: 0, items: [] };
  document.getElementById('gdVehicleList').innerHTML = '';
  document.getElementById('gdVehicleMore').classList.remove('show');
}

function gdVehicleClear() {
  document.getElementById('gdVehicleQ').value = '';
  document.getElementById('gdVehicleClear').classList.remove('show');
  gdVehicleReset();
  document.getElementById('gdVehicleStatus').textContent = '검색어를 입력하세요';
  document.getElementById('gdVehicleStatus').classList.add('show');
  document.getElementById('gdVehicleQ').focus();
}

async function gdVehicleSearch(q, reset) {
  if (gdVehicleState.loading) return;
  gdVehicleState.loading = true;
  const statusEl = document.getElementById('gdVehicleStatus');
  const listEl = document.getElementById('gdVehicleList');
  const moreEl = document.getElementById('gdVehicleMore');

  if (reset) {
    gdVehicleState.q = q;
    gdVehicleState.page = 1;
    gdVehicleState.items = [];
    listEl.innerHTML = '';
    moreEl.classList.remove('show');
  }

  statusEl.textContent = '검색 중...';
  statusEl.classList.add('show');

  try {
    const page = gdVehicleState.page;
    const data = await api('/gd/vehicles?q=' + encodeURIComponent(q) + '&page=' + page + '&limit=20');
    gdVehicleState.total = data.total || 0;
    const items = data.data || [];
    gdVehicleState.items = gdVehicleState.items.concat(items);

    if (gdVehicleState.items.length === 0) {
      statusEl.textContent = '검색 결과가 없습니다';
      statusEl.classList.add('show');
    } else {
      statusEl.classList.remove('show');
      items.forEach(v => listEl.insertAdjacentHTML('beforeend', gdVehicleCard(v)));
    }
    const loaded = gdVehicleState.items.length;
    moreEl.classList.toggle('show', loaded < gdVehicleState.total);
    if (loaded < gdVehicleState.total) moreEl.textContent = '더 보기 (' + loaded + '/' + gdVehicleState.total + ')';
    gdVehicleState.page++;
  } catch (e) {
    statusEl.textContent = '조회 실패: ' + e.message;
    statusEl.classList.add('show');
  }
  gdVehicleState.loading = false;
}

function gdVehicleLoadMore() {
  if (gdVehicleState.q) gdVehicleSearch(gdVehicleState.q, false);
}

function gdVehicleCard(v) {
  const id = 'gv-' + (v.code || v.plateNumber).replace(/\s/g, '_');
  return `<div class="gd-row" id="${id}" onclick="gdVehicleToggle('${id}','${encodeURIComponent(v.code || '')}')">
    <div class="gd-row-main vehicle">
      <div>
        <div class="gd-plate">${v.plateNumber || '-'}</div>
        <div class="gd-model">${[v.carModel, v.color, v.modelYear ? v.modelYear + '년' : ''].filter(Boolean).join(' · ') || '-'}</div>
      </div>
      <div></div>
      <div class="gd-owner">
        <div style="font-weight:600">${v.ownerName || '-'}</div>
        <div style="font-size:12px;color:var(--text-light)">${v.phone || ''}</div>
      </div>
    </div>
    <div class="gd-detail" id="${id}-detail">
      <div class="gd-repair-loading">불러오는 중...</div>
    </div>
  </div>`;
}

let gdVehicleOpenCode = null;
async function gdVehicleToggle(rowId, encodedCode) {
  const row = document.getElementById(rowId);
  const detail = document.getElementById(rowId + '-detail');
  const isOpen = detail.classList.contains('show');
  // 닫기
  document.querySelectorAll('.gd-detail.show').forEach(d => d.classList.remove('show'));
  document.querySelectorAll('.gd-row.open').forEach(r => r.classList.remove('open'));
  if (isOpen) return;

  row.classList.add('open');
  detail.classList.add('show');
  const code = decodeURIComponent(encodedCode);
  if (!code) { detail.innerHTML = '<p style="font-size:13px;color:var(--text-muted);padding:8px 0">차량 코드 없음</p>'; return; }

  // 이미 로드됐으면 스킵
  if (detail.dataset.loaded) return;
  detail.innerHTML = '<div class="gd-repair-loading">정비 이력 불러오는 중...</div>';

  try {
    let allRepairs = [];
    let repairPage = 1;
    let repairTotal = 0;

    const loadRepairs = async (pg) => {
      const data = await api('/gd/vehicles/' + encodeURIComponent(code) + '/repairs?page=' + pg + '&limit=20');
      repairTotal = data.total || 0;
      return data.repairs || [];
    };

    allRepairs = await loadRepairs(1);

    const renderRepairs = (repairs) => {
      if (repairs.length === 0) return '<p style="font-size:13px;color:var(--text-muted);padding:8px 0">정비 이력이 없습니다</p>';
      let h = `<div class="gd-repair-header"><span>날짜</span><span>품목</span><span>금액</span><span>주행</span></div>`;
      repairs.forEach(r => {
        const d = r.repairDate ? r.repairDate.slice(0, 10).replace(/-/g, '.') : '-';
        h += `<div class="gd-repair-row">
          <span class="gd-repair-date">${d}</span>
          <span class="gd-repair-item">${r.productName || '-'}</span>
          <span class="gd-repair-amt">${r.amount != null ? fmt(r.amount) + '원' : '-'}</span>
          <span class="gd-repair-km">${r.mileage != null ? fmt(r.mileage) + 'km' : '-'}</span>
        </div>`;
      });
      return h;
    };

    let currentRepairs = allRepairs;
    let currentPage = 1;

    const updateDetail = () => {
      const moreBtn = currentRepairs.length < repairTotal
        ? `<button class="gd-load-more show" id="${rowId}-rmore" onclick="gdRepairLoadMore('${rowId}','${encodeURIComponent(code)}')">더 보기 (${currentRepairs.length}/${repairTotal})</button>`
        : '';
      detail.innerHTML = renderRepairs(currentRepairs) + moreBtn;
      detail.dataset.loaded = '1';
      detail.dataset.page = String(currentPage);
      detail.dataset.total = String(repairTotal);
      detail.dataset.repairJson = JSON.stringify(currentRepairs);
    };

    updateDetail();
  } catch (e) {
    detail.innerHTML = '<p style="font-size:13px;color:var(--red);padding:8px 0">정비 이력 로드 실패</p>';
  }
}

async function gdRepairLoadMore(rowId, encodedCode) {
  const detail = document.getElementById(rowId + '-detail');
  const code = decodeURIComponent(encodedCode);
  const page = parseInt(detail.dataset.page || '1') + 1;
  const existing = JSON.parse(detail.dataset.repairJson || '[]');
  const total = parseInt(detail.dataset.total || '0');

  const btn = document.getElementById(rowId + '-rmore');
  if (btn) btn.textContent = '불러오는 중...';

  try {
    const data = await api('/gd/vehicles/' + encodeURIComponent(code) + '/repairs?page=' + page + '&limit=20');
    const newRepairs = data.repairs || [];
    const allRepairs = existing.concat(newRepairs);

    let h = `<div class="gd-repair-header"><span>날짜</span><span>품목</span><span>금액</span><span>주행</span></div>`;
    allRepairs.forEach(r => {
      const d = r.repairDate ? r.repairDate.slice(0, 10).replace(/-/g, '.') : '-';
      h += `<div class="gd-repair-row">
        <span class="gd-repair-date">${d}</span>
        <span class="gd-repair-item">${r.productName || '-'}</span>
        <span class="gd-repair-amt">${r.amount != null ? fmt(r.amount) + '원' : '-'}</span>
        <span class="gd-repair-km">${r.mileage != null ? fmt(r.mileage) + 'km' : '-'}</span>
      </div>`;
    });
    const moreBtn = allRepairs.length < total
      ? `<button class="gd-load-more show" id="${rowId}-rmore" onclick="gdRepairLoadMore('${rowId}','${encodeURIComponent(code)}')">더 보기 (${allRepairs.length}/${total})</button>`
      : '';
    detail.innerHTML = h + moreBtn;
    detail.dataset.page = String(page);
    detail.dataset.repairJson = JSON.stringify(allRepairs);
  } catch (e) {
    if (btn) btn.textContent = '로드 실패 — 다시 시도';
  }
}

// ===== GD 상품조회 =====
let gdProductInit = false;
let gdProductState = { q: '', page: 1, total: 0, loading: false, items: [], debounceTimer: null };

function loadGdProduct() {
  if (gdProductInit) return;
  gdProductInit = true;
  const el = document.getElementById('gdProductContent');
  el.innerHTML = `
    <div style="max-width:520px;margin:0 auto">
      <div class="gd-search-spacer" style="height:30vh"></div>
      <div class="gd-search-wrap">
        <input class="gd-search-input" id="gdProductQ" type="search" placeholder="상품명, 코드, 타이어사이즈(2355519)"
          autocomplete="off" inputmode="search">
        <button class="gd-search-clear" id="gdProductClear" onclick="gdProductClear()">×</button>
      </div>
      <div class="gd-status show" id="gdProductStatus">검색어를 입력하세요</div>
      <div class="gd-list" id="gdProductList"></div>
      <button class="gd-load-more" id="gdProductMore" onclick="gdProductLoadMore()">더 보기</button>
    </div>`;

  const input = document.getElementById('gdProductQ');
  const pSpacer = el.querySelector('.gd-search-spacer');
  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (pSpacer) pSpacer.style.height = q ? '0' : '30vh';
    document.getElementById('gdProductClear').classList.toggle('show', q.length > 0);
    clearTimeout(gdProductState.debounceTimer);
    if (!q) {
      gdProductReset();
      document.getElementById('gdProductStatus').textContent = '검색어를 입력하세요';
      document.getElementById('gdProductStatus').classList.add('show');
      return;
    }
    gdProductState.debounceTimer = setTimeout(() => gdProductSearch(q, true), 300);
  });
}

function gdProductReset() {
  gdProductState = { ...gdProductState, q: '', page: 1, total: 0, items: [] };
  document.getElementById('gdProductList').innerHTML = '';
  document.getElementById('gdProductMore').classList.remove('show');
}

function gdProductClear() {
  document.getElementById('gdProductQ').value = '';
  document.getElementById('gdProductClear').classList.remove('show');
  gdProductReset();
  document.getElementById('gdProductStatus').textContent = '검색어를 입력하세요';
  document.getElementById('gdProductStatus').classList.add('show');
  document.getElementById('gdProductQ').focus();
}

async function gdProductSearch(q, reset) {
  if (gdProductState.loading) return;
  gdProductState.loading = true;
  const statusEl = document.getElementById('gdProductStatus');
  const listEl = document.getElementById('gdProductList');
  const moreEl = document.getElementById('gdProductMore');

  if (reset) {
    gdProductState.q = q;
    gdProductState.page = 1;
    gdProductState.items = [];
    listEl.innerHTML = '';
    moreEl.classList.remove('show');
  }

  statusEl.textContent = '검색 중...';
  statusEl.classList.add('show');

  try {
    const page = gdProductState.page;
    const data = await api('/gd/products?q=' + encodeURIComponent(q) + '&page=' + page + '&limit=20');
    gdProductState.total = data.total || 0;
    const items = data.data || [];
    gdProductState.items = gdProductState.items.concat(items);

    if (gdProductState.items.length === 0) {
      statusEl.textContent = '검색 결과가 없습니다';
      statusEl.classList.add('show');
    } else {
      statusEl.classList.remove('show');
      items.forEach(p => listEl.insertAdjacentHTML('beforeend', gdProductCard(p)));
    }
    const loaded = gdProductState.items.length;
    moreEl.classList.toggle('show', loaded < gdProductState.total);
    if (loaded < gdProductState.total) moreEl.textContent = '더 보기 (' + loaded + '/' + gdProductState.total + ')';
    gdProductState.page++;
  } catch (e) {
    statusEl.textContent = '조회 실패: ' + e.message;
    statusEl.classList.add('show');
  }
  gdProductState.loading = false;
}

function gdProductLoadMore() {
  if (gdProductState.q) gdProductSearch(gdProductState.q, false);
}

function gdProductCard(p) {
  const id = 'gp-' + (p.code || '').replace(/[^a-zA-Z0-9가-힣]/g, '_');
  const price = p.sellPrice1 != null ? fmt(p.sellPrice1) + '원' : (p.fixedPrice != null ? fmt(p.fixedPrice) + '원' : '-');
  const name = p.name || p.altName || '-';
  const unit = p.unit || '';
  const stock = p.stock || 0;
  const hasStock = stock > 0;
  const noStockClass = hasStock ? '' : ' no-stock';
  const stockHtml = hasStock
    ? `<div class="gd-prod-stock has">재고 ${fmt(stock)}${unit || '개'}</div>`
    : `<div class="gd-prod-stock empty">재고 없음</div>`;

  // 상세 가격 단계 HTML
  const priceSteps = [1,2,3,4,5].map(i => {
    const v = p['sellPrice' + i];
    if (v == null) return '';
    return `<div class="gd-prod-detail-item"><div class="gd-prod-detail-label">판매가${i}</div><div class="gd-prod-detail-value">${fmt(v)}원</div></div>`;
  }).join('');
  const costHtml = p.costPrice != null
    ? `<div class="gd-prod-detail-item"><div class="gd-prod-detail-label">원가</div><div class="gd-prod-detail-value" style="color:var(--text-muted)">${fmt(p.costPrice)}원</div></div>` : '';
  const stockDetailHtml = `<div class="gd-prod-detail-item"><div class="gd-prod-detail-label">재고</div><div class="gd-prod-detail-value" style="color:${hasStock ? 'var(--green)' : 'var(--text-light)'}">${fmt(stock)}${unit || '개'}</div></div>`;
  const codeHtml = `<div class="gd-prod-detail-item"><div class="gd-prod-detail-label">상품코드</div><div class="gd-prod-detail-value" style="font-size:12px">${p.code || '-'}</div></div>`;
  const altHtml = p.altName && p.altName !== p.name
    ? `<div class="gd-prod-detail-item" style="grid-column:1/-1"><div class="gd-prod-detail-label">이름2</div><div class="gd-prod-detail-value" style="font-size:12px">${p.altName}</div></div>` : '';

  return `<div class="gd-row${noStockClass}" id="${id}" onclick="gdProductToggle('${id}')">
    <div class="gd-row-main product">
      <div>
        <div class="gd-prod-name">${name}</div>
        ${unit ? `<div class="gd-prod-unit">${unit}</div>` : ''}
      </div>
      <div>
        <div class="gd-prod-price">${price}</div>
        ${stockHtml}
      </div>
    </div>
    <div class="gd-detail" id="${id}-detail">
      <div class="gd-prod-detail-grid">
        ${codeHtml}${stockDetailHtml}${costHtml}${priceSteps}${altHtml}
      </div>
    </div>
  </div>`;
}

function gdProductToggle(rowId) {
  const row = document.getElementById(rowId);
  const detail = document.getElementById(rowId + '-detail');
  const isOpen = detail.classList.contains('show');
  document.querySelectorAll('#gdProductList .gd-detail.show').forEach(d => d.classList.remove('show'));
  document.querySelectorAll('#gdProductList .gd-row.open').forEach(r => r.classList.remove('open'));
  if (!isOpen) { row.classList.add('open'); detail.classList.add('show'); }
}
