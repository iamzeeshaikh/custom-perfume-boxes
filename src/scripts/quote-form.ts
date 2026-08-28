/**
 * Client behaviour shared by every quote form on the site: the full form, the
 * product-page form, the short form at the top of listing pages and the popup.
 *
 * Binds by [data-quote-form] rather than by component, so a page carrying two
 * different form components still gets one copy of this module. Lives in its
 * own file precisely so a page with only the short form still ships the
* handler - when it sat inside QuoteForm.astro, any page not rendering
 * that component had a dead form.
 */
export {};

  document.querySelectorAll<HTMLFormElement>('[data-quote-form]').forEach((form) => {
    const sp = form.querySelector<HTMLInputElement>('[data-source-page]');
    const ts = form.querySelector<HTMLInputElement>('[data-submitted-at]');
    if (sp) sp.value = location.href;
    const status = form.querySelector<HTMLElement>('[data-status]');
    const fileInput = form.querySelector<HTMLInputElement>('input[type=file]');
    const MAX = 10 * 1024 * 1024;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!status) return;
      status.className = 'qf-status';
      status.textContent = '';

      const name = (form.elements.namedItem('name') as HTMLInputElement)?.value.trim();
      const email = (form.elements.namedItem('email') as HTMLInputElement)?.value.trim();
      if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        status.className = 'qf-status err';
        status.textContent = 'Please enter your name and a valid email address.';
        return;
      }
      if (fileInput?.files?.[0] && fileInput.files[0].size > MAX) {
        status.className = 'qf-status err';
        status.textContent = 'File is too large (max 10 MB).';
        return;
      }
      if (ts) ts.value = new Date().toISOString();

      const btn = form.querySelector<HTMLButtonElement>('.qf-submit');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      try {
        const res = await fetch('/api/quote/', { method: 'POST', body: new FormData(form) });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          window.location.href = '/thank-you/';
        } else {
          status.className = 'qf-status err';
          status.textContent = data.error || 'Something went wrong. Please email us directly.';
          if (btn) { btn.disabled = false; btn.textContent = 'Send'; }
        }
      } catch {
        status.className = 'qf-status err';
        status.textContent = 'Network error. Please try again or email us directly.';
        if (btn) { btn.disabled = false; btn.textContent = 'Send'; }
      }
    });
  });
