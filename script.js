// =============================================
// 1. THEMES: Define and apply immediately
// =============================================
var THEMES = [
    { id: 'light',  name: 'Light',  swatch: '#f8f7ef' },
    { id: 'dark',   name: 'Dark',   swatch: '#1a1a2e' },
    { id: 'sepia',  name: 'Sepia',  swatch: '#f4ecd8' },
    { id: 'forest', name: 'Forest', swatch: '#1a2e1a' },
    { id: 'ocean',  name: 'Ocean',  swatch: '#f0f5fa' }
];

(function() {
    var saved = localStorage.getItem('theme') || 'light';
    // Migrate old dark-mode value
    if (saved === 'dark' || localStorage.getItem('theme') === 'dark') {
        saved = 'dark';
    }
    if (saved !== 'light') {
        document.body.classList.add('theme-' + saved);
    }
})();

function setTheme(themeId) {
    // Remove all theme classes
    THEMES.forEach(function(t) {
        document.body.classList.remove('theme-' + t.id);
    });
    // Also remove legacy dark-mode class
    document.body.classList.remove('dark-mode');
    // Apply new theme
    if (themeId !== 'light') {
        document.body.classList.add('theme-' + themeId);
    }
    localStorage.setItem('theme', themeId);
    // Update all theme UI elements
    updateThemeUI(themeId);
}

function getCurrentTheme() {
    for (var i = 0; i < THEMES.length; i++) {
        if (document.body.classList.contains('theme-' + THEMES[i].id)) {
            return THEMES[i].id;
        }
    }
    return 'light';
}

function updateThemeUI(themeId) {
    // Update desktop dropdown selections
    var options = document.querySelectorAll('.theme-option');
    for (var i = 0; i < options.length; i++) {
        options[i].classList.toggle('selected', options[i].getAttribute('data-theme') === themeId);
    }
    // Update sidebar swatches
    var swatches = document.querySelectorAll('.sidebar-theme-swatch');
    for (var i = 0; i < swatches.length; i++) {
        swatches[i].classList.toggle('selected', swatches[i].getAttribute('data-theme') === themeId);
    }
}

// Legacy compat
function toggleTheme() {
    setTheme(getCurrentTheme() === 'dark' ? 'light' : 'dark');
}
function updateToggleIcon() {}

// =============================================
// 2. BOOKS: Registry for multi-book support
// =============================================
var BOOKS = [
    {
        id: 'kitab-al-athar',
        title: 'Kitab al-Athar',
        subtitle: 'The Narrations of Imam Abu Hanifah',
        chaptersPage: 'chapters.html',
        chapters: 20,
        sections: '300+',
        // Path patterns that identify pages belonging to this book
        pathPatterns: ['finished_sections', 'ch']
    }
    // Add more books here:
    // {
    //     id: 'another-book',
    //     title: 'Another Book Title',
    //     subtitle: 'Description',
    //     chaptersPage: 'book2_chapters.html',
    //     chapters: 10,
    //     sections: '100+',
    //     pathPatterns: ['book2_sections']
    // }
];

function detectCurrentBook() {
    var path = window.location.pathname;
    var page = path.split('/').pop() || '';
    // Landing page is not a book page
    if (page === 'index.html' && path.indexOf('finished_sections') === -1) return null;
    for (var i = 0; i < BOOKS.length; i++) {
        for (var j = 0; j < BOOKS[i].pathPatterns.length; j++) {
            if (path.indexOf(BOOKS[i].pathPatterns[j]) !== -1 || page.indexOf(BOOKS[i].pathPatterns[j]) !== -1) {
                return BOOKS[i];
            }
        }
    }
    return null;
}

// =============================================
// 3. DOM READY: All features that need the DOM
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
        var currentPage = path.split('/').pop() || 'index.html';
        var currentBook = detectCurrentBook();

        // Wrap existing h1 (and optional p) in a brand container
        var brand = document.createElement('a');
        brand.className = 'header-brand';
        brand.href = prefix + 'index.html';

        var logo = document.createElement('img');
        logo.className = 'header-logo';
        logo.src = prefix + 'logo.svg';
        logo.alt = 'Dar al-Hanafiyya';
        brand.appendChild(logo);

        var titleWrap = document.createElement('div');
        var h1 = header.querySelector('h1');
        var subtitle = header.querySelector('p');

        // Brand always shows site name
        if (h1) {
            h1.textContent = 'Dar al-Hanafiyya';
            titleWrap.appendChild(h1);
        }
        if (subtitle) titleWrap.appendChild(subtitle);
        brand.appendChild(titleWrap);

        // Remove old theme toggle button from HTML
        var oldToggle = header.querySelector('.theme-toggle');
        if (oldToggle) oldToggle.remove();

        // Clear header and rebuild
        header.innerHTML = '';
        header.appendChild(brand);

        // Desktop nav links
        var nav = document.createElement('nav');
        nav.className = 'header-nav';

        // Chapters link — context-aware for current book
        if (currentBook) {
            var chaptersLink = document.createElement('a');
            chaptersLink.className = 'header-nav-link';
            chaptersLink.href = prefix + currentBook.chaptersPage;
            chaptersLink.textContent = 'Chapters';
            if (currentPage === currentBook.chaptersPage) chaptersLink.classList.add('active');
            nav.appendChild(chaptersLink);
        }

        // Add prev/next from .sub-nav (skip Home, Chapters, Up)
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

        // Search
        var searchBtn = document.createElement('button');
        searchBtn.className = 'header-nav-link';
        searchBtn.textContent = 'Search';
        searchBtn.title = 'Ctrl+K';
        searchBtn.addEventListener('click', function() { openSearch(); });
        nav.appendChild(searchBtn);

        // Feedback
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

        // Theme picker — far right
        var pickerWrap = document.createElement('div');
        pickerWrap.className = 'theme-picker-wrap';

        var pickerBtn = document.createElement('button');
        pickerBtn.className = 'theme-picker-btn';
        pickerBtn.innerHTML = '&#9790;';
        pickerBtn.title = 'Change theme';
        pickerBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var dd = document.querySelector('.theme-dropdown');
            if (dd) dd.classList.toggle('active');
        });
        pickerWrap.appendChild(pickerBtn);

        var dropdown = document.createElement('div');
        dropdown.className = 'theme-dropdown';
        var currentTheme = getCurrentTheme();
        THEMES.forEach(function(t) {
            var opt = document.createElement('button');
            opt.className = 'theme-option' + (t.id === currentTheme ? ' selected' : '');
            opt.setAttribute('data-theme', t.id);
            opt.innerHTML = '<span class="theme-swatch" style="background:' + t.swatch + '"></span>' + t.name;
            opt.addEventListener('click', function() {
                setTheme(t.id);
                dropdown.classList.remove('active');
            });
            dropdown.appendChild(opt);
        });
        pickerWrap.appendChild(dropdown);
        nav.appendChild(pickerWrap);

        // Close dropdown when clicking elsewhere
        document.addEventListener('click', function() {
            var dd = document.querySelector('.theme-dropdown');
            if (dd) dd.classList.remove('active');
        });

        header.appendChild(nav);

        // Hamburger button (mobile)
        var hamburger = document.createElement('button');
        hamburger.className = 'hamburger-btn';
        hamburger.innerHTML = '&#9776;';
        hamburger.title = 'Menu';
        hamburger.addEventListener('click', function() { openSidebar(); });
        header.appendChild(hamburger);
    }

    // --- Keyboard navigation ---
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openSearch();
            return;
        }

        if (e.key === 'Escape') {
            closeSearch();
            closeFeedback();
            closeSidebar();
            var dd = document.querySelector('.theme-dropdown');
            if (dd) dd.classList.remove('active');
            return;
        }

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
// 4. SEARCH SYSTEM
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

    var path = window.location.pathname;
    var prefix = (path.indexOf('finished_sections') !== -1) ? '../' : '';

    return fetch(prefix + 'search_index.json')
        .then(function(r) { return r.json(); })
        .then(function(data) {
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
    loadSearchIndex();
}

function closeSearch() {
    if (searchOverlay) searchOverlay.classList.remove('active');
}

// =============================================
// 5. FEEDBACK SYSTEM
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
// 6. MOBILE SIDEBAR
// =============================================
var sidebarOverlay, sidebar;

function createSidebar() {
    sidebarOverlay = document.createElement('div');
    sidebarOverlay.id = 'sidebar-overlay';
    document.body.appendChild(sidebarOverlay);

    sidebar = document.createElement('div');
    sidebar.id = 'sidebar';

    var currentTheme = getCurrentTheme();
    var path = window.location.pathname;
    var prefix = (path.indexOf('finished_sections') !== -1) ? '../' : '';
    var currentBook = detectCurrentBook();

    // Build navigation links
    var navHtml = '';

    // Home link
    navHtml += '<a class="sidebar-item" href="' + prefix + 'index.html">' +
        '<span class="sidebar-icon">&#127968;</span>' +
        '<span class="sidebar-label">Home</span>' +
    '</a>';

    // Chapters link (context-aware)
    if (currentBook) {
        navHtml += '<a class="sidebar-item" href="' + prefix + currentBook.chaptersPage + '">' +
            '<span class="sidebar-icon">&#128218;</span>' +
            '<span class="sidebar-label">Chapters</span>' +
        '</a>';
    }

    // Prev/Next/Up from sub-nav
    var navBtns = document.querySelectorAll('.sub-nav .nav-btn');
    for (var i = 0; i < navBtns.length; i++) {
        var href = navBtns[i].getAttribute('href');
        var label = navBtns[i].textContent.replace('←', '').replace('→', '').trim();
        if (label === 'Home' || label === 'Chapters') continue;
        var icon = '&#128279;';
        if (label === 'Up') icon = '&#11014;&#65039;';
        else if (label.indexOf('Prev') !== -1) icon = '&#9664;';
        else if (label.indexOf('Next') !== -1) icon = '&#9654;';
        navHtml += '<a class="sidebar-item" href="' + href + '">' +
            '<span class="sidebar-icon">' + icon + '</span>' +
            '<span class="sidebar-label">' + label + '</span>' +
        '</a>';
    }

    // Theme swatches
    var themeSwatchesHtml = '';
    THEMES.forEach(function(t) {
        themeSwatchesHtml += '<button class="sidebar-theme-swatch' +
            (t.id === currentTheme ? ' selected' : '') +
            '" data-theme="' + t.id + '" title="' + t.name + '" style="background:' + t.swatch + '"' +
            ' onclick="setTheme(\'' + t.id + '\')"></button>';
    });

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
            '<button class="sidebar-item" onclick="closeSidebar(); openFeedback();">' +
                '<span class="sidebar-icon">&#9993;</span>' +
                '<span class="sidebar-label">Send Feedback</span>' +
            '</button>' +
            '<div class="sidebar-divider"></div>' +
            '<div class="sidebar-theme-label">Theme</div>' +
            '<div class="sidebar-themes">' + themeSwatchesHtml + '</div>' +
        '</div>';

    document.body.appendChild(sidebar);

    sidebarOverlay.addEventListener('click', function() {
        closeSidebar();
    });
}

function openSidebar() {
    if (!sidebar) createSidebar();
    // Refresh swatch selections
    var currentTheme = getCurrentTheme();
    var swatches = sidebar.querySelectorAll('.sidebar-theme-swatch');
    for (var i = 0; i < swatches.length; i++) {
        swatches[i].classList.toggle('selected', swatches[i].getAttribute('data-theme') === currentTheme);
    }
    sidebarOverlay.classList.add('active');
    sidebar.classList.add('active');
}

function closeSidebar() {
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    if (sidebar) sidebar.classList.remove('active');
}
