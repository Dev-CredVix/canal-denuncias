# Canal de Denúncias Credvix — MVP

Frontend estático para GitHub Pages, inspirado na arquitetura visual e de navegação do canal de denúncias usado como referência.

## Estrutura

- `index.html` — landing page institucional.
- `formulario.html` — formulário em quatro etapas.
- `consultar.html` — consulta pública do andamento.
- `assets/styles.css` — identidade visual, responsividade e componentes.
- `assets/app.js` — navegação, menu móvel, FAQ e CTA flutuante.
- `assets/formulario.js` — validação e envio da denúncia.
- `assets/consultar.js` — consulta do andamento.
- `assets/logo-credvix.webp` — logo fornecida para o projeto.

## Backend usado

Supabase Edge Function:

`https://uexvojgictmkuackpofk.supabase.co/functions/v1/reporting-channel`

A função já implementa `submit` e `lookup`. O frontend não contém `service_role` nem credenciais administrativas.

## GitHub Pages

Os caminhos são relativos para funcionar em `https://dev-credvix.github.io/canal-denuncias/`.

Antes de publicar, confirme que `CHANNEL_ALLOWED_ORIGINS` da Edge Function contém `https://dev-credvix.github.io`.

## Escopo do MVP

Incluído: denúncia anônima ou identificada, protocolo/código de acompanhamento e consulta de status.

Fora desta versão: anexos, alertas por Resend e painel administrativo de tratamento.
