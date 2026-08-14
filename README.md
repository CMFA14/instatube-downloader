# 🎬 InstaTube Downloader

Um downloader web moderno, rápido e com interface *glassmorphism* para baixar **Instagram Reels** e vídeos/Shorts do **YouTube** diretamente no seu computador em alta qualidade.

---

## ✨ Funcionalidades

- 📥 **Suporte Duplo**: Baixe vídeos do **Instagram Reels** e do **YouTube** (incluindo Shorts).
- 🚀 **Sem necessidade de FFmpeg**: Pré-configurado para selecionar a melhor qualidade pré-mesclada em MP4 automaticamente.
- 🎨 **Interface Premium**: Design escuro com efeito de vidro fosco (*glassmorphism*), animações suaves e responsivo.
- 📊 **Progresso em Tempo Real**: Acompanhe o percentual e a quantidade de megabytes baixados em tempo real pelo navegador.
- ⚡ **Execução com 1 Clique**: Script `run.bat` automatizado para Windows (cria o ambiente virtual, instala dependências e abre o navegador).

---

## 🛠️ Tecnologias Utilizadas

- **Backend**: Python 3, [Flask](https://flask.palletsprojects.com/), [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- **Frontend**: HTML5, CSS3 (Vanilla com Glassmorphism & Variáveis CSS), JavaScript Vanilla

---

## 🚀 Como Executar

### Opção 1: Windows (Mais Fácil)
Basta dar um duplo clique no arquivo:
```bash
run.bat
```
O script configurará o ambiente virtual `.venv`, atualizará as dependências e abrirá a aplicação em `http://127.0.0.1:5000` no seu navegador.

### Opção 2: Manualmente via Terminal

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/CMFA14/instatube-downloader.git
   cd instatube-downloader
   ```

2. **Crie e ative o ambiente virtual:**
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate
   ```

3. **Instale as dependências:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Inicie o servidor:**
   ```bash
   python app.py
   ```

5. **Acesse no navegador:**
   Abra [http://127.0.0.1:5000](http://127.0.0.1:5000).

---

## 📄 Licença

Este projeto é de uso livre para fins educacionais e pessoais. Não é afiliado ao Instagram, Meta, YouTube ou Google.
