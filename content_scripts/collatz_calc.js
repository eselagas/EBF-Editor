const GITHUB_TOKEN = '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';
const REPO_OWNER = 'eselagas';
const REPO_NAME = 'app.files';
const BRANCH = 'cc';

// Base API URL
const API_BASE_URL = 'https://api.github.com';

// Global variables
let currentNumber = 1;
let sessionStartNumber = 0;
let sessionEndNumber = 0;
let sequenceData = '';
let isCalculating = true;

// Save progress before the tab/window is closed
window.addEventListener('beforeunload', (event) => {
    saveProgress();
    // Optionally prevent the default behavior
    event.preventDefault();
    event.returnValue = '';
});

// Initialize the calculation
(async function initialize() {
    try {
        // Get the highest starting number from existing files
        const highestNumber = await getHighestStartingNumber();
        currentNumber = highestNumber + 1;
        sessionStartNumber = currentNumber;
        // Start the Collatz calculations
        calculateCollatzAsync();
    } catch (error) {
        console.error('Initialization error:', error);
    }
})();

// Function to get the highest starting number from existing files
async function getHighestStartingNumber() {
    try {
        const response = await fetch(`${API_BASE_URL}/repos/${REPO_OWNER}/${REPO_NAME}/contents/`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch file list.');
        const files = await response.json();

        let maxStartNumber = 0;
        files.forEach(file => {
            const match = file.name.match(/^(\d+)-(\d+)$/);
            if (match) {
                const startNum = parseInt(match[1], 10);
                if (startNum > maxStartNumber) {
                    maxStartNumber = startNum;
                }
            }
        });
        return maxStartNumber;
    } catch (error) {
        console.error('Error fetching the highest starting number:', error);
        return 0;
    }
}

// Asynchronous Collatz calculation to prevent blocking the UI
async function calculateCollatzAsync() {
    while (isCalculating) {
        const sequence = calculateCollatzSequence(currentNumber);

        if (sequenceData !== '') {
            sequenceData += ':';
        }
        sequenceData += sequence.join(',');

        sessionEndNumber = currentNumber;
        currentNumber++;

        // Save progress periodically (every 100 numbers)
        if ((currentNumber - sessionStartNumber) % 100 === 0) {
            await saveProgress();
        }

        // Yield control to the browser
        await new Promise(resolve => setTimeout(resolve, 0));
    }
}

// Function to calculate the Collatz sequence for a given number
function calculateCollatzSequence(n) {
    const sequence = [n];
    while (n !== 1) {
        n = n % 2 === 0 ? n / 2 : 3 * n + 1;
        sequence.push(n);
    }
    return sequence;
}

// Function to save progress to GitHub
async function saveProgress() {
    const fileName = `${sessionStartNumber}-${sessionEndNumber}`;
    const content = btoa(sequenceData); // Encode the content in base64
    const apiUrl = `${API_BASE_URL}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fileName}`;
    const commitMessage = `Add sequences from ${sessionStartNumber} to ${sessionEndNumber}`;

    // Check if the file already exists
    let sha = null;
    try {
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`
            }
        });
        if (response.ok) {
            const fileData = await response.json();
            sha = fileData.sha;
        }
    } catch (error) {
        console.warn(`File ${fileName} does not exist yet.`);
    }

    // Prepare the payload
    const payload = {
        message: commitMessage,
        content: content,
        branch: BRANCH
    };
    if (sha) {
        payload.sha = sha; // Include the SHA if updating an existing file
    }

    // Save the file
    try {
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to save the file.');
        console.log(`Progress saved to ${fileName}.`);
        // Reset sequence data after saving
        sequenceData = '';
        sessionStartNumber = currentNumber;
    } catch (error) {
        console.error('Error saving progress:', error);
    }
}
