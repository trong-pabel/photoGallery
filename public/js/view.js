const urlParams = new URLSearchParams(window.location.search);
const filename = urlParams.get('file');

if (!filename) {
  window.location.href = 'gallery.html';
}

const decodedFilename = decodeURIComponent(filename);
const fullImageEl = document.getElementById('fullImage');
const downloadBtn = document.getElementById('downloadBtn');
const photoTitleEl = document.getElementById('photoTitle');
const photoDateEl = document.getElementById('photoDate');

// Set image source
fullImageEl.src = 'uploads/' + decodedFilename;
fullImageEl.alt = decodedFilename;
downloadBtn.href = 'uploads/' + decodedFilename;
downloadBtn.download = decodedFilename;

// Load photo info from photos.json
loadPhotoInfo();

async function loadPhotoInfo() {
  try {
    const response = await fetch('uploads/photos.json');
    
    if (!response.ok) {
      throw new Error('Could not load photos.json');
    }
    
    const photos = await response.json();
    const photo = photos.find(function(p) {
      return p.file === decodedFilename;
    });
    
    if (photo) {
      const title = photo.title || photo.file;
      photoTitleEl.textContent = '📷 ' + title;
      
      const date = new Date(photo.date);
      photoDateEl.textContent = '📅 ' + date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
    } else {
      photoTitleEl.textContent = '📷 ' + decodedFilename;
      photoDateEl.textContent = '';
    }
  } catch (error) {
    console.error('Error loading photo info:', error);
    photoTitleEl.textContent = '📷 ' + decodedFilename;
    photoDateEl.textContent = '';
  }
}