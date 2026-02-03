// Verifify if connected successfully via URL param
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('success') === 'true') {
  showNotification('✅ Connected successfully with Google Calendar', 'success');
  // Clear URL
  window.history.replaceState({}, document.title, '/admin');
}

/**
 * Disconnect from Google Calendar
 */
async function disconnect() {
  if (!confirm('Are you sure you want to disconnect from Google Calendar?')) {
    return;
  }
  
  try {
    const response = await fetch('/admin/disconnect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('Disconnected successfully', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      showNotification('Error disconnecting', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Connection error', 'error');
  }
}

/**
 * Shows a temporary notification on the screen
 * @param {string} message - The message to display
 * @param {string} type - The type of notification: 'success', 'error', 'info'
 */
function showNotification(message, type = 'info') {
  // Remove previous notifications
  const existing = document.querySelector('.notification');
  if (existing) {
    existing.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Styles
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '15px 20px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: '9999',
    fontWeight: '600',
    animation: 'slideIn 0.3s ease',
    backgroundColor: type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1',
    color: type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460',
    border: `1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'}`
  });
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
