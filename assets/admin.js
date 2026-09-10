(() => {
  const SUPABASE_URL = 'https://uexvojgictmkuackpofk.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_o9X7Cc1xo4eJUAjdKMW5TQ_JzIcQLJp';
  const API_URL = `${SUPABASE_URL}/functions/v1/reporting-channel`;
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const login = document.getElementById('adminLogin');
  const panel = document.getElementById('adminPanel');
  const loginForm = document.getElementById('loginForm');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  const reviewerEmail = document.getElementById('reviewerEmail');
  const reportList = document.getElementById('reportList');
  const adminDetail = document.getElementById('adminDetail');
  const searchReports = document.getElementById('searchReports');
  const statusFilter = document.getElementById('statusFilter');
  const logoutBtn = document.getElementById('logoutBtn');

  let session = null;
  let reports = [];
  let selectedId = null;

  const labels = { received: 'Recebido', in_review: 'Em análise', closed: 'Encerrado' };
  const fmt = value => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle:'short', timeStyle:'short' }).format(new Date(value)) : '—';
  const size = bytes => bytes < 1024*1024 ? `${Math.max(1, Math.round(bytes/1024))} KB` : `${(bytes/1024/1024).toFixed(1)} MB`;
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const shownProtocol = report => report.protocol_code || report.id;

  const api = async body => {
    if (!session?.access_token) throw new Error('Sessão inválida.');
    const response = await fetch(API_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`},
      body:JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a operação.');
    return data;
  };

  const showLoginError = message => { loginError.textContent = message; loginError.classList.add('show'); };
  const clearLoginError = () => { loginError.textContent = ''; loginError.classList.remove('show'); };

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    clearLoginError();
    loginBtn.disabled = true;
    loginBtn.textContent = 'Entrando...';
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: loginEmail.value.trim(),
        password: loginPassword.value
      });
      if (error) throw error;
      if (!data.session) throw new Error('Não foi possível iniciar a sessão.');
      loginPassword.value = '';
      await activate(data.session);
    } catch (error) {
      showLoginError(error.message || 'E-mail ou senha inválidos.');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Entrar no painel';
    }
  });

  const renderReports = () => {
    const q = searchReports.value.trim().toLowerCase();
    const status = statusFilter.value;
    const filtered = reports.filter(r => (!status || r.status === status) && (!q || [r.protocol_code,r.id,r.category,r.unit].some(v => String(v||'').toLowerCase().includes(q))));
    if (!filtered.length) { reportList.innerHTML = '<div class="admin-loading">Nenhum relato encontrado.</div>'; return; }
    reportList.innerHTML = filtered.map(r => `<button class="report-item ${r.id===selectedId?'active':''}" data-id="${esc(r.id)}"><div class="report-row"><strong>${esc(r.category)}</strong><span class="status-chip ${esc(r.status)}">${esc(labels[r.status]||r.status)}</span></div><small>${esc(r.unit||'Unidade não informada')} · ${esc(fmt(r.created_at))}</small><small class="report-protocol">${esc(shownProtocol(r))}</small></button>`).join('');
    reportList.querySelectorAll('[data-id]').forEach(btn => btn.addEventListener('click', () => loadDetail(btn.dataset.id)));
  };

  const loadReports = async () => {
    reportList.innerHTML = '<div class="admin-loading">Carregando relatos...</div>';
    const data = await api({action:'list', offset:0});
    reports = data.reports || [];
    renderReports();
  };

  const renderUpdate = u => `<div class="update-box"><strong>${esc(labels[u.status]||u.status)}</strong>${u.public_message?`<p>${esc(u.public_message)}</p>`:''}${u.internal_note?`<p><strong>Nota interna:</strong> ${esc(u.internal_note)}</p>`:''}<small>${esc(fmt(u.created_at))}</small></div>`;

  const loadDetail = async id => {
    selectedId = id; renderReports();
    adminDetail.innerHTML = '<div class="admin-loading">Carregando detalhes...</div>';
    try {
      const data = await api({action:'detail', protocol:id});
      const r = data.report;
      const attachments = data.attachments || [];
      const updates = data.updates || [];
      adminDetail.innerHTML = `
        <div class="detail-head"><div><h2>${esc(r.category)}</h2><div class="detail-protocol">${esc(shownProtocol(r))}</div><p>Criado em ${esc(fmt(r.created_at))}</p></div><span class="status-chip ${esc(r.status)}">${esc(labels[r.status]||r.status)}</span></div>
        <div class="detail-section"><h3>Dados do relato</h3><div class="detail-meta">
          <div class="meta-box"><span>Unidade / setor</span><strong>${esc(r.unit||'Não informado')}</strong></div>
          <div class="meta-box"><span>Quando ocorreu</span><strong>${esc(r.occurred_at||'Não informado')}</strong></div>
          <div class="meta-box"><span>Identificação</span><strong>${r.identity==='anonymous'?'Anônimo':'Identificado'}</strong></div>
          <div class="meta-box"><span>Pessoas envolvidas</span><strong>${esc(r.people||'Não informado')}</strong></div>
          ${r.identity==='identified'?`<div class="meta-box"><span>Nome</span><strong>${esc(r.reporter_name||'—')}</strong></div><div class="meta-box"><span>E-mail</span><strong>${esc(r.reporter_email||'—')}</strong></div>`:''}
        </div></div>
        <div class="detail-section"><h3>Descrição</h3><div class="detail-text">${esc(r.description)}</div></div>
        <div class="detail-section"><h3>Evidências (${attachments.length})</h3><div class="admin-attachments">${attachments.length?attachments.map(a=>`<div class="admin-attachment"><span><strong>${esc(a.original_name)}</strong><small>${esc(a.mime_type)} · ${size(a.size_bytes)} · SHA-256 ${esc((a.sha256||'').slice(0,16))}…</small></span><a class="btn btn-secondary" href="${esc(a.url)}" target="_blank" rel="noopener">Abrir</a></div>`).join(''):'<p>Nenhum anexo enviado.</p>'}</div></div>
        <div class="detail-section"><h3>Histórico</h3><div class="updates-list">${updates.length?updates.map(renderUpdate).join(''):'<p>Nenhuma atualização registrada.</p>'}</div></div>
        <div class="detail-section"><h3>Atualizar tratamento</h3><form id="updateReportForm" class="update-form">
          <div class="admin-field"><label>Status</label><select id="updateStatus"><option value="received" ${r.status==='received'?'selected':''}>Recebido</option><option value="in_review" ${r.status==='in_review'?'selected':''}>Em análise</option><option value="closed" ${r.status==='closed'?'selected':''}>Encerrado</option></select></div>
          <div class="admin-field"><label>Mensagem ao denunciante</label><textarea id="publicMessage" maxlength="4000" placeholder="Opcional. Esta mensagem aparecerá na consulta pública."></textarea></div>
          <div class="admin-field full"><label>Nota interna</label><textarea id="internalNote" maxlength="10000" placeholder="Opcional. Visível apenas na área restrita."></textarea></div>
          <div class="admin-error full" id="updateError"></div>
          <div class="admin-actions full"><button class="btn btn-primary" type="submit" id="saveUpdate">Salvar atualização</button></div>
        </form></div>`;
      document.getElementById('updateReportForm').addEventListener('submit', async event => {
        event.preventDefault();
        const err = document.getElementById('updateError'); err.classList.remove('show');
        const btn = document.getElementById('saveUpdate'); btn.disabled = true; btn.textContent = 'Salvando...';
        try {
          await api({action:'update',protocol:r.id,revision:r.revision,status:document.getElementById('updateStatus').value,publicMessage:document.getElementById('publicMessage').value,internalNote:document.getElementById('internalNote').value});
          await loadReports(); await loadDetail(r.id);
        } catch (error) { err.textContent = error.message; err.classList.add('show'); }
        finally { btn.disabled = false; btn.textContent = 'Salvar atualização'; }
      });
    } catch (error) { adminDetail.innerHTML = `<div class="admin-loading">${esc(error.message)}</div>`; }
  };

  searchReports.addEventListener('input', renderReports);
  statusFilter.addEventListener('change', renderReports);
  logoutBtn.addEventListener('click', async () => { await client.auth.signOut({scope:'local'}); location.reload(); });

  const activate = async currentSession => {
    session = currentSession;
    if (!session) { login.classList.add('active'); panel.classList.remove('active'); return; }
    login.classList.remove('active'); panel.classList.add('active'); reviewerEmail.textContent = session.user?.email || 'Revisor';
    try { await loadReports(); }
    catch (error) { reportList.innerHTML = `<div class="admin-loading">${esc(error.message)}</div>`; }
  };

  client.auth.getSession().then(({data}) => activate(data.session));
  client.auth.onAuthStateChange((event, nextSession) => {
    if (event === 'SIGNED_OUT') activate(null);
    else if (nextSession) activate(nextSession);
  });
})();
