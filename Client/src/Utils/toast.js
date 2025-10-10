// Small lightweight toast helper — no external deps
export function showToast(message, type = 'info', duration = 3500) {
  try {
    const existingRoot = document.getElementById('app-toast-root');
    const root = existingRoot || (() => {
      const el = document.createElement('div');
      el.id = 'app-toast-root';
      el.style.position = 'fixed';
      el.style.top = '1rem';
      el.style.right = '1rem';
      el.style.zIndex = 9999;
      document.body.appendChild(el);
      return el;
    })();

    const toast = document.createElement('div');
    toast.className = 'app-toast';
    toast.style.marginBottom = '0.5rem';
    toast.style.minWidth = '200px';
    toast.style.padding = '10px 14px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)';
    toast.style.color = '#fff';
    toast.style.fontSize = '14px';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 200ms ease, transform 200ms ease';
    toast.style.transform = 'translateY(-6px)';

    if (type === 'error') {
      toast.style.background = 'linear-gradient(90deg,#ef4444,#b91c1c)';
    } else if (type === 'success') {
      toast.style.background = 'linear-gradient(90deg,#10b981,#059669)';
    } else if (type === 'warn' || type === 'warning') {
      toast.style.background = 'linear-gradient(90deg,#f59e0b,#d97706)';
    } else {
      toast.style.background = 'linear-gradient(90deg,#6366f1,#8b5cf6)';
    }

    toast.textContent = message;
    root.appendChild(toast);

    // entrance
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    const t = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-6px)';
      setTimeout(() => {
        toast.remove();
        // remove root if empty
        if (root && root.children.length === 0 && root.id === 'app-toast-root') {
          root.remove();
        }
      }, 220);
    }, duration);

    return () => {
      clearTimeout(t);
      toast.remove();
    };
  } catch (err) {
    // fallback
    // eslint-disable-next-line no-alert
    alert(message);
  }
}

export default showToast;
