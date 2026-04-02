// 1. INSTANT LOAD: Apply theme immediately before the page even renders
(function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
})();

// 2. TOGGLE LOGIC
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    
    // Save preference
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateToggleIcon(isDark);
}

// 3. UI SYNC: Keeps the button icon in sync with the current mode
function updateToggleIcon(isDark) {
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
        btn.innerHTML = isDark ? '☀️' : '🌙';
    }
}

// 4. INIT: Check icon status once the HTML is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const isDark = document.body.classList.contains('dark-mode');
    updateToggleIcon(isDark);
});