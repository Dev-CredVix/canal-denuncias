(() => {
  const API_URL = 'https://uexvojgictmkuackpofk.supabase.co/functions/v1/reporting-channel';
  const form = document.getElementById('lookupForm');
  const codeInput = document.getElementById('code');
  const errorBox = document.getElementById('lookupError');
  const resultCard = document.getElementById('resultCard');
  const lookupBtn = document.getElementById('lookupBtn');
  const statusBadge = document.getElementById('statusBadge');
  const updatesList = document.getElementById('updatesList');
  const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
  const secret = /^[a-f0-9]{64}$/i;
  const statusLabel = { received: 'Recebido', in_review: 'Em análise', closed: 'Encerrado' };

  const showError = message => { errorBox.textContent = message; errorBox.classList.add('show'); resultCard.classList.remove('show'); };
  const clearError = () => { errorBox.textContent = ''; errorBox.classList.remove('show'); };
  const escapeHtml = value => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const formatDate = value => {
    try { return new Intl.DateTimeFormat('pt-BR', { dateStyle:'medium', timeStyle:'short' }).format(new Date(value)); }
    catch { return value || ''; }
  };

  const parseCode = value => {
    const trimmed = value.trim();
    const dot = trimmed.indexOf('.');
    if (dot < 0) return null;
    const protocol = trimmed.slice(0, dot);
    const key = trimmed.slice(dot + 1);
    return uuid.test(protocol) && secret.test(key) ? { protocol, secret:key } : null;
  };

  const paintStatus = status => {
    statusBadge.className = `status-badge ${status}`;
    statusBadge.textContent = statusLabel[status] || status;
    const order = ['received','in_review','closed'];
    const current = order.indexOf(status);
    document.querySelectorAll('.flow-step').forEach((el, index) => el.classList.toggle('active', index <= current));
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    clearError();
    const parsed = parseCode(codeInput.value);
    if (!parsed) return showError('Confira o código de acompanhamento e tente novamente.');
    lookupBtn.disabled = true;
    lookupBtn.textContent = 'Consultando...';
    try {
      const response = await fetch(API_URL, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ action:'lookup', protocol:parsed.protocol, secret:parsed.secret })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Não foi possível consultar o relato agora.');
      document.getElementById('protocolLine').textContent = `Protocolo ${body.protocol} · enviado em ${formatDate(body.created_at)}`;
      paintStatus(body.status);
      const updates = Array.isArray(body.updates) ? body.updates : [];
      updatesList.innerHTML = updates.length
        ? updates.map(update => `<article class="update-item"><strong>${escapeHtml(statusLabel[update.status] || update.status)}</strong>${update.message ? `<p>${escapeHtml(update.message)}</p>` : ''}<time>${escapeHtml(formatDate(update.created_at))}</time></article>`).join('')
        : '<p class="empty-updates">Ainda não há mensagens públicas adicionais para este relato.</p>';
      resultCard.classList.add('show');
      resultCard.scrollIntoView({ behavior:'smooth', block:'start' });
    } catch (error) {
      showError(error.message || 'Não foi possível consultar o relato.');
    } finally {
      lookupBtn.disabled = false;
      lookupBtn.textContent = 'Consultar';
    }
  });
})();
