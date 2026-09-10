(() => {
  const API_URL = 'https://uexvojgictmkuackpofk.supabase.co/functions/v1/reporting-channel';
  const SUPABASE_URL = 'https://uexvojgictmkuackpofk.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_o9X7Cc1xo4eJUAjdKMW5TQ_JzIcQLJp';
  const BUCKET = 'channel-evidencias';
  const MAX_FILE_SIZE = 25 * 1024 * 1024;
  const allowedTypes = new Set(['image/jpeg','image/png','image/webp','application/pdf','text/plain','message/rfc822','audio/mpeg','audio/mp4','audio/x-m4a','audio/ogg','audio/wav','audio/x-wav','video/mp4','video/quicktime']);
  const storageClient = window.supabase?.createClient(SUPABASE_URL, PUBLISHABLE_KEY, { auth:{ persistSession:false, autoRefreshToken:false } });

  const form = document.getElementById('lookupForm');
  const codeInput = document.getElementById('code');
  const errorBox = document.getElementById('lookupError');
  const resultCard = document.getElementById('resultCard');
  const lookupBtn = document.getElementById('lookupBtn');
  const statusBadge = document.getElementById('statusBadge');
  const updatesList = document.getElementById('updatesList');
  const evidenceList = document.getElementById('evidenceList');
  const attachmentActions = document.getElementById('attachmentActions');
  const attachmentInput = document.getElementById('consultAttachmentInput');
  const uploadStatus = document.getElementById('consultUploadStatus');
  const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
  const secret = /^[a-f0-9]{64}$/i;
  const statusLabel = { received:'Recebido', in_review:'Em análise', closed:'Encerrado' };
  let currentCredentials = null;
  let currentStatus = null;
  let currentAttachmentCount = 0;

  const showError = message => { errorBox.textContent = message; errorBox.classList.add('show'); resultCard.classList.remove('show'); };
  const clearError = () => { errorBox.textContent = ''; errorBox.classList.remove('show'); };
  const escapeHtml = value => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const formatDate = value => { try { return new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)); } catch { return value || ''; } };
  const formatBytes = bytes => bytes < 1024*1024 ? `${(bytes/1024).toFixed(0)} KB` : `${(bytes/(1024*1024)).toFixed(1)} MB`;

  const parseCode = value => {
    const trimmed=value.trim(); const dot=trimmed.indexOf('.'); if(dot<0)return null;
    const protocol=trimmed.slice(0,dot); const key=trimmed.slice(dot+1);
    return uuid.test(protocol)&&secret.test(key)?{protocol,secret:key}:null;
  };
  const api = async payload => {
    const response=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const body=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(body.error||'Não foi possível concluir a operação.');
    return body;
  };
  const paintStatus = status => {
    statusBadge.className=`status-badge ${status}`; statusBadge.textContent=statusLabel[status]||status;
    const order=['received','in_review','closed']; const current=order.indexOf(status);
    document.querySelectorAll('.flow-step').forEach((el,index)=>el.classList.toggle('active',index<=current));
  };
  const hashFile = async file => {
    const digest=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());
    return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  };

  const loadAttachments = async () => {
    if(!currentCredentials)return;
    const body=await api({action:'attachment_list',...currentCredentials});
    const files=Array.isArray(body.attachments)?body.attachments:[];
    currentAttachmentCount=files.length;
    evidenceList.innerHTML=files.length?files.map(file=>`<a class="evidence-link" href="${escapeHtml(file.url)}" target="_blank" rel="noopener noreferrer"><span><strong>${escapeHtml(file.name)}</strong><small>${escapeHtml(file.mime_type)} · ${formatBytes(file.size_bytes)} · ${escapeHtml(formatDate(file.created_at))}</small></span><span aria-hidden="true">↗</span></a>`).join(''):'<p class="empty-updates">Nenhuma evidência foi anexada até o momento.</p>';
    attachmentActions.hidden=currentStatus==='closed'||currentAttachmentCount>=10;
  };

  form.addEventListener('submit',async event=>{
    event.preventDefault(); clearError();
    const parsed=parseCode(codeInput.value); if(!parsed)return showError('Confira o código de acompanhamento e tente novamente.');
    lookupBtn.disabled=true; lookupBtn.textContent='Consultando...';
    try{
      const body=await api({action:'lookup',...parsed});
      currentCredentials=parsed; currentStatus=body.status; currentAttachmentCount=Number(body.attachment_count||0);
      document.getElementById('protocolLine').textContent=`Protocolo ${body.protocol} · enviado em ${formatDate(body.created_at)}`;
      paintStatus(body.status);
      const updates=Array.isArray(body.updates)?body.updates:[];
      updatesList.innerHTML=updates.length?updates.map(update=>`<article class="update-item"><strong>${escapeHtml(statusLabel[update.status]||update.status)}</strong>${update.message?`<p>${escapeHtml(update.message)}</p>`:''}<time>${escapeHtml(formatDate(update.created_at))}</time></article>`).join(''):'<p class="empty-updates">Ainda não há mensagens públicas adicionais para este relato.</p>';
      resultCard.classList.add('show');
      await loadAttachments();
      resultCard.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(error){showError(error.message||'Não foi possível consultar o relato.');}
    finally{lookupBtn.disabled=false;lookupBtn.textContent='Consultar';}
  });

  attachmentInput?.addEventListener('change',async()=>{
    if(!currentCredentials||currentStatus==='closed')return;
    const files=[...attachmentInput.files]; attachmentInput.value='';
    if(!files.length)return;
    if(currentAttachmentCount+files.length>10){uploadStatus.hidden=false;uploadStatus.textContent=`Esta denúncia aceita no máximo 10 anexos. Você ainda pode adicionar ${Math.max(0,10-currentAttachmentCount)}.`;return;}
    if(!storageClient){uploadStatus.hidden=false;uploadStatus.textContent='O módulo de upload não carregou. Atualize a página.';return;}
    let uploaded=0; const failed=[]; uploadStatus.hidden=false;
    for(let i=0;i<files.length;i++){
      const file=files[i];
      if(!allowedTypes.has(file.type)||file.size<1||file.size>MAX_FILE_SIZE){failed.push(file.name);continue;}
      uploadStatus.textContent=`Enviando ${i+1} de ${files.length}: ${file.name}`;
      try{
        const init=await api({action:'attachment_init',...currentCredentials,fileName:file.name,mimeType:file.type,sizeBytes:file.size});
        const {error}=await storageClient.storage.from(BUCKET).uploadToSignedUrl(init.path,init.token,file,{contentType:file.type,upsert:false});
        if(error)throw error;
        const digest=await hashFile(file);
        await api({action:'attachment_complete',...currentCredentials,path:init.path,fileName:file.name,mimeType:file.type,sizeBytes:file.size,sha256:digest});
        uploaded++;
      }catch{failed.push(file.name);}
    }
    uploadStatus.textContent=failed.length?`${uploaded} arquivo(s) enviado(s). ${failed.length} não puderam ser anexados.`:`${uploaded} arquivo(s) anexado(s) com sucesso.`;
    await loadAttachments().catch(()=>{});
  });
})();
