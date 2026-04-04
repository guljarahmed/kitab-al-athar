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
    if (btn) btn.innerHTML = isDark ? '☀️' : '🌙';
}

// =============================================
// 2. DOM READY: All features that need the DOM
// =============================================
document.addEventListener('DOMContentLoaded', function() {

    // --- Theme icon sync ---
    updateToggleIcon(document.body.classList.contains('dark-mode'));

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

    // --- Search button in header ---
    var header = document.querySelector('header');
    if (header) {
        var searchBtn = document.createElement('button');
        searchBtn.className = 'search-trigger';
        searchBtn.textContent = 'Search';
        searchBtn.title = 'Search (Ctrl+K)';
        searchBtn.addEventListener('click', function() { openSearch(); });
        header.appendChild(searchBtn);
    }

    // --- Feedback button at bottom ---
    var container = document.querySelector('.container');
    if (container) {
        var fbArea = document.createElement('div');
        fbArea.id = 'feedback-trigger-area';
        fbArea.innerHTML = '<button class="feedback-btn" onclick="openFeedback()">Send Feedback</button>';
        container.appendChild(fbArea);
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

        var subject = encodeURIComponent('Kitab al-Athar Feedback: ' + type);
        var body = encodeURIComponent(
            'Type: ' + type + '\n' +
            'Page: ' + page + '\n' +
            'From: ' + (email || 'Anonymous') + '\n\n' +
            message
        );

        window.location.href = 'mailto:feedback@kitabalathar.com?subject=' + subject + '&body=' + body;

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
