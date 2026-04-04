// =============================================
// 1. THEME: Apply saved theme immediately
// =============================================
(function() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
})();

function toggleTheme() {
    var isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateToggleIcon(isDark);
}

function updateToggleIcon(isDark) {
    var btn = document.querySelector('.theme-toggle');
    if (btn) btn.innerHTML = isDark ? '&#9788;' : '&#9790;';
}

// =============================================
// 2. DOM READY: All features that need the DOM
// =============================================
document.addEventListener('DOMContentLoaded', function() {

    // --- Reading progress bar ---
    var progressBar = document.createElement('div');
    progressBar.id = 'reading-progress';
    document.body.prepend(progressBar);

    // --- Scroll-to-top button ---
    var scrollBtn = document.createElement('button');
    scrollBtn.id = 'scroll-top';
    scrollBtn.innerHTML = '&#8593;';
    scrollBtn.title = 'Scroll to top';
    document.body.appendChild(scrollBtn);

    scrollBtn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- Scroll handler (progress + scroll-top visibility) ---
    window.addEventListener('scroll', function() {
        var scrollTop = window.scrollY;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
            progressBar.style.width = (scrollTop / docHeight * 100) + '%';
        }
        scrollBtn.classList.toggle('visible', scrollTop > 400);
    });

    // --- Restructure header as nav bar ---
    var header = document.querySelector('header');
    if (header) {
        var path = window.location.pathname;
        var prefix = (path.indexOf('finished_sections') !== -1) ? '../' : '';

        // Wrap existing h1 (and optional p) in a brand container
        var brand = document.createElement('div');
        brand.className = 'header-brand';

        var logo = document.createElement('img');
        logo.className = 'header-logo';
        logo.src = prefix + 'logo.svg';
        logo.alt = 'Dar al-Hanafiyya';
        brand.appendChild(logo);

        var titleWrap = document.createElement('div');
        var h1 = header.querySelector('h1');
        var subtitle = header.querySelector('p');

        // Strip "Section N:" or "Chapter N:" prefix — brand should always just say "Dar al-Hanafiyya"
        if (h1) {
            var cleanTitle = h1.textContent.replace(/^(Section|Chapter)\s+\d+:\s*/i, '');
            h1.textContent = cleanTitle;
            titleWrap.appendChild(h1);
        }
        if (subtitle) titleWrap.appendChild(subtitle);
        brand.appendChild(titleWrap);

        // Remove old theme toggle button from HTML (we'll recreate it)
        var oldToggle = header.querySelector('.theme-toggle');
        if (oldToggle) oldToggle.remove();

        // Clear header and rebuild
        header.innerHTML = '';
        header.appendChild(brand);

        // Desktop nav links — all unified style
        var nav = document.createElement('nav');
        nav.className = 'header-nav';

        var currentPage = window.location.pathname.split('/').pop() || 'index.html';
        var hasChapters = true; // Chapters link is always present

        // Chapters link
        var chaptersLink = document.createElement('a');
        chaptersLink.className = 'header-nav-link';
        chaptersLink.href = prefix + 'chapters.html';
        chaptersLink.textContent = 'Chapters';
        if (currentPage === 'chapters.html') chaptersLink.classList.add('active');
        nav.appendChild(chaptersLink);

        // Add prev/next from .sub-nav (skip Home, Chapters, Up since Chapters covers it)
        var subNavBtns = document.querySelectorAll('.sub-nav .nav-btn');
        for (var i = 0; i < subNavBtns.length; i++) {
            var text = subNavBtns[i].textContent.replace('←', '').replace('→', '').trim();
            if (text === 'Home' || text === 'Chapters' || text === 'Up') continue;
            var link = document.createElement('a');
            link.className = 'header-nav-link';
            link.href = subNavBtns[i].getAttribute('href');
            link.textContent = text;
            nav.appendChild(link);
        }

        // Search button (styled as nav link)
        var searchBtn = document.createElement('button');
        searchBtn.className = 'header-nav-link';
        searchBtn.textContent = 'Search';
        searchBtn.title = 'Ctrl+K';
        searchBtn.addEventListener('click', function() { openSearch(); });
        nav.appendChild(searchBtn);

        // Feedback button (styled as nav link)
        var feedbackBtn = document.createElement('button');
        feedbackBtn.className = 'header-nav-link';
        feedbackBtn.textContent = 'Feedback';
        feedbackBtn.addEventListener('click', function() { openFeedback(); });
        nav.appendChild(feedbackBtn);

        // Home — but not on landing page
        if (!(currentPage === 'index.html' && !prefix)) {
            var homeLink = document.createElement('a');
            homeLink.className = 'header-nav-link';
            homeLink.href = prefix + 'index.html';
            homeLink.textContent = 'Home';
            nav.appendChild(homeLink);
        }

        // Theme toggle — far right, icon only
        var themeBtn = document.createElement('button');
        themeBtn.className = 'header-nav-link theme-toggle';
        themeBtn.onclick = toggleTheme;
        nav.appendChild(themeBtn);

        header.appendChild(nav);

        // Hamburger button (mobile)
        var hamburger = document.createElement('button');
        hamburger.className = 'hamburger-btn';
        hamburger.innerHTML = '&#9776;';
        hamburger.title = 'Menu';
        hamburger.addEventListener('click', function() { openSidebar(); });
        header.appendChild(hamburger);

        // Sync theme icon now that button exists
        updateToggleIcon(document.body.classList.contains('dark-mode'));
    }

    // --- Keyboard navigation ---
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

        // Ctrl+K / Cmd+K => search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openSearch();
            return;
        }

        // Escape => close modals
        if (e.key === 'Escape') {
            closeSearch();
            closeFeedback();
            closeSidebar();
            return;
        }

        // Arrow keys => prev/next navigation
        var navBtns = document.querySelectorAll('.nav-btn');
        if (e.key === 'ArrowLeft') {
            for (var i = 0; i < navBtns.length; i++) {
                var text = navBtns[i].textContent;
                if (text.indexOf('Prev') !== -1 || text.indexOf('←') !== -1) {
                    navBtns[i].click();
                    return;
                }
            }
        }
        if (e.key === 'ArrowRight') {
            for (var i = 0; i < navBtns.length; i++) {
                var text = navBtns[i].textContent;
                if (text.indexOf('Next') !== -1 || text.indexOf('→') !== -1) {
                    navBtns[i].click();
                    return;
                }
            }
        }
    });
});

// =============================================
// 3. SEARCH SYSTEM
// =============================================
var searchOverlay, searchInput, searchResults;
var searchData = null;

function createSearchUI() {
    searchOverlay = document.createElement('div');
    searchOverlay.id = 'search-overlay';
    searchOverlay.innerHTML =
        '<div id="search-box">' +
            '<input id="search-input" type="text" placeholder="Search sections..." autocomplete="off">' +
            '<div id="search-results"></div>' +
        '</div>';
    document.body.appendChild(searchOverlay);

    searchInput = document.getElementById('search-input');
    searchResults = document.getElementById('search-results');

    searchOverlay.addEventListener('click', function(e) {
        if (e.target === searchOverlay) closeSearch();
    });

    var timer;
    searchInput.addEventListener('input', function() {
        clearTimeout(timer);
        timer = setTimeout(doSearch, 200);
    });
}

function loadSearchIndex() {
    if (searchData) return Promise.resolve(searchData);

    // Determine base path (are we in a subdirectory?)
    var path = window.location.pathname;
    var prefix = (path.indexOf('finished_sections') !== -1) ? '../' : '';

    return fetch(prefix + 'search_index.json')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            // Fix URLs if we're in a subdirectory
            if (prefix) {
                data.forEach(function(d) { d.href = prefix + d.url; });
            } else {
                data.forEach(function(d) { d.href = d.url; });
            }
            searchData = data;
            return data;
        })
        .catch(function() {
            searchData = [];
            return [];
        });
}

function doSearch() {
    var q = searchInput.value.trim().toLowerCase();
    if (!q) { searchResults.innerHTML = ''; return; }

    loadSearchIndex().then(function(data) {
        var matches = data.filter(function(d) {
            return d.title.toLowerCase().indexOf(q) !== -1 ||
                   (d.content && d.content.toLowerCase().indexOf(q) !== -1);
        });

        if (matches.length === 0) {
            searchResults.innerHTML = '<div style="padding:1rem;opacity:0.5;text-align:center;">No results found</div>';
            return;
        }

        searchResults.innerHTML = matches.slice(0, 30).map(function(m) {
            var preview = m.content ? m.content.substring(0, 80) + '...' : '';
            return '<a href="' + m.href + '">' +
                '<span class="search-chapter">' + (m.chapter || '') + '</span><br>' +
                '<strong>' + m.title + '</strong>' +
                (preview ? '<div class="search-preview">' + preview + '</div>' : '') +
            '</a>';
        }).join('');
    });
}

function openSearch() {
    if (!searchOverlay) createSearchUI();
    searchOverlay.classList.add('active');
    searchInput.value = '';
    searchResults.innerHTML = '';
    searchInput.focus();
    loadSearchIndex(); // pre-fetch
}

function closeSearch() {
    if (searchOverlay) searchOverlay.classList.remove('active');
}

// =============================================
// 4. FEEDBACK SYSTEM
// =============================================
var feedbackOverlay;

function createFeedbackUI() {
    feedbackOverlay = document.createElement('div');
    feedbackOverlay.id = 'feedback-overlay';
    feedbackOverlay.innerHTML =
        '<div id="feedback-box">' +
            '<h3>Send Us Feedback</h3>' +
            '<form id="feedback-form">' +
                '<input type="hidden" name="page" value="' + window.location.pathname + '">' +
                '<label>Your Email (optional)</label>' +
                '<input type="email" name="email" placeholder="email@example.com">' +
                '<label>Type</label>' +
                '<select name="type">' +
                    '<option>Correction</option>' +
                    '<option>Suggestion</option>' +
                    '<option>Bug Report</option>' +
                    '<option>General Feedback</option>' +
                '</select>' +
                '<label>Message</label>' +
                '<textarea name="message" rows="4" required placeholder="Your feedback..."></textarea>' +
                '<button type="submit">Send Feedback</button>' +
            '</form>' +
            '<button class="feedback-close" onclick="closeFeedback()">&times;</button>' +
        '</div>';
    document.body.appendChild(feedbackOverlay);

    feedbackOverlay.addEventListener('click', function(e) {
        if (e.target === feedbackOverlay) closeFeedback();
    });

    // Handle form submission via mailto fallback
    document.getElementById('feedback-form').addEventListener('submit', function(e) {
        e.preventDefault();
        var form = e.target;
        var type = form.querySelector('[name="type"]').value;
        var message = form.querySelector('[name="message"]').value;
        var email = form.querySelector('[name="email"]').value;
        var page = form.querySelector('[name="page"]').value;

        var subject = encodeURIComponent('Dar al-Hanafiyya Feedback: ' + type);
        var body = encodeURIComponent(
            'Type: ' + type + '\n' +
            'Page: ' + page + '\n' +
            'From: ' + (email || 'Anonymous') + '\n\n' +
            message
        );

        window.location.href = 'mailto:feedback@daralhanafiyya.com?subject=' + subject + '&body=' + body;

        // Show confirmation
        form.innerHTML = '<div style="text-align:center;padding:2rem 0;">' +
            '<div style="font-size:2rem;margin-bottom:0.5rem;">&#10003;</div>' +
            '<p style="margin:0;font-weight:700;background:none!important;border:none!important;box-shadow:none!important;">Thank you for your feedback!</p>' +
            '<p style="margin:0.5rem 0 0;opacity:0.6;font-size:0.9rem;background:none!important;border:none!important;box-shadow:none!important;">Your email client should open with the message.</p>' +
        '</div>';

        setTimeout(function() { closeFeedback(); }, 3000);
    });
}

function openFeedback() {
    if (!feedbackOverlay) createFeedbackUI();
    feedbackOverlay.classList.add('active');
}

function closeFeedback() {
    if (feedbackOverlay) feedbackOverlay.classList.remove('active');
}

// =============================================
// 5. MOBILE SIDEBAR
// =============================================
var sidebarOverlay, sidebar;

function createSidebar() {
    sidebarOverlay = document.createElement('div');
    sidebarOverlay.id = 'sidebar-overlay';
    document.body.appendChild(sidebarOverlay);

    sidebar = document.createElement('div');
    sidebar.id = 'sidebar';

    var isDark = document.body.classList.contains('dark-mode');

    // Build navigation links from the existing .sub-nav
    var navHtml = '';
    var navBtns = document.querySelectorAll('.sub-nav .nav-btn');
    for (var i = 0; i < navBtns.length; i++) {
        var href = navBtns[i].getAttribute('href');
        var label = navBtns[i].textContent.replace('←', '').replace('→', '').trim();
        var icon = '&#128279;'; // link icon default
        if (label === 'Home') icon = '&#127968;';
        else if (label === 'Chapters') icon = '&#128218;';
        else if (label === 'Up') icon = '&#11014;&#65039;';
        else if (label.indexOf('Prev') !== -1) icon = '&#9664;';
        else if (label.indexOf('Next') !== -1) icon = '&#9654;';
        navHtml += '<a class="sidebar-item" href="' + href + '">' +
            '<span class="sidebar-icon">' + icon + '</span>' +
            '<span class="sidebar-label">' + label + '</span>' +
        '</a>';
    }

    sidebar.innerHTML =
        '<div class="sidebar-header">' +
            '<h3>Menu</h3>' +
            '<button class="sidebar-close" onclick="closeSidebar()">&times;</button>' +
        '</div>' +
        '<div class="sidebar-menu">' +
            navHtml +
            '<div class="sidebar-divider"></div>' +
            '<button class="sidebar-item" onclick="closeSidebar(); openSearch();">' +
                '<span class="sidebar-icon">&#128269;</span>' +
                '<span class="sidebar-label">Search</span>' +
                '<span class="sidebar-hint">Ctrl+K</span>' +
            '</button>' +
            '<button class="sidebar-item" id="sidebar-theme-btn" onclick="toggleTheme(); updateSidebarTheme();">' +
                '<span class="sidebar-icon" id="sidebar-theme-icon">' + (isDark ? '&#9728;&#65039;' : '&#127769;') + '</span>' +
                '<span class="sidebar-label" id="sidebar-theme-label">' + (isDark ? 'Light Mode' : 'Dark Mode') + '</span>' +
            '</button>' +
            '<button class="sidebar-item" onclick="closeSidebar(); openFeedback();">' +
                '<span class="sidebar-icon">&#9993;</span>' +
                '<span class="sidebar-label">Send Feedback</span>' +
            '</button>' +
        '</div>';

    document.body.appendChild(sidebar);

    sidebarOverlay.addEventListener('click', function() {
        closeSidebar();
    });
}

function updateSidebarTheme() {
    var isDark = document.body.classList.contains('dark-mode');
    var icon = document.getElementById('sidebar-theme-icon');
    var label = document.getElementById('sidebar-theme-label');
    if (icon) icon.innerHTML = isDark ? '&#9728;&#65039;' : '&#127769;';
    if (label) label.textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

function openSidebar() {
    if (!sidebar) createSidebar();
    updateSidebarTheme();
    sidebarOverlay.classList.add('active');
    sidebar.classList.add('active');
}

function closeSidebar() {
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    if (sidebar) sidebar.classList.remove('active');
}
