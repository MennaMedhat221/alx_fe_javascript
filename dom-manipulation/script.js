const quoteDisplay = document.getElementById('quoteDisplay');
const btn = document.getElementById('newQuote');
const newQuoteText = document.getElementById('newQuoteText');
const newQuoteCategory = document.getElementById('newQuoteCategory');
const exportBtn = document.getElementById('exportQuotes');
const importFile = document.getElementById('importFile');
const categorySelect = document.getElementById('categoryFilter');

// Storage keys
const STORAGE_KEYS = {
    QUOTES: 'quotes',
    LAST_CATEGORY: 'lastSelectedCategory'
};

let quotes = [
    {
        text: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
        category: "Motivation"
    },
    {
        text: "The way to get started is to quit talking and begin doing.",
        category: "Motivation",
    },
    {
        text: "If life were predictable it would cease to be life, and be without flavor.",
        category: "Motivation"
    },
    {
        text: "Life is what happens when you're busy making other plans.",
        category: "Motivation"
    }
];

function initializeQuotes() {
    const savedQuotes = localStorage.getItem(STORAGE_KEYS.QUOTES);
    if (savedQuotes) {
        quotes = JSON.parse(savedQuotes);
    } else {
        // Save initial quotes if no saved quotes exist
        saveQuotes();
    }
    
    const lastViewedQuote = sessionStorage.getItem('lastViewedQuote');
    if (lastViewedQuote) {
        quoteDisplay.innerHTML = lastViewedQuote;
    } else {
        showRandomQuote();
    }
    
    // Initialize filtering system
    populateCategories();
    initializeFiltering();
}

function saveQuotes() {
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
}

function showRandomQuote() {
    const selectedCategory = categorySelect.value;
    const filteredQuotes = selectedCategory === 'all' 
        ? quotes 
        : quotes.filter(quote => quote.category.toLowerCase() === selectedCategory.toLowerCase());
    
    if (filteredQuotes.length === 0) {
        quoteDisplay.innerHTML = "No quotes available in this category";
        return;
    }
    
    const index = Math.floor(Math.random() * filteredQuotes.length);
    const quote = filteredQuotes[index];
    quoteDisplay.innerHTML = quote.text;
    sessionStorage.setItem('lastViewedQuote', quote.text);
}

function populateCategories() {
    const categories = [...new Set(quotes.map(quote => quote.category))].sort();
    
    // Clear existing options except "All"
    categorySelect.innerHTML = '<option value="all">All Categories</option>';
    
    // Add category options
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.toLowerCase();
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
    // Restore last selected category
    const lastCategory = localStorage.getItem(STORAGE_KEYS.LAST_CATEGORY);
    if (lastCategory && categories.map(c => c.toLowerCase()).includes(lastCategory.toLowerCase())) {
        categorySelect.value = lastCategory;
    }
}

function createAddQuoteForm() {
    const newQuote = newQuoteText.value.trim();
    const newCategory = newQuoteCategory.value.trim();
    
    if (!newQuote || !newCategory) {
        alert('Please fill in both the quote and category fields.');
        return;
    }
    
    quotes.push({ text: newQuote, category: newCategory });
    saveQuotes();
    
    // Update categories dropdown if new category added
    populateCategories();
    
    newQuoteText.value = '';
    newQuoteCategory.value = '';
    
    quoteDisplay.innerHTML = newQuote;
    sessionStorage.setItem('lastViewedQuote', newQuote);
}

function exportQuotes() {
    const quotesJson = JSON.stringify(quotes, null, 2);
    const blob = new Blob([quotesJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedQuotes = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedQuotes) || 
                !importedQuotes.every(quote => 
                    typeof quote === 'object' && 
                    'text' in quote && 
                    'category' in quote)) {
                throw new Error('Invalid quote format');
            }
            
            quotes.push(...importedQuotes);
            saveQuotes();
            populateCategories(); // Update categories after import
            showRandomQuote();
            alert('Quotes imported successfully!');
        } catch (error) {
            alert('Error importing quotes. Please ensure the file contains valid JSON quote data.');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

function initializeFiltering() {
    // Save category selection
    categorySelect.addEventListener('change', () => {
        localStorage.setItem(STORAGE_KEYS.LAST_CATEGORY, categorySelect.value);
        showRandomQuote(); // Show a random quote from the selected category
    });
}

// Event Listeners
btn.addEventListener('click', showRandomQuote);
exportBtn.addEventListener('click', exportQuotes);
importFile.addEventListener('change', importFromJsonFile);

initializeQuotes();