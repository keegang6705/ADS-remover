let providers = null;
const LOCAL_STORAGE_KEY = 'adsrm_providers';
const DEFAULT_CONFIG_URL = chrome.runtime.getURL('config-default/extended-blacklist.json');

document.getElementById('btn-back').addEventListener('click', () => {
    window.location.href = '../popup.html';
});

document.getElementById('btn-save').addEventListener('click', saveChanges);

// Load and initialize providers
async function initializeProviders() {
    try {
        // Try to load from storage first
        const stored = await chrome.storage.local.get(LOCAL_STORAGE_KEY);
        if (stored[LOCAL_STORAGE_KEY]) {
            providers = stored[LOCAL_STORAGE_KEY];
        } else {
            // If not in storage, load from default config
            const response = await fetch(DEFAULT_CONFIG_URL);
            providers = await response.json();
            // Save to storage
            await chrome.storage.local.set({ [LOCAL_STORAGE_KEY]: providers });
        }
        renderProviders();
        updateStats();
    } catch (error) {
        console.error('Failed to initialize providers:', error);
    }
}

function renderProviders() {
    const container = document.getElementById('provider-container');
    container.innerHTML = ''; // Clear existing content

    // Group providers by category
    const categorized = providers.blacklists.reduce((acc, provider) => {
        if (!acc[provider.category]) {
            acc[provider.category] = [];
        }
        acc[provider.category].push(provider);
        return acc;
    }, {});

    // Create sections for each category
    for (const [category, categoryProviders] of Object.entries(categorized)) {
        const section = document.createElement('div');
        section.className = 'category-section';

        // Category header with select all checkbox
        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `
            <div style="text-transform: capitalize;">${category}</div>
            <label class="switch">
                <input type="checkbox" class="category-toggle" data-category="${category}"
                    ${categoryProviders.every(p => p.active) ? 'checked' : ''}>
                <span class="slider round"></span>
            </label>
        `;
        section.appendChild(header);

        // Add providers for this category
        categoryProviders.forEach(provider => {
            const item = document.createElement('div');
            item.className = 'provider-item';
            item.innerHTML = `
                <div class="provider-info">
                    <div class="provider-name">${getProviderName(provider)}</div>
                </div>
                <label class="switch">
                    <input type="checkbox" class="provider-toggle" 
                        data-url="${provider.url}" ${provider.active ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            `;
            section.appendChild(item);
        });

        container.appendChild(section);
    }

    // Add event listeners for toggles
    addToggleListeners();
}

function getProviderName(provider) {
    const url = new URL(provider.url);
    const parts = url.pathname.split('/');
    return parts[parts.length - 1].replace(/[-_]/g, ' ');
}

function addToggleListeners() {
    // Category toggles
    document.querySelectorAll('.category-toggle').forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const category = e.target.dataset.category;
            const isChecked = e.target.checked;
            
            // Update all providers in this category
            providers.blacklists
                .filter(p => p.category === category)
                .forEach(p => p.active = isChecked);
            
            // Update UI
            renderProviders();
            updateStats();
        });
    });

    // Individual provider toggles
    document.querySelectorAll('.provider-toggle').forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const url = e.target.dataset.url;
            const provider = providers.blacklists.find(p => p.url === url);
            if (provider) {
                provider.active = e.target.checked;
                updateStats();
            }
        });
    });
}

function updateStats() {
    const activeCount = providers.blacklists.filter(p => p.active).length;
    document.getElementById('active-count').textContent = activeCount;
}

async function saveChanges() {
    try {
        await chrome.storage.local.set({ [LOCAL_STORAGE_KEY]: providers });
        // Visual feedback
        const saveBtn = document.getElementById('btn-save');
        saveBtn.textContent = 'Saved!';
        saveBtn.style.borderColor = '#4CAF50';
        setTimeout(() => {
            saveBtn.textContent = 'Save Changes';
            saveBtn.style.borderColor = '';
        }, 2000);
    } catch (error) {
        console.error('Failed to save providers:', error);
        alert('Failed to save changes. Please try again.');
    }
}

// Initialize when page loads
initializeProviders();