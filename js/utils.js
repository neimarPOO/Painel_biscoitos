export function showConfirm(title, message, callback) {
    const confirmDialog = document.getElementById('confirm-dialog');
    const confirmDialogTitle = document.getElementById('confirm-dialog-title');
    const confirmDialogContent = document.getElementById('confirm-dialog-content');

    // We need to handle the buttons here or assume they are set up in app.js
    // For better modularity, let's just expose the show function and let app.js handle the event listeners for the dialog buttons once.
    // But to keep it simple as per the original code structure:

    confirmDialogTitle.innerText = title;
    confirmDialogContent.innerText = message;

    // Remove old listeners to avoid duplicates if this is called multiple times (though in this architecture we might want a cleaner way)
    // A simple way is to assign the callback to a property on the dialog element or a module-level variable if we ensure single instance.

    // Let's use a module-level variable for the callback, exposed via a setup function or just attached to the window for now if we want to mimic the old behavior, 
    // but better to do it right.

    // We will attach the callback to the dialog element itself to keep it self-contained
    confirmDialog.dataset.callback = 'true';
    confirmDialog.onConfirm = callback;

    confirmDialog.show();
}

export function setupConfirmDialog() {
    const confirmDialog = document.getElementById('confirm-dialog');
    document.getElementById('confirm-dialog-cancel').addEventListener('click', () => confirmDialog.close());
    document.getElementById('confirm-dialog-confirm').addEventListener('click', () => {
        if (confirmDialog.onConfirm) confirmDialog.onConfirm();
        confirmDialog.close();
    });
}

export function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) themeBtn.querySelector('md-icon').innerText = isDark ? 'light_mode' : 'dark_mode';
}

export function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn) themeBtn.querySelector('md-icon').innerText = 'light_mode';
    }
}
