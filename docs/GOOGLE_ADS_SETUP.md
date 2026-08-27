# Google Ads e Consent Mode v2

O portal utiliza a Google tag `AW-18397690648` nas páginas públicas. A
instalação foi feita diretamente no código Next.js; ela não deve ser repetida
no Wix, na Vercel ou em outro gerenciador, para evitar medições duplicadas.

## Comportamento de consentimento

O site usa o Consent Mode v2 avançado:

- os sinais `ad_storage`, `analytics_storage`, `ad_user_data` e
  `ad_personalization` começam como `denied` quando não existe uma escolha;
- a Google tag pode enviar sinais de consentimento e medições sem cookies nesse
  estado;
- **Aceitar** atualiza os quatro sinais para `granted`;
- **Recusar** mantém os quatro sinais como `denied`;
- a decisão versionada é salva no `localStorage` do navegador;
- o botão **Preferências de privacidade** permite alterar ou revogar a escolha;
- `/admin`, `/auth` e `/integracoes` não carregam a tag de rede do Google em um
  acesso direto.

A página pública `/privacidade` explica esse funcionamento aos visitantes.

## Conversão de visita ao site

A tag-base conecta o domínio à conta Google Ads e permite a configuração de
medição. O evento específico recebido da conta da Arena Sul está configurado
com o identificador completo:

```text
AW-18397690648/Jok9CPrJ6-gcEJj22cRE
```

No carregamento de uma página pública, depois da configuração da Google tag, o
site envia uma vez por carregamento do documento:

```javascript
gtag("event", "conversion", {
  send_to: "AW-18397690648/Jok9CPrJ6-gcEJj22cRE",
});
```

O evento não depende mais de cliques no WhatsApp. Ele mantém o significado
original da ação **Page view (1)** enviada pelo cliente: uma visita a uma página
pública do site. A área administrativa, autenticação e integrações permanecem
fora dessa medição.

Essa conversão é usada pelo Google Ads para relacionar visitas às interações com
anúncios. Para um relatório completo de todos os visitantes, sessões e origens
do tráfego, deve-se usar também uma propriedade do Google Analytics 4 com um ID
de medição `G-...`, sem repetir a biblioteca `gtag.js`.

## Validação depois do deploy

1. Abra o site em uma janela anônima.
2. Inicie uma sessão no [Google Tag Assistant](https://tagassistant.google.com/).
3. Antes de escolher no banner, confirme os quatro sinais como `denied`.
4. Clique em **Aceitar** e confirme um `consent update` com os quatro sinais como
   `granted`.
5. Reabra **Preferências de privacidade**, clique em **Recusar** e confirme um
   novo `update` como `denied`.
6. Recarregue a página para validar a persistência.
7. Abra `/admin/login` diretamente e confirme que `gtag/js` não é requisitado.
8. Recarregue uma página pública e confirme um único evento `conversion` com o
   `send_to` `AW-18397690648/Jok9CPrJ6-gcEJj22cRE`.
9. Clique em um CTA do WhatsApp e confirme que o clique não gera outro evento
   com esse `send_to`.
10. Confirme que existe somente uma tag `AW-18397690648` e um evento de
    conversão por carregamento do documento.

O painel do Google Ads pode levar algum tempo para atualizar o diagnóstico,
mesmo quando a requisição já está correta no navegador.

## Referências oficiais

- [Configurar o Consent Mode em sites](https://developers.google.com/tag-platform/security/guides/consent)
- [Consent Mode básico e avançado](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [Diagnosticar o consentimento no Tag Assistant](https://developers.google.com/tag-platform/security/guides/consent-debugging)
