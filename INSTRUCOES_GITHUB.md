# Como subir isso no GitHub e ativar o portfolio

## 1. Criar o repositório

```bash
# No terminal, na pasta portfolio/
git init
git add .
git commit -m "Portfolio inicial · Kairós SUS + Argos"
git branch -M main

# Cria o repo no GitHub (nome sugerido: rafael-sobral-portfolio ou portfolio)
# Depois conecta e sobe:
git remote add origin https://github.com/SEU_USUARIO/rafael-sobral-portfolio.git
git push -u origin main
```

Dica de nome: se chamar o repo de **`seuusuario.github.io`** (com seu usuário real), a GitHub Pages fica ativa automaticamente em `https://seuusuario.github.io` sem precisar configurar nada.

## 2. Ativar GitHub Pages (se o repo tiver outro nome)

No repositório → **Settings → Pages**:
- Source: **Deploy from a branch**
- Branch: **main** · **/ (root)**
- Save

Em 1–2 minutos o site fica no ar em `https://seuusuario.github.io/nome-do-repo/`.

O README.md da raiz vira a página inicial automaticamente, com formatação Markdown.

## 3. Adicionar os PDFs

Copie os arquivos para as pastas certas:

```
portfolio/
├── README.md                          ← página inicial
├── kairos-sus/
│   ├── README.md                      ← case study
│   ├── pitch_roteiro.md
│   └── Kairos_Global_Solution_Rafael_Sobral_RM572127_FINAL.pdf
└── argos/
    ├── README.md                      ← case study (completar)
    └── Argos_Global_Solution.pdf      ← adicionar
```

Os links nos READMEs já apontam pros nomes acima, basta colocar o arquivo no lugar.

## 4. Visual mais polido (opcional, pra depois)

Se quiser um visual além do Markdown padrão do GitHub:

- **Jekyll** (nativo do GitHub Pages): escolha um tema em Settings → Pages → Theme chooser. Recomendo "Minimal" ou "Cayman" pra portfolio
- **Alternativa mais moderna**: repositório com tema **al-folio** (clona e customiza) ou um site estático simples em HTML/CSS. Mas pro primeiro momento, o Markdown + tema nativo resolve bem

## 5. Divulgar

Lugares pra colocar o link:

- **LinkedIn** → Perfil → "Portfolio" ou destacar no "Sobre"
- **LinkedIn Projects**: criar entrada pra Kairós SUS e Argos apontando pro case
- **Assinatura de email** profissional
- **CV**: substituir "Projeto acadêmico X" por link clicável
