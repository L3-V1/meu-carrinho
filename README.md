# Meu Carrinho

Lista de desejos de compras online: cadastre produtos com link, preço e loja, acompanhe o que falta comprar e quanto você já investiu.

**Acesse:** https://l3-v1.github.io/meu-carrinho/

## Como funciona

- Aplicação estática (HTML, CSS e JavaScript puro), sem etapa de build.
- Os dados ficam salvos apenas no seu navegador (`localStorage`). Nada é enviado para servidores.
- Reconhece automaticamente lojas como Amazon, Mercado Livre, Shopee, KaBuM, Magalu, Shein, AliExpress, Pichau e Terabyte pelo link do produto.

## Rodando localmente

Abra o `index.html` no navegador ou sirva a pasta com qualquer servidor estático:

```bash
python3 -m http.server 8000
```

## Publicação

O site é publicado pelo GitHub Pages a partir da raiz da branch `main`. Cada push na `main` atualiza o site.
