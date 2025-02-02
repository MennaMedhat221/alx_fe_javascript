// DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const btn = document.getElementById('newQuote');
const newQuoteText = document.getElementById('newQuoteText');
const newQuoteCategory = document.getElementById('newQuoteCategory');
const exportBtn = document.getElementById('exportQuotes');
const importFile = document.getElementById('importFile');
const categorySelect = document.getElementById('categoryFilter');

// Constants
const API_ENDPOINT = 'https://jsonplaceholder.typicode.com/posts';
const SYNC_INTERVAL = 30000; // 30 seconds
const STORAGE_KEYS = {
    QUOTES: 'quotes',
    LAST_SYNC: 'lastSync',
    SYNC_CONFLICTS: 'syncConflicts',
    LAST_CATEGORY: 'lastSelectedCategory'
};

// Initial quotes data
let quotes = [
    {
        text: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
        category: "Motivation",
        id: 1,
        timestamp: Date.now()
    },
    {
        text: "The way to get started is to quit talking and begin doing.",
        category: "Motivation",
        id: 2,
        timestamp: Date.now()
    },
    {
        text: "If life were predictable it would cease to be life, and be without flavor.",
        category: "Motivation",
        id: 3,
        timestamp: Date.now()
    },
    {
        text: "Life is what happens when you're busy making other plans.",
        category: "Motivation",
        id: 4,
        timestamp: Date.now()
    }
];

// Create notification container
const notificationContainer = document.createElement('div');
notificationContainer.id = 'syncNotifications';
notificationContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 300px;
    z-index: 1000;
`;
document.body.appendChild(notificationContainer);

// Add sync status indicator
const syncStatus = document.createElement('div');
syncStatus.id = 'syncStatus';
syncStatus.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px; padding: 10px;">
        <span id="syncIcon">🔄</span>
        <span id="syncText">Sync Status: Up to date</span>
        <button id="manualSync" class="sync-button">Sync Now</button>
    </div>
`;
document.body.insertBefore(syncStatus, document.body.firstChild);

// Quote Management Functions
function initializeQuotes() {
    const savedQuotes = localStorage.getItem(STORAGE_KEYS.QUOTES);
    if (savedQuotes) {
        quotes = JSON.parse(savedQuotes);
    } else {
        saveQuotes();
    }
    
    const lastViewedQuote = sessionStorage.getItem('lastViewedQuote');
    if (lastViewedQuote) {
        quoteDisplay.innerHTML = lastViewedQuote;
    } else {
        showRandomQuote();
    }
    
    populateCategories();
    initializeFiltering();
    quoteSyncManager.startPeriodicSync();
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
    
    categorySelect.innerHTML = '<option value="all">All Categories</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.toLowerCase();
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
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
    
    const quoteData = {
        text: newQuote,
        category: newCategory,
        id: Date.now(),
        timestamp: Date.now()
    };
    
    quotes.push(quoteData);
    saveQuotes();
    
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
            
            // Add timestamp and ID if not present
            const processedQuotes = importedQuotes.map(quote => ({
                ...quote,
                id: quote.id || Date.now(),
                timestamp: quote.timestamp || Date.now()
            }));
            
            quotes.push(...processedQuotes);
            saveQuotes();
            populateCategories();
            showRandomQuote();
            quoteSyncManager.showNotification('Quotes imported successfully!');
        } catch (error) {
            quoteSyncManager.showNotification('Error importing quotes. Please ensure valid JSON format.', 'error');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function initializeFiltering() {
    categorySelect.addEventListener('change', () => {
        localStorage.setItem(STORAGE_KEYS.LAST_CATEGORY, categorySelect.value);
        showRandomQuote();
    });
}

// Sync Manager Class
class QuoteSyncManager {
    constructor() {
        this.lastSyncTimestamp = localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || 0;
        this.conflicts = JSON.parse(localStorage.getItem(STORAGE_KEYS.SYNC_CONFLICTS) || '[]');
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('manualSync').addEventListener('click', () => this.syncQuotes());
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `sync-notification ${type}`;
        notification.style.cssText = `
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 4px;
            background-color: ${type === 'error' ? '#ffebee' : '#e3f2fd'};
            border: 1px solid ${type === 'error' ? '#ef9a9a' : '#90caf9'};
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        notification.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="border: none; background: none; cursor: pointer;">✕</button>
            </div>
        `;
        notificationContainer.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    async syncQuotes() {
        try {
            this.updateSyncStatus('syncing');
    
            // Fetch existing quotes from server
            const serverQuotes = await this.fetchQuotesFromServer();
    
            // Merge local and server quotes
            const { merged, conflicts } = this.mergeQuotes(quotes, serverQuotes);
    
            if (conflicts.length > 0) {
                this.conflicts = conflicts;
                localStorage.setItem(STORAGE_KEYS.SYNC_CONFLICTS, JSON.stringify(conflicts));
                this.showNotification(`${conflicts.length} quote conflicts found.`, 'warning');
            }
    
            // Save merged quotes locally
            quotes = merged;
            saveQuotes();
    
            // Send quotes to server
            await fetch(API_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ quotes })
            });
    
            this.lastSyncTimestamp = Date.now();
            localStorage.setItem(STORAGE_KEYS.LAST_SYNC, this.lastSyncTimestamp);
    
            this.showNotification('Quotes synced with server');
            this.updateSyncStatus('synced');
    
            populateCategories();
            showRandomQuote();
        } catch (error) {
            console.error('Sync error:', error);
            this.showNotification('Failed to sync quotes. Please try again later.', 'error');
            this.updateSyncStatus('error');
        }
    }

    async fetchQuotesFromServer() {
        const response = await fetch(`${API_ENDPOINT}?_since=${this.lastSyncTimestamp}`);
        if (!response.ok) throw new Error('Failed to fetch server quotes');
        
        const posts = await response.json();
        return posts.map(post => ({
            text: post.body,
            category: 'Imported',
            id: post.id,
            timestamp: Date.now()
        })).slice(0, 5);
    }

    mergeQuotes(local, server) {
        const merged = [...local];
        const conflicts = [];
        
        server.forEach(serverQuote => {
            const localIndex = merged.findIndex(q => q.id === serverQuote.id);
            
            if (localIndex === -1) {
                merged.push(serverQuote);
            } else if (merged[localIndex].timestamp !== serverQuote.timestamp) {
                conflicts.push({
                    local: merged[localIndex],
                    server: serverQuote
                });
            }
        });
        
        return { merged, conflicts };
    }

    showConflictResolution() {
        const modal = document.createElement('div');
        modal.className = 'conflict-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        const conflictHtml = this.conflicts.map((conflict, index) => `
            <div class="conflict-item" style="margin-bottom: 20px; padding: 10px; border: 1px solid #e0e0e0;">
                <h4>Conflict ${index + 1}</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <h5>Local Version</h5>
                        <p>${conflict.local.text}</p>
                    </div>
                    <div>
                        <h5>Server Version</h5>
                        <p>${conflict.server.text}</p>
                    </div>
                </div>
                <div style="margin-top: 10px;">
                    <button onclick="quoteSyncManager.resolveConflict(${index}, 'local')">Keep Local</button>
                    <button onclick="quoteSyncManager.resolveConflict(${index}, 'server')">Keep Server</button>
                </div>
            </div>
        `).join('');
        
        modal.innerHTML = `
            <h3>Resolve Conflicts</h3>
            ${conflictHtml}
            <button onclick="this.parentElement.remove()" style="margin-top: 20px;">Close</button>
        `;
        
        document.body.appendChild(modal);
    }

    resolveConflict(index, choice) {
        const conflict = this.conflicts[index];
        const quoteIndex = quotes.findIndex(q => q.id === conflict.local.id);
        
        if (quoteIndex !== -1) {
            quotes[quoteIndex] = choice === 'local' ? conflict.local : conflict.server;
        }
        
        saveQuotes();
        this.conflicts.splice(index, 1);
        localStorage.setItem(STORAGE_KEYS.SYNC_CONFLICTS, JSON.stringify(this.conflicts));
        
        this.showNotification('Conflict resolved successfully');
        
        if (this.conflicts.length === 0) {
            document.querySelector('.conflict-modal')?.remove();
        } else {
            this.showConflictResolution();
        }
    }

    updateSyncStatus(status) {
        const syncIcon = document.getElementById('syncIcon');
        const syncText = document.getElementById('syncText');
        
        switch (status) {
            case 'syncing':
                syncIcon.textContent = '🔄';
                syncText.textContent = 'Syncing...';
                break;
            case 'synced':
                syncIcon.textContent = '✅';
                syncText.textContent = 'Last synced: Just now';
                break;
            case 'error':
                syncIcon.textContent = '❌';
                syncText.textContent = 'Sync failed';
                break;
        }
    }

    startPeriodicSync() {
        setInterval(() => this.syncQuotes(), SYNC_INTERVAL);
    }
}

// Initialize the sync manager
const quoteSyncManager = new QuoteSyncManager();

// Event Listeners
btn.addEventListener('click', showRandomQuote);
exportBtn.addEventListener('click', exportQuotes);
importFile.addEventListener('change', importFromJsonFile);

// Initialize the application
initializeQuotes();