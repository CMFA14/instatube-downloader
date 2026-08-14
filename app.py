import os
import uuid
import tempfile
import logging
from flask import Flask, request, jsonify, render_template, send_file, after_this_request
import yt_dlp

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Ensure a temporary directory exists for downloads
TEMP_DIR = os.path.join(tempfile.gettempdir(), 'instatube_downloader')
os.makedirs(TEMP_DIR, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/info', methods=['POST'])
def get_info():
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({'success': False, 'error': 'Nenhuma URL fornecida.'}), 400
    
    url = data['url'].strip()
    if not url:
        return jsonify({'success': False, 'error': 'A URL não pode estar vazia.'}), 400

    logger.info(f"Fetching info for URL: {url}")
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'nocheckcertificate': True,
        'rm_cache_dir': True,
        'extractor_args': {
            'youtube': {
                'player_client': ['web_embedded', 'mweb', 'default', '-android_sdkless']
            }
        }
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Extract relevant details
            title = info.get('title') or info.get('description') or 'Vídeo'
            # Clean title if it's too long
            if len(title) > 80:
                title = title[:77] + '...'
                
            thumbnail = info.get('thumbnail')
            duration = info.get('duration')
            
            # Format duration as MM:SS
            duration_str = None
            if duration:
                minutes = int(duration // 60)
                seconds = int(duration % 60)
                duration_str = f"{minutes:02d}:{seconds:02d}"
            
            return jsonify({
                'success': True,
                'title': title,
                'thumbnail': thumbnail,
                'duration': duration_str,
                'url': url
            })
            
    except yt_dlp.utils.DownloadError as e:
        logger.error(f"yt-dlp DownloadError: {str(e)}")
        # Check for typical private/login error messages
        err_msg = str(e)
        if "login" in err_msg.lower() or "private" in err_msg.lower():
            friendly_err = "Este conteúdo é privado ou requer login para ser visualizado."
        else:
            friendly_err = "Não foi possível extrair informações deste link. Verifique se o link está correto e se o conteúdo é público."
        return jsonify({'success': False, 'error': friendly_err}), 400
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'success': False, 'error': f"Ocorreu um erro interno: {str(e)}"}), 500

@app.route('/api/download')
def download_video():
    url = request.args.get('url')
    if not url:
        return "URL is required", 400
        
    url = url.strip()
    logger.info(f"Downloading video from URL: {url}")
    
    # Generate unique filepath
    file_id = str(uuid.uuid4())
    filepath = os.path.join(TEMP_DIR, f"{file_id}.%(ext)s")
    
    import shutil
    has_ffmpeg = shutil.which('ffmpeg') is not None
    logger.info(f"FFmpeg detected: {has_ffmpeg}")
    format_str = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best' if has_ffmpeg else 'best[ext=mp4]/best'

    ydl_opts = {
        'outtmpl': filepath,
        'format': format_str,
        'quiet': True,
        'no_warnings': True,
        'nocheckcertificate': True,
        'rm_cache_dir': True,
        'extractor_args': {
            'youtube': {
                'player_client': ['web_embedded', 'mweb', 'default', '-android_sdkless']
            }
        }
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            # Find the actual filename created by yt-dlp
            # (since %(ext)s will resolve to the actual format extension, e.g., mp4)
            actual_ext = info.get('ext', 'mp4')
            actual_filepath = os.path.join(TEMP_DIR, f"{file_id}.{actual_ext}")
            
            if not os.path.exists(actual_filepath):
                # Fallback check if it was saved with another extension
                files = [f for f in os.listdir(TEMP_DIR) if f.startswith(file_id)]
                if files:
                    actual_filepath = os.path.join(TEMP_DIR, files[0])
                else:
                    raise FileNotFoundError("Video file was not found on the server after downloading.")
            
            logger.info(f"Serving downloaded file: {actual_filepath}")
            
            @after_this_request
            def remove_file(response):
                try:
                    if os.path.exists(actual_filepath):
                        os.remove(actual_filepath)
                        logger.info(f"Successfully deleted temporary file: {actual_filepath}")
                except Exception as error:
                    logger.error(f"Error removing temporary file: {error}")
                return response
                
            # Suggest a nice filename
            download_name = info.get('title', 'video')
            # Clean filename
            download_name = "".join([c for c in download_name if c.isalpha() or c.isdigit() or c in ' _-']).rstrip()
            if not download_name:
                download_name = "video"
            download_name = f"{download_name[:50]}.{actual_ext}"
            
            return send_file(actual_filepath, as_attachment=True, download_name=download_name)
            
    except Exception as e:
        logger.error(f"Error downloading video: {str(e)}")
        return f"Erro ao baixar o vídeo: {str(e)}", 500

if __name__ == '__main__':
    # Start the server on local interface
    app.run(host='127.0.0.1', port=5000, debug=True)
