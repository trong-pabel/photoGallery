const galleryEl = document.getElementById('gallery');
const emptyStateEl = document.getElementById('emptyState');
const fileInput = document.getElementById('fileInput');
const uploadProgressEl = document.getElementById('uploadProgress');
const progressFillEl = document.querySelector('.progress-fill');
const progressTextEl = document.querySelector('.progress-text');

// Load photos on page load
loadPhotos();

// File input change handler
fileInput.addEventListener('change', async (e) => {
  const files = e.target.files;
  if (files.length === 0) return;
  
  await uploadFiles(files);
  fileInput.value = ''; // Reset input
});

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', () => {
  window.location.href = 'index.html';
});

async function loadPhotos() {
  try {
    const response = await fetch('/api/photos');
    const data = await response.json();
    
    if (data.success) {
      renderGallery(data.photos);
    }
  } catch (error) {
    console.error('Error loading photos:', error);
  }
}

function renderGallery(photos) {
  if (photos.length === 0) {
    galleryEl.innerHTML = '';
    emptyStateEl.classList.remove('hidden');
    return;
  }
  
  emptyStateEl.classList.add('hidden');
  
  galleryEl.innerHTML = photos.map(photo => {
    const date = new Date(photo.photoDate);
    const formattedDate = date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    return `
      <div class="photo-card" data-filename="${photo.filename}" onclick="viewPhoto('${photo.filename}')">
        <img src="${photo.thumbnail}" alt="${photo.filename}" loading="lazy">
        <div class="photo-overlay">
          <span>${formattedDate}</span>
        </div>
      </div>
    `;
  }).join('');
}

function viewPhoto(filename) {
  window.location.href = `view.html?file=${encodeURIComponent(filename)}`;
}

async function uploadFiles(files) {
  const formData = new FormData();
  
  for (const file of files) {
    formData.append('photos', file);
  }
  
  // Show progress
  uploadProgressEl.classList.remove('hidden');
  progressFillEl.style.width = '0%';
  progressTextEl.textContent = `Đang upload ${files.length} ảnh...`;
  
  try {
    // Simulate progress (real progress would require XMLHttpRequest)
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90;
      progressFillEl.style.width = progress + '%';
    }, 200);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    clearInterval(progressInterval);
    progressFillEl.style.width = '100%';
    
    const data = await response.json();
    
    if (data.success) {
      progressTextEl.textContent = `✅ Đã upload ${data.files.length} ảnh thành công!`;
      
      setTimeout(() => {
        uploadProgressEl.classList.add('hidden');
        loadPhotos(); // Refresh gallery
      }, 1500);
    } else {
      progressTextEl.textContent = `❌ Lỗi: ${data.message}`;
    }
  } catch (error) {
    progressTextEl.textContent = `❌ Lỗi upload: ${error.message}`;
  }
}
