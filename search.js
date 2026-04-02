// Search Index Management
let searchIndex = [];
let isSearchIndexLoaded = false;

/**
 * Load search index from JSON file with caching
 */
async function loadSearchIndex() {
  if (isSearchIndexLoaded) return searchIndex;
  
  try {
    const response = await fetch('search-index.json');
    if (!response.ok) {
      throw new Error('Failed to load search index');
    }
    searchIndex = await response.json();
    isSearchIndexLoaded = true;
    return searchIndex;
  } catch (error) {
    console.error('Error loading search index:', error);
    return [];
  }
}

/**
 * Display search results in the results container
 */
function displayResults(results, query) {
  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = '';
  resultsContainer.classList.remove('active');

  if (results.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = query ? `No results found for "${query}".` : 'Enter a search query...';
    emptyMessage.style.color = 'var(--color-text-light)';
    resultsContainer.appendChild(emptyMessage);
    if (query) {
      resultsContainer.classList.add('active');
    }
    return;
  }

  const ul = document.createElement('ul');
  results.forEach((result, index) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = result.url;
    a.textContent = result.title;
    a.setAttribute('data-result-index', index);
    li.appendChild(a);
    ul.appendChild(li);
  });

  resultsContainer.appendChild(ul);
  resultsContainer.classList.add('active');

  // Add analytics for result clicks (optional)
  resultsContainer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
      const resultTitle = link.textContent;
      console.log('Result clicked:', resultTitle);
    });
  });
}

/**
 * Perform fuzzy search on the index
 * Weights exact matches higher than partial matches
 */
function performSearch(query, index) {
  const lowerQuery = query.toLowerCase();

  return index
    .map(item => {
      const titleLower = item.title.toLowerCase();
      
      // Exact match gets highest priority
      if (titleLower === lowerQuery) {
        return { ...item, score: 1000 };
      }
      
      // Starts with query gets second priority
      if (titleLower.startsWith(lowerQuery)) {
        return { ...item, score: 100 };
      }
      
      // Contains query gets third priority
      if (titleLower.includes(lowerQuery)) {
        return { ...item, score: 50 };
      }
      
      // Fuzzy match - count matching characters
      let matchCount = 0;
      let queryIndex = 0;
      for (let i = 0; i < titleLower.length && queryIndex < lowerQuery.length; i++) {
        if (titleLower[i] === lowerQuery[queryIndex]) {
          matchCount++;
          queryIndex++;
        }
      }
      
      // Only return if all characters matched
      if (queryIndex === lowerQuery.length) {
        return { ...item, score: matchCount };
      }
      
      return null;
    })
    .filter(item => item !== null)
    .sort((a, b) => b.score - a.score)
    .map(({ score, ...item }) => item);
}

/**
 * Initialize search functionality
 * Called when the page loads
 */
async function initSearch() {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  if (!searchInput) {
    console.warn('Search input element not found');
    return;
  }

  // Load search index on first interaction
  let indexLoaded = false;

  searchInput.addEventListener('focus', async () => {
    if (!indexLoaded) {
      await loadSearchIndex();
      indexLoaded = true;
    }
  });

  // Handle search input
  let searchTimeout;
  searchInput.addEventListener('input', async () => {
    clearTimeout(searchTimeout);
    
    const query = searchInput.value.trim();
    
    // Clear results if query is too short
    if (query.length < 1) {
      searchResults.innerHTML = '';
      searchResults.classList.remove('active');
      return;
    }

    // Debounce search to avoid excessive processing
    searchTimeout = setTimeout(async () => {
      // Ensure index is loaded
      if (!indexLoaded) {
        await loadSearchIndex();
        indexLoaded = true;
      }

      // Perform search with minimum 2 characters for meaningful results
      if (query.length >= 1) {
        const results = performSearch(query, searchIndex);
        // Limit to 10 results for better UX
        displayResults(results.slice(0, 10), query);
      }
    }, 100); // 100ms debounce
  });

  // Close results when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      searchResults.classList.remove('active');
    }
  });

  // Show results container on focus if search has been performed
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim().length > 0 && searchResults.querySelector('ul, p')) {
      searchResults.classList.add('active');
    }
  });

  // Keyboard navigation for search results
  searchInput.addEventListener('keydown', (e) => {
    const results = searchResults.querySelectorAll('a');
    
    if (e.key === 'ArrowDown' && results.length > 0) {
      e.preventDefault();
      results[0].focus();
    }
  });

  searchResults.addEventListener('keydown', (e) => {
    const results = Array.from(searchResults.querySelectorAll('a'));
    const focused = document.activeElement;
    const currentIndex = results.indexOf(focused);

    if (e.key === 'ArrowDown' && currentIndex < results.length - 1) {
      e.preventDefault();
      results[currentIndex + 1].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentIndex > 0) {
        results[currentIndex - 1].focus();
      } else {
        searchInput.focus();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      searchResults.classList.remove('active');
      searchInput.focus();
    }
  });
}

// Initialize search when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSearch);
} else {
  initSearch();
}
