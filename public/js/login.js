document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('errorMessage');
  
  errorEl.textContent = '';
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      window.location.href = 'gallery.html';
    } else {
      errorEl.textContent = data.message || 'Đăng nhập thất bại';
    }
  } catch (error) {
    errorEl.textContent = 'Lỗi kết nối server';
  }
});
