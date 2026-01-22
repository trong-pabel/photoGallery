const urlParams = new URLSearchParams(window.location.search);
const filename = urlParams.get('file');

if (!filename) {
  window.location.href = 'gallery.html';
}

const fullImageEl = document.getElementById('fullImage');
const downloadBtn = document.getElementById('downloadBtn');
const deleteBtn = document.getElementById('deleteBtn');
const photoDateEl = document.getElementById('photoDate');
const photoSizeEl = document.getElementById('photoSize');

// Load image
fullImageEl.src = `/uploads/${filename}`;
downloadBtn.href = `/uploads/${filename}`;

// Load photo info
loadPhotoInfo();

async function loadPhotoInfo() {
  try {
    const response = await fetch('/api/photos');
    const data = await response.json();
    
    if (data.success) {
      const photo = data.photos.find(p => p.filename === filename);
      
      if (photo) {
        const date = new Date(photo.photoDate);
        photoDateEl.textContent = `📅 ${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN')}`;
        
        const sizeMB = (photo.size / (1024 * 1024)).toFixed(2);
        photoSizeEl.textContent = `📦 ${sizeMB} MB`;
      }
    }
  } catch (error) {
    console.error('Error loading photo info:', error);
  }
}

// Delete handler
deleteBtn.addEventListener('click', async () => {
  if (!confirm('Bạn có chắc muốn xóa ảnh này?')) return;
  
  try {
    const response = await fetch(`/api/photos/${encodeURIComponent(filename)}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Đã xóa ảnh!');
      window.location.href = 'gallery.html';
    } else {
      alert('Lỗi: ' + data.message);
    }
  } catch (error) {
    alert('Lỗi xóa ảnh: ' + error.message);
  }
});
