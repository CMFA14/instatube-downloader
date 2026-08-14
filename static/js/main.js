document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const downloadForm = document.getElementById('download-form');
    const reelUrlInput = document.getElementById('reel-url');
    const pasteBtn = document.getElementById('paste-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    // States
    const downloaderCard = document.getElementById('downloader-card');
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const previewState = document.getElementById('preview-state');
    
    // Error elements
    const errorMessage = document.getElementById('error-message');
    const errorBackBtn = document.getElementById('error-back-btn');
    
    // Preview elements
    const previewThumbnail = document.getElementById('preview-thumbnail');
    const previewDuration = document.getElementById('preview-duration');
    const previewTitle = document.getElementById('preview-title');
    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    // Progress elements
    const progressContainer = document.getElementById('download-progress-container');
    const progressBar = document.getElementById('download-progress-bar');
    const progressText = document.querySelector('.progress-text');
    
    let savedUrl = '';

    // Clipboard Paste Feature
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            reelUrlInput.value = text;
            reelUrlInput.focus();
        } catch (err) {
            console.error('Falha ao ler área de transferência: ', err);
            // Fallback: alert the user or do nothing
        }
    });

    // Reset interface to form state
    function showFormState() {
        // Hide states
        loadingState.classList.add('hidden');
        errorState.classList.add('hidden');
        previewState.classList.add('hidden');
        
        // Show form
        downloadForm.classList.remove('hidden');
        
        // Reset progress bar
        progressContainer.classList.add('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = 'Iniciando download... Por favor, não feche esta página.';
        downloadBtn.removeAttribute('disabled');
    }

    function showLoadingState() {
        downloadForm.classList.add('hidden');
        errorState.classList.add('hidden');
        previewState.classList.add('hidden');
        loadingState.classList.remove('hidden');
    }

    function showErrorState(message) {
        loadingState.classList.add('hidden');
        downloadForm.classList.add('hidden');
        previewState.classList.add('hidden');
        
        errorMessage.textContent = message || 'Ocorreu um erro desconhecido. Verifique o link e tente novamente.';
        errorState.classList.remove('hidden');
    }

    function showPreviewState(data) {
        loadingState.classList.add('hidden');
        downloadForm.classList.add('hidden');
        errorState.classList.add('hidden');
        
        previewThumbnail.src = data.thumbnail || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=300&auto=format&fit=crop';
        
        if (data.duration) {
            previewDuration.textContent = data.duration;
            previewDuration.classList.remove('hidden');
        } else {
            previewDuration.classList.add('hidden');
        }
        
        previewTitle.textContent = data.title || 'Vídeo';
        savedUrl = data.url;
        
        previewState.classList.remove('hidden');
    }

    // URL Validation for Instagram Reels and YouTube
    function isValidUrl(url) {
        try {
            const parsed = new URL(url);
            const hostname = parsed.hostname.toLowerCase();
            
            // Check Instagram
            if (hostname.includes('instagram.com')) {
                const pathname = parsed.pathname;
                return pathname.startsWith('/reel/') || 
                       pathname.startsWith('/reels/') || 
                       pathname.startsWith('/p/') || 
                       pathname.startsWith('/tv/') || 
                       pathname.includes('/share/');
            }
            
            // Check YouTube
            if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
                return true;
            }
            
            return false;
        } catch (e) {
            return false;
        }
    }

    // Form Submission: Fetch Info
    downloadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = reelUrlInput.value.trim();
        
        if (!url) return;
        
        if (!isValidUrl(url)) {
            showErrorState('Por favor, insira um link válido de Instagram Reels ou YouTube (ex: https://www.instagram.com/reel/... ou https://www.youtube.com/watch?v=...)');
            return;
        }
        
        showLoadingState();
        
        try {
            const response = await fetch('/api/info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: url })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                showPreviewState(data);
            } else {
                showErrorState(data.error);
            }
        } catch (err) {
            console.error(err);
            showErrorState('Erro de rede. Verifique se o servidor Flask está rodando e tente novamente.');
        }
    });

    // Reset Buttons
    resetBtn.addEventListener('click', showFormState);
    errorBackBtn.addEventListener('click', showFormState);

    // Download Video Action with Live Progress Bar
    downloadBtn.addEventListener('click', async () => {
        if (!savedUrl) return;
        
        // Update UI to download progress state
        downloadBtn.setAttribute('disabled', 'true');
        progressContainer.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = 'Conectando ao servidor...';
        
        try {
            const downloadUrl = `/api/download?url=${encodeURIComponent(savedUrl)}`;
            const response = await fetch(downloadUrl);
            
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || 'Erro ao efetuar o download no servidor.');
            }
            
            // Get content length for progress
            const contentLength = response.headers.get('Content-Length');
            const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
            
            // Setup reader for progress stream
            const reader = response.body.getReader();
            let receivedBytes = 0;
            const chunks = [];
            
            progressText.textContent = 'Baixando vídeo...';
            
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    break;
                }
                
                chunks.push(value);
                receivedBytes += value.length;
                
                if (totalBytes > 0) {
                    const percentage = Math.round((receivedBytes / totalBytes) * 100);
                    progressBar.style.width = `${percentage}%`;
                    const currentMB = (receivedBytes / (1024 * 1024)).toFixed(1);
                    const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
                    progressText.textContent = `Baixando: ${percentage}% (${currentMB}MB de ${totalMB}MB)`;
                } else {
                    const currentMB = (receivedBytes / (1024 * 1024)).toFixed(1);
                    progressText.textContent = `Baixando: ${currentMB}MB (tamanho desconhecido)`;
                    // Simulated progress movement since we don't have total size
                    const simulatedPercent = Math.min(Math.round(receivedBytes / 500000), 95);
                    progressBar.style.width = `${simulatedPercent}%`;
                }
            }
            
            // Finalize
            progressBar.style.width = '100%';
            progressText.textContent = 'Download concluído! Salvando arquivo...';
            
            // Extract filename from headers
            const disposition = response.headers.get('Content-Disposition');
            let filename = 'video.mp4';
            if (disposition && disposition.includes('filename=')) {
                const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }
            
            // Create download link and trigger it
            const blob = new Blob(chunks, { type: 'video/mp4' });
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = filename;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Short delay to let the browser save, then reset button state
            setTimeout(() => {
                downloadBtn.removeAttribute('disabled');
                progressText.textContent = 'Salvo com sucesso!';
            }, 2000);
            
        } catch (error) {
            console.error('Erro de download:', error);
            alert(`Erro ao baixar o vídeo: ${error.message}\nTente baixar novamente.`);
            downloadBtn.removeAttribute('disabled');
            progressContainer.classList.add('hidden');
        }
    });
});
