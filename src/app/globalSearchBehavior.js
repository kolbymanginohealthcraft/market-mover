// ===== GLOBAL SEARCH BAR BEHAVIOR =====
// This script automatically enhances any input with the searchInput class
// to provide escape key behavior and clear button functionality

// Function to enhance a search input with global behavior
function enhanceSearchInput(input) {
  // Skip if already enhanced
  if (input.dataset.searchEnhanced === 'true') return;
  
  // Mark as enhanced
  input.dataset.searchEnhanced = 'true';
  
  // Add escape key behavior
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (this.value && this.value.length > 0) {
        // First escape: clear the search
        this.value = '';
        // Trigger change event for React state updates
        this.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        // Second escape (or first if no value): exit focus
        this.blur();
      }
    }
  });
  
  // Add clear button functionality
  function updateClearButton() {
    let clearBtn = input.parentNode.querySelector('.clearButton');
    
    if (input.value && input.value.length > 0) {
      // Show clear button if not already present
      if (!clearBtn) {
        clearBtn = document.createElement('button');
        clearBtn.className = 'clearButton';
        clearBtn.type = 'button';
        clearBtn.title = 'Clear search';
        clearBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        
        clearBtn.addEventListener('click', function() {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.focus();
        });
        
        input.parentNode.appendChild(clearBtn);
      }
    } else {
      // Hide clear button if present
      if (clearBtn) {
        clearBtn.remove();
      }
    }
  }
  
  // Listen for input changes to show/hide clear button
  input.addEventListener('input', updateClearButton);
  
  // Initial state
  updateClearButton();
}

// Function to run the enhancement
function runSearchEnhancement() {
  // Enhance existing search inputs
  document.querySelectorAll('input.searchInput').forEach(enhanceSearchInput);
  
  // Watch for new search inputs (for dynamic content)
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) { // Element node
          // Check if the added node is a search input
          if (node.classList && node.classList.contains('searchInput')) {
            enhanceSearchInput(node);
          }
          // Check children of added node
          const searchInputs = node.querySelectorAll ? node.querySelectorAll('input.searchInput') : [];
          searchInputs.forEach(enhanceSearchInput);
        }
      });
    });
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Run immediately if DOM is ready, otherwise wait for DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runSearchEnhancement);
} else {
  runSearchEnhancement();
}
