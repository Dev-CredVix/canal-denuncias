(() => {
  const API_URL = 'https://uexvojgictmkuackpofk.supabase.co/functions/v1/reporting-channel';
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
  let currentStep = 1;

  const showError = message => {
    errorBox.textContent = message;
    errorBox.classList.add('show');
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const clearError = () => { errorBox.textContent = ''; errorBox.classList.remove('show'); };

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

  const buildReview = () => {
    const d = data();
    const rows = [
      ['Categoria', d.category || '—'],
      ['Unidade / setor', d.unit || 'Não informado'],
      ['Quando', d.when || 'Não informado'],
      ['Pessoas envolvidas', d.people || 'Não informado'],
      ['Descrição', d.description || '—'],
      ['Identificação', d.identity === 'identified' ? 'Identificado' : 'Anônimo'],
    ];
    if (d.identity === 'identified') rows.push(['Nome', d.name || '—'], ['E-mail', d.email || '—']);
    reviewBox.innerHTML = rows.map(([k,v]) => `<div class="review-row"><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('');
  };

  const escapeHtml = value => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

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

  form.addEventListener('submit', async event => {
    event.preventDefault();
    clearError();
    if (!document.getElementById('goodFaith').checked) return showError('Confirme a declaração de boa-fé antes de enviar.');
    const d = data();
    const err = validateStep();
    if (err) return showError(err);

    const requestId = crypto.randomUUID();
    const secret = randomHex(32);
    const payload = {
      action: 'submit',
      requestId,
      secret,
      website: d.website || '',
      report: {
        category: d.category,
        identity: d.identity,
        description: d.description.trim(),
        unit: (d.unit || '').trim(),
        when: (d.when || '').trim(),
        people: (d.people || '').trim(),
        name: d.identity === 'identified' ? (d.name || '').trim() : '',
        email: d.identity === 'identified' ? (d.email || '').trim() : ''
      }
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Não foi possível enviar a denúncia agora.');
      const accessCode = `${body.protocol}.${secret}`;
      form.style.display = 'none';
      document.querySelector('.progress').style.display = 'none';
      successScreen.classList.add('show');
      document.getElementById('accessCode').textContent = accessCode;
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
    try {
      await navigator.clipboard.writeText(value);
      document.getElementById('copyCode').textContent = 'Copiado';
      setTimeout(() => { document.getElementById('copyCode').textContent = 'Copiar'; }, 1700);
    } catch {
      window.getSelection()?.selectAllChildren(document.getElementById('accessCode'));
    }
  });
})();
