// Hardcoded credentials (client-side only, NOT secure)
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = '789878';

document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('errorMessage');
  
  errorEl.textContent = '';
  
  if (username === VALID_USERNAME && password === VALID_PASSWORD) {
    // Redirect to gallery on success
    window.location.href = 'gallery.html';
  } else {
    errorEl.textContent = 'Sai tên đăng nhập hoặc mật khẩu';
  }
});
