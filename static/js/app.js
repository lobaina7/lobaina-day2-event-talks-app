document.addEventListener('DOMContentLoaded', () => {
    // State Management
    let notesData = null;
    let selectedNote = null;
    let selectedDate = null;
    let currentFilter = 'all';
    
    // Mock Twitter Feed Database (Local State)
    let mockTweets = [
        {
            id: 'mock-1',
            avatar: '⚡',
            user: 'Cloud Explorer',
            handle: '@cloud_explorer',
            time: '35m',
            text: 'Just read the latest BigQuery release notes. The autonomous embedding generation is a game changer for vector search integration! #BigQuery #GoogleCloud #VectorSearch',
            likes: 18,
            retweets: 4,
            liked: false,
            retweeted: false
        }
    ];

    // DOM Elements
    const btnRefresh = document.getElementById('btn-refresh');
    const refreshIcon = document.getElementById('refresh-icon');
    const skeletonLoader = document.getElementById('skeleton-loader');
    const feedContent = document.getElementById('feed-content');
    const emptyState = document.getElementById('empty-state');
    const notesContainer = document.getElementById('notes-container');
    
    // Stats Elements
    const statTotalNotes = document.getElementById('stat-total-notes');
    const statFeatures = document.getElementById('stat-features');
    const statIssues = document.getElementById('stat-issues');
    const feedLastUpdated = document.getElementById('feed-last-updated');
    const feedStatusDot = document.getElementById('feed-status-dot');

    // Tweet Composer Elements
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCount = document.getElementById('char-count');
    const charProgressCircle = document.getElementById('char-progress-circle');
    const btnCopy = document.getElementById('btn-copy');
    const btnTweetReal = document.getElementById('btn-tweet-real');
    const btnTweetMock = document.getElementById('btn-tweet-mock');
    const selectedIndicator = document.getElementById('selected-indicator');
    const mockTweetsContainer = document.getElementById('mock-tweets-container');

    // Navigation and Floating Button Elements
    const btnBackToTop = document.getElementById('btn-back-to-top');
    const socialPanel = document.getElementById('social-panel');
    const mobileNavFeed = document.getElementById('mobile-nav-feed');
    const mobileNavSocial = document.getElementById('mobile-nav-social');
    const mobileSocialBadge = document.getElementById('mobile-social-badge');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // Circle progress variables
    const circleRadius = 12;
    const circleCircumference = 2 * Math.PI * circleRadius;
    charProgressCircle.style.strokeDasharray = `${circleCircumference} ${circleCircumference}`;
    charProgressCircle.style.strokeDashoffset = circleCircumference;

    // Initialize App
    init();

    function init() {
        fetchNotes();
        setupEventListeners();
        renderMockTweets();
    }

    // Event Listeners
    function setupEventListeners() {
        // Refresh Feed
        btnRefresh.addEventListener('click', fetchNotes);

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active class
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                
                currentFilter = target.dataset.category;
                renderFeed();
            });
        });

        // Tweet Textarea Input
        tweetTextarea.addEventListener('input', updateCharCount);

        // Copy Text Button
        btnCopy.addEventListener('click', copyTweetText);

        // Share to real X/Twitter
        btnTweetReal.addEventListener('click', shareToTwitter);

        // Simulate Post to mock feed
        btnTweetMock.addEventListener('click', postMockTweet);

        // Scroll to top behavior
        notesContainer.addEventListener('scroll', () => {
            if (notesContainer.scrollTop > 300) {
                btnBackToTop.classList.remove('hidden');
            } else {
                btnBackToTop.classList.add('hidden');
            }
        });
        btnBackToTop.addEventListener('click', () => {
            notesContainer.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Mobile Tabs Navigation
        if (mobileNavFeed && mobileNavSocial) {
            mobileNavFeed.addEventListener('click', () => {
                mobileNavFeed.classList.add('active');
                mobileNavSocial.classList.remove('active');
                socialPanel.classList.remove('active');
            });

            mobileNavSocial.addEventListener('click', () => {
                mobileNavSocial.classList.add('active');
                mobileNavFeed.classList.remove('active');
                socialPanel.classList.add('active');
                mobileSocialBadge.classList.add('hidden'); // clear badge once visited
            });
        }
    }

    // API Call: Fetch release notes from backend
    async function fetchNotes() {
        showLoadingState();
        try {
            const response = await fetch('/api/notes');
            if (!response.ok) throw new Error('Network response was not ok');
            notesData = await response.json();
            
            if (notesData.error) {
                throw new Error(notesData.error);
            }
            
            updateStats();
            renderFeed();
            showSuccessState();
        } catch (error) {
            console.error('Error fetching notes:', error);
            showErrorState(error.message);
        }
    }

    // UI State handlers
    function showLoadingState() {
        refreshIcon.classList.add('spinning');
        btnRefresh.disabled = true;
        skeletonLoader.classList.remove('hidden');
        feedContent.classList.add('hidden');
        emptyState.classList.add('hidden');
        
        feedStatusDot.className = 'status-dot yellow';
        feedLastUpdated.textContent = 'Fetching feed...';
    }

    function showSuccessState() {
        refreshIcon.classList.remove('spinning');
        btnRefresh.disabled = false;
        skeletonLoader.classList.add('hidden');
        feedContent.classList.remove('hidden');
        
        feedStatusDot.className = 'status-dot green';
        
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        feedLastUpdated.textContent = `Synced at ${timeString}`;
    }

    function showErrorState(message) {
        refreshIcon.classList.remove('spinning');
        btnRefresh.disabled = false;
        skeletonLoader.classList.add('hidden');
        feedContent.classList.add('hidden');
        
        feedStatusDot.className = 'status-dot yellow';
        feedLastUpdated.textContent = 'Sync failed';
        
        showToast(`Error: ${message || 'Failed to fetch release notes.'}`);
    }

    // Render Stats
    function updateStats() {
        if (!notesData || !notesData.entries) return;
        
        let totalCount = 0;
        let featureCount = 0;
        let issueCount = 0;

        notesData.entries.forEach(entry => {
            entry.sections.forEach(section => {
                totalCount++;
                if (section.category === 'Feature') featureCount++;
                if (section.category === 'Issue') issueCount++;
            });
        });

        statTotalNotes.textContent = totalCount;
        statFeatures.textContent = featureCount;
        statIssues.textContent = issueCount;
    }

    // Render the Release Notes feed cards
    function renderFeed() {
        if (!notesData || !notesData.entries) return;
        
        feedContent.innerHTML = '';
        let hasMatches = false;

        notesData.entries.forEach(entry => {
            // Filter sections of the entry
            const matchingSections = entry.sections.filter(sec => 
                currentFilter === 'all' || sec.category === currentFilter
            );

            if (matchingSections.length === 0) return;
            hasMatches = true;

            // Create date group
            const dateGroup = document.createElement('div');
            dateGroup.className = 'date-group';

            // Header for date group
            const header = document.createElement('div');
            header.className = 'date-group-header';
            header.innerHTML = `
                <span class="date-badge">${entry.title}</span>
                <div class="date-line"></div>
                <a href="${entry.link || '#'}" class="date-source-link" target="_blank" rel="noopener noreferrer" title="View official source">
                    <svg class="icon"><use href="#icon-external"></use></svg>
                </a>
            `;
            dateGroup.appendChild(header);

            // Card list container
            const cardList = document.createElement('div');
            cardList.className = 'update-card-list';

            // Generate sub-update cards
            matchingSections.forEach((section, index) => {
                const cardId = `${entry.id}-${index}`;
                const card = document.createElement('div');
                card.className = `update-card category-${section.category.toLowerCase()}`;
                if (selectedNote && selectedNote.id === cardId) {
                    card.classList.add('selected');
                }

                // Render content safely
                card.innerHTML = `
                    <div class="update-card-header">
                        <span class="category-tag ${section.category.toLowerCase()}">${section.category}</span>
                        <div class="select-status-badge">
                            <svg class="icon"><use href="#icon-check"></use></svg>
                        </div>
                    </div>
                    <div class="update-card-content">
                        ${section.content}
                    </div>
                `;

                // Card Click: Select update to compose tweet
                card.addEventListener('click', () => {
                    selectUpdate(card, cardId, entry.title, section, entry.link);
                });

                cardList.appendChild(card);
            });

            dateGroup.appendChild(cardList);
            feedContent.appendChild(dateGroup);
        });

        if (hasMatches) {
            feedContent.classList.remove('hidden');
            emptyState.classList.add('hidden');
        } else {
            feedContent.classList.add('hidden');
            emptyState.classList.remove('hidden');
        }
    }

    // Select Update Action
    function selectUpdate(cardElement, cardId, dateStr, section, officialLink) {
        // Deselect current
        document.querySelectorAll('.update-card').forEach(c => c.classList.remove('selected'));
        
        // Handle toggle
        if (selectedNote && selectedNote.id === cardId) {
            // Deselecting
            selectedNote = null;
            selectedDate = null;
            selectedIndicator.classList.add('hidden');
            btnTweetMock.disabled = true;
            tweetTextarea.value = '';
            updateCharCount();
            return;
        }

        // Selecting new
        cardElement.classList.add('selected');
        selectedNote = {
            id: cardId,
            category: section.category,
            content: section.content,
            link: officialLink
        };
        selectedDate = dateStr;

        // Auto-generate Tweet content
        generateAutoTweet(dateStr, section, officialLink);

        // Highlight visual link badge
        selectedIndicator.classList.remove('hidden');
        btnTweetMock.disabled = false;

        // Notify user in mobile view
        if (window.innerWidth <= 768) {
            mobileSocialBadge.classList.remove('hidden');
        }
        
        showToast('Release note linked to composer!');
    }

    // Strip HTML utility to convert parsed release note content into plaintext
    function stripHtml(html) {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        
        // Clean up code blocks to look readable in text
        tmp.querySelectorAll('code').forEach(c => {
            c.replaceWith(`\`${c.textContent}\``);
        });

        // Clean up hyperlinks to append their texts
        tmp.querySelectorAll('a').forEach(a => {
            a.replaceWith(a.textContent);
        });

        return tmp.textContent || tmp.innerText || "";
    }

    // Generate formatted Tweet based on the update
    function generateAutoTweet(date, section, url) {
        const categoryEmoji = {
            'Feature': '🚀',
            'Issue': '⚠️',
            'Announcement': '📢',
            'Changed': '🔄',
            'Deprecated': '🛑',
            'General': '💡'
        };

        const emoji = categoryEmoji[section.category] || '📢';
        const rawText = stripHtml(section.content).replace(/\s+/g, ' ').trim();
        
        // Craft tweet prefix and suffix
        const prefix = `${emoji} BigQuery Update (${date}) - [${section.category}]:\n`;
        const suffix = `\n\n#BigQuery #GCP ${url}`;
        
        // Truncate raw content if it exceeds 280 character limit
        const availableLength = 280 - (prefix.length + suffix.length);
        let bodyText = rawText;
        if (rawText.length > availableLength) {
            bodyText = rawText.substring(0, availableLength - 3) + '...';
        }

        tweetTextarea.value = `${prefix}${bodyText}${suffix}`;
        updateCharCount();
    }

    // Character Counter & circular indicator logic
    function updateCharCount() {
        const length = tweetTextarea.value.length;
        const remaining = 280 - length;
        charCount.textContent = remaining;

        // Set colors based on length
        if (remaining <= 20 && remaining > 0) {
            charCount.className = 'char-count warning';
            charProgressCircle.style.stroke = 'var(--color-deprecated)';
        } else if (remaining <= 0) {
            charCount.className = 'char-count error';
            charProgressCircle.style.stroke = 'var(--color-issue)';
        } else {
            charCount.className = 'char-count';
            charProgressCircle.style.stroke = 'var(--accent-twitter)';
        }

        // Circular progress indicator offset
        const percentage = Math.min(length / 280, 1);
        const offset = circleCircumference - (percentage * circleCircumference);
        charProgressCircle.style.strokeDashoffset = offset;
    }

    // Copy Tweet to clipboard
    function copyTweetText() {
        const text = tweetTextarea.value.trim();
        if (!text) {
            showToast('Composer is empty. Select a card first!');
            return;
        }

        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!');
        }).catch(err => {
            console.error('Copy failed:', err);
            showToast('Failed to copy text.');
        });
    }

    // Compose Tweet in Twitter Web Intent tab
    function shareToTwitter() {
        const text = tweetTextarea.value.trim();
        if (!text) {
            showToast('Select an update first!');
            return;
        }

        if (text.length > 280) {
            showToast('Tweet exceeds character limit!');
            return;
        }

        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    }

    // Simulate Twitter posting action
    function postMockTweet() {
        const text = tweetTextarea.value.trim();
        if (!text) return;

        if (text.length > 280) {
            showToast('Cannot simulate: Tweet exceeds 280 chars!');
            return;
        }

        // Create new mock tweet
        const newTweet = {
            id: `mock-${Date.now()}`,
            avatar: '💡',
            user: 'BigQuery Updater',
            handle: '@bq_updates',
            time: 'Just now',
            text: text,
            likes: 0,
            retweets: 0,
            liked: false,
            retweeted: false
        };

        // Add to array and render
        mockTweets.unshift(newTweet);
        renderMockTweets();

        // Clear selection to reset card and composer
        if (selectedNote) {
            const cardId = selectedNote.id;
            const selectedCard = document.querySelector(`.update-card.selected`);
            if (selectedCard) selectedCard.classList.remove('selected');
            
            selectedNote = null;
            selectedDate = null;
            selectedIndicator.classList.add('hidden');
            btnTweetMock.disabled = true;
            tweetTextarea.value = '';
            updateCharCount();
        }

        showToast('Tweet Simulated Successfully!');
        
        // Scroll mobile/tablet user down to mock timeline if active
        const container = document.getElementById('mock-tweets-container');
        if (container) {
            container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    // Render the simulated Twitter Feed
    function renderMockTweets() {
        // Clear placeholder or existing list
        mockTweetsContainer.innerHTML = '';

        if (mockTweets.length === 0) {
            mockTweetsContainer.innerHTML = `
                <div class="mock-tweet placeholder-tweet">
                    <p style="font-size:0.8rem; color:var(--text-muted); text-align:center; width:100%;">No tweets posted. Press Simulate above!</p>
                </div>
            `;
            return;
        }

        mockTweets.forEach(tweet => {
            const tweetEl = document.createElement('div');
            tweetEl.className = 'mock-tweet';
            tweetEl.dataset.id = tweet.id;

            // Highlight hashtags in text
            const textWithLinks = tweet.text.replace(/(#[a-zA-Z0-9_]+)/g, '<span style="color: var(--accent-twitter);">$1</span>')
                                           .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

            tweetEl.innerHTML = `
                <div class="mock-tweet-avatar">${tweet.avatar}</div>
                <div class="mock-tweet-content">
                    <div class="mock-tweet-header">
                        <span class="tweet-user">${tweet.user}</span>
                        <span class="tweet-handle">${tweet.handle}</span>
                        <span class="tweet-dot">·</span>
                        <span class="tweet-time">${tweet.time}</span>
                    </div>
                    <p class="tweet-text">${textWithLinks}</p>
                    <div class="tweet-actions">
                        <button class="tweet-action-btn comment">
                            <svg class="action-icon"><use href="#icon-comment"></use></svg>
                            <span>0</span>
                        </button>
                        <button class="tweet-action-btn retweet ${tweet.retweeted ? 'active' : ''}">
                            <svg class="action-icon"><use href="#icon-retweet"></use></svg>
                            <span>${tweet.retweets}</span>
                        </button>
                        <button class="tweet-action-btn heart ${tweet.liked ? 'active' : ''}">
                            <svg class="action-icon"><use href="#icon-heart"></use></svg>
                            <span>${tweet.likes}</span>
                        </button>
                    </div>
                </div>
            `;

            // Interactive Retweet and Like Actions inside simulation
            const btnLike = tweetEl.querySelector('.tweet-action-btn.heart');
            btnLike.addEventListener('click', () => {
                tweet.liked = !tweet.liked;
                tweet.likes += tweet.liked ? 1 : -1;
                btnLike.classList.toggle('active', tweet.liked);
                btnLike.querySelector('span').textContent = tweet.likes;
            });

            const btnRetweet = tweetEl.querySelector('.tweet-action-btn.retweet');
            btnRetweet.addEventListener('click', () => {
                tweet.retweeted = !tweet.retweeted;
                tweet.retweets += tweet.retweeted ? 1 : -1;
                btnRetweet.classList.toggle('active', tweet.retweeted);
                btnRetweet.querySelector('span').textContent = tweet.retweets;
            });

            mockTweetsContainer.appendChild(tweetEl);
        });
    }

    // Dynamic Toast Notification system
    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        
        // Force reflow for CSS transition
        toast.offsetWidth;
        
        toast.classList.add('show');

        // Clear after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 300);
        }, 3000);
    }
});
