# DigiUrban — imagens de apoio das lojas

Os sete fundos em `masters/` foram gerados pela ferramenta integrada `image_gen` com azul-marinho, azul elétrico e ciano da identidade aprovada. Os prompts completos estão em `generation-prompts.json`. Não foram enviados screenshots para geração de imagens. Não há interfaces artificiais, selos, bandeiras, brasões, promessas adicionais nem molduras de aparelhos.

`play-*-background.png` e `ios-*-background.png` são os 12 fundos de apoio no tamanho final, com as frases exatas aplicadas em Nunito Heavy, branco com destaque em turquesa. A fonte arredondada Nunito e sua licença OFL estão em `fonts/`. Os PNGs em `../final/` acrescentam exclusivamente os screenshots reais correspondentes.

## Reproduzir a montagem

Na raiz do repositório:

```powershell
node digiurban/mobile/scripts/make-store-images.js
```

O script usa Sharp instalado em `mobile/node_modules`, preserva a proporção dos screenshots e aplica apenas redimensionamento Lanczos, cantos arredondados e sombra externa. O conteúdo não é recortado nem retocado. Os arquivos de entrada não são modificados.

Na Play, 78% da largura faria o screenshot ocupar 1872 dos 1920 pixels de altura, deixando apenas 48 pixels para título e margens. Após a escolha do usuário por compactar a área do título, a montagem usa 72% para preservar a imagem inteira e manter a frase legível. No iPhone, a largura é 78%. Não foi aplicado o terço superior reservado da proposta inicial porque isso reduziria a captura da Play para cerca de 51% da largura.

## Validação

`../validation-report.json` registra as dimensões, os limites de cada screenshot, as frases exatas, os hashes das entradas, a comparação pixel a pixel da área interna com os originais redimensionados e a inventariação dos arquivos finais.

As 12 novas imagens são PNG RGB, sem canal alfa. O ícone aprovado preexistente mantém seu canal alfa inteiramente opaco: não tem pixels transparentes. Os dois arquivos aprovados preexistentes são conferidos por SHA-256 e nunca são regravados. Todas as sete capturas finais da Play têm proporção 1920/1080 = 1,7778, inferior a 2. A feature graphic aprovada (1024 × 500) é um banner, não uma captura de tela, portanto não está sujeita a essa condição de proporção.

`preview-play.png` e `preview-ios.png` são folhas de revisão, não arquivos para envio às lojas. Nenhum commit foi feito.
