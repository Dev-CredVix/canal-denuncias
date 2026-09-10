(() => {
  const API_URL = 'https://uexvojgictmkuackpofk.supabase.co/functions/v1/reporting-channel';
  const SUPABASE_URL = 'https://uexvojgictmkuackpofk.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_o9X7Cc1xo4eJUAjdKMW5TQ_JzIcQLJp';
  const BUCKET = 'channel-evidencias';
  const MAX_FILES = 10;
  const MAX_FILE_SIZE = 25 * 1024 * 1024;
  const allowedTypes = new Set(['image/jpeg','image/png','image/webp','application/pdf','text/plain','message/rfc822','audio/mpeg','audio/mp4','audio/x-m4a','audio/ogg','audio/wav','audio/x-wav','video/mp4','video/quicktime']);

  const storageClient = window.supabase?.createClient(SUPABASE_URL, PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const form = document.getElementById('reportForm');
  const steps = [...document.querySelectorAll('.form-step')];
  const progress = [...document.querySelectorAll('.progress-step')];
  const errorBox = document.getElementById('errorBox');
  const description = document.getElementById('description');
  const charCount = document.getElementById('charCount');
  const identityFields = document.getElementById('identityFields');
  const reviewBox = document.getElementById('reviewBox');
  const successScreen = document.getElementById('successScreen');
  const submitBtn = document.getElementById('submitBtn');
  const attachmentInput = document.getElementById('attachmentInput');
  const attachmentList = document.getElementById('attachmentList');
  const uploadStatus = document.getElementById('uploadStatus');
  let currentStep = 1;
  let selectedFiles = [];

  const showError = message => {
    errorBox.textContent = message;
    errorBox.classList.add('show');
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const clearError = () => { errorBox.textContent = ''; errorBox.classList.remove('show'); };
  const escapeHtml = value => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const formatBytes = bytes => bytes < 1024 * 1024 ? `${(bytes/1024).toFixed(0)} KB` : `${(bytes/(1024*1024)).toFixed(1)} MB`;

  const setStep = step => {
    currentStep = Math.max(1, Math.min(4, step));
    steps.forEach(el => el.classList.toggle('active', Number(el.dataset.step) === currentStep));
    progress.forEach(el => {
      const n = Number(el.dataset.progress);
      el.classList.toggle('active', n === currentStep);
      el.classList.toggle('done', n < currentStep);
    });
    clearError();
    window.scrollTo({ top: 72, behavior: 'smooth' });
    if (currentStep === 4) buildReview();
  };

  const data = () => Object.fromEntries(new FormData(form).entries());
  const validateStep = () => {
    const d = data();
    if (currentStep === 1 && !d.category) return 'Selecione uma categoria para continuar.';
    if (currentStep === 2 && (!d.description || d.description.trim().length < 30)) return 'Descreva a situação com pelo menos 30 caracteres.';
    if (currentStep === 3 && d.identity === 'identified') {
      if (!d.name?.trim()) return 'Informe seu nome ou selecione o envio anônimo.';
      if (!d.email?.trim()) return 'Informe seu e-mail ou selecione o envio anônimo.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) return 'Confira o e-mail informado.';
    }
    return null;
  };

  const renderAttachments = () => {
    attachmentList.innerHTML = selectedFiles.map((file, index) => `<div class="attachment-item" data-file-index="${index}"><div class="attachment-meta"><span class="attachment-name">${escapeHtml(file.name)}</span><span class="attachment-size">${escapeHtml(file.type || 'arquivo')} · ${formatBytes(file.size)}</span><div class="attachment-progress"><span></span></div></div><button class="attachment-remove" type="button" data-remove-file="${index}">Remover</button></div>`).join('');
    attachmentList.querySelectorAll('[data-remove-file]').forEach(btn => btn.addEventListener('click', () => {
      selectedFiles.splice(Number(btn.dataset.removeFile), 1);
      renderAttachments();
    }));
  };

  attachmentInput?.addEventListener('change', () => {
    const incoming = [...attachmentInput.files];
    for (const file of incoming) {
      if (selectedFiles.length >= MAX_FILES) { showError(`É possível anexar no máximo ${MAX_FILES} arquivos.`); break; }
      if (!allowedTypes.has(file.type)) { showError(`O arquivo “${file.name}” está em um formato não permitido.`); continue; }
      if (file.size < 1 || file.size > MAX_FILE_SIZE) { showError(`O arquivo “${file.name}” deve ter no máximo 25 MB.`); continue; }
      const duplicate = selectedFiles.some(item => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified);
      if (!duplicate) selectedFiles.push(file);
    }
    attachmentInput.value = '';
    renderAttachments();
  });

  const buildReview = () => {
    const d = data();
    const rows = [
      ['Categoria', d.category || '—'],
      ['Unidade / setor', d.unit || 'Não informado'],
      ['Quando', d.when || 'Não informado'],
      ['Pessoas envolvidas', d.people || 'Não informado'],
      ['Descrição', d.description || '—'],
      ['Evidências', selectedFiles.length ? `${selectedFiles.length} arquivo(s) selecionado(s)` : 'Nenhum anexo'],
      ['Identificação', d.identity === 'identified' ? 'Identificado' : 'Anônimo'],
    ];
    if (d.identity === 'identified') rows.push(['Nome', d.name || '—'], ['E-mail', d.email || '—']);
    reviewBox.innerHTML = rows.map(([k,v]) => `<div class="review-row"><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('');
  };

  document.querySelectorAll('[data-next]').forEach(btn => btn.addEventListener('click', () => {
    const err = validateStep();
    if (err) return showError(err);
    setStep(currentStep + 1);
  }));
  document.querySelectorAll('[data-back]').forEach(btn => btn.addEventListener('click', () => setStep(currentStep - 1)));
  description.addEventListener('input', () => { charCount.textContent = description.value.length; });
  document.querySelectorAll('input[name="identity"]').forEach(input => input.addEventListener('change', () => {
    identityFields.hidden = document.querySelector('input[name="identity"]:checked')?.value !== 'identified';
  }));

  const randomHex = bytes => {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    return [...arr].map(x => x.toString(16).padStart(2, '0')).join('');
  };
  const hashFile = async file => {
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2,'0')).join('');
  };
  const api = async payload => {
    const response = await fetch(API_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Não foi possível concluir a operação.');
    return body;
  };

  const uploadEvidence = async (file, protocol, secret, index) => {
    if (!storageClient) throw new Error('O módulo de upload não carregou. Atualize a página e tente novamente.');
    const item = attachmentList.querySelector(`[data-file-index="${index}"]`);
    const bar = item?.querySelector('.attachment-progress span');
    if (bar) bar.style.width = '15%';
    const init = await api({ action:'attachment_init', protocol, secret, fileName:file.name, mimeType:file.type, sizeBytes:file.size });
    if (bar) bar.style.width = '35%';
    const { error: uploadError } = await storageClient.storage.from(BUCKET).uploadToSignedUrl(init.path, init.token, file, { contentType:file.type, upsert:false });
    if (uploadError) throw new Error(`Falha ao enviar “${file.name}”.`);
    if (bar) bar.style.width = '78%';
    const digest = await hashFile(file);
    await api({ action:'attachment_complete', protocol, secret, path:init.path, fileName:file.name, mimeType:file.type, sizeBytes:file.size, sha256:digest });
    if (bar) bar.style.width = '100%';
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    clearError();
    if (!document.getElementById('goodFaith').checked) return showError('Confirme a declaração de boa-fé antes de enviar.');
    const d = data();
    const err = validateStep();
    if (err) return showError(err);

    const requestId = crypto.randomUUID();
    const secret = randomHex(32);
    const payload = { action:'submit', requestId, secret, website:d.website || '', report:{ category:d.category, identity:d.identity, description:d.description.trim(), unit:(d.unit||'').trim(), when:(d.when||'').trim(), people:(d.people||'').trim(), name:d.identity==='identified'?(d.name||'').trim():'', email:d.identity==='identified'?(d.email||'').trim():'' } };

    submitBtn.disabled = true;
    submitBtn.textContent = selectedFiles.length ? 'Enviando relato...' : 'Enviando...';
    try {
      const body = await api(payload);
      const protocol = body.protocol;
      const accessCode = `${protocol}.${secret}`;
      document.getElementById('accessCode').textContent = accessCode;

      let uploaded = 0;
      const failures = [];
      if (selectedFiles.length) {
        uploadStatus.hidden = false;
        for (let i = 0; i < selectedFiles.length; i++) {
          submitBtn.textContent = `Enviando anexo ${i+1}/${selectedFiles.length}...`;
          try { await uploadEvidence(selectedFiles[i], protocol, secret, i); uploaded++; }
          catch (e) { failures.push(selectedFiles[i].name); }
        }
        uploadStatus.textContent = failures.length
          ? `Relato registrado. ${uploaded} de ${selectedFiles.length} anexo(s) foram enviados. Você poderá tentar adicionar os demais pela página de consulta usando seu código.`
          : `${uploaded} anexo(s) enviados com sucesso e vinculados ao relato.`;
      }

      form.style.display = 'none';
      document.querySelector('.progress').style.display = 'none';
      successScreen.classList.add('show');
      window.scrollTo({ top: 70, behavior: 'smooth' });
    } catch (error) {
      showError(error.message || 'Não foi possível concluir o envio. Tente novamente.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar denúncia';
    }
  });

  document.getElementById('copyCode').addEventListener('click', async () => {
    const value = document.getElementById('accessCode').textContent;
    try { await navigator.clipboard.writeText(value); document.getElementById('copyCode').textContent = 'Copiado'; setTimeout(() => { document.getElementById('copyCode').textContent = 'Copiar'; }, 1700); }
    catch { window.getSelection()?.selectAllChildren(document.getElementById('accessCode')); }
  });
})();
