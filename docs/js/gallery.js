const galleryEl = document.getElementById('gallery');
const emptyStateEl = document.getElementById('emptyState');
const loadingStateEl = document.getElementById('loadingState');

// Load photos on page load
loadPhotos();

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', function() {
  window.location.href = 'index.html';
});

async function loadPhotos() {
  try {
    const response = await fetch('uploads/photos.json');
    
    if (!response.ok) {
      throw new Error('Could not load photos.json');
    }
    
    const photos = await response.json();
    
    loadingStateEl.classList.add('hidden');
    renderGallery(photos);
  } catch (error) {
    console.error('Error loading photos:', error);
    loadingStateEl.classList.add('hidden');
    emptyStateEl.classList.remove('hidden');
  }
}

function renderGallery(photos) {
  if (!photos || photos.length === 0) {
    emptyStateEl.classList.remove('hidden');
    return;
  }
  
  // Sort by date descending (newest first)
  photos.sort(function(a, b) {
    return new Date(b.date) - new Date(a.date);
  });
  
  galleryEl.innerHTML = photos.map(function(photo) {
    const date = new Date(photo.date);
    const formattedDate = date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const title = photo.title || photo.file;
    
    return '<div class="photo-card" onclick="viewPhoto(\'' + encodeURIComponent(photo.file) + '\')">' +
      '<img src="uploads/' + photo.file + '" alt="' + title + '" loading="lazy">' +
      '<div class="photo-overlay">' +
        '<div class="photo-title">' + title + '</div>' +
        '<div class="photo-date">' + formattedDate + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function viewPhoto(filename) {
  window.location.href = 'view.html?file=' + filename;
}
// End of file