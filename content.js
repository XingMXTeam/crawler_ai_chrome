// 存储爬取结果
let crawlingResults = [];
let currentUrlIndex = 0;
let isCrawling = false;

// 要爬取的URL列表
const TWITTER_URLS = [
    "https://x.com/sama",
    "https://x.com/github",
    // ... 其他URL ...
];

// 从storage中恢复状态
chrome.storage.local.get(['isCrawling', 'currentUrlIndex', 'crawlingResults'], function(result) {
    isCrawling = result.isCrawling || false;
    currentUrlIndex = result.currentUrlIndex || 0;
    crawlingResults = result.crawlingResults || [];
    console.log('[Crawler] State restored:', { isCrawling, currentUrlIndex, resultsCount: crawlingResults.length });
});

// 保存状态到storage
function saveState() {
    chrome.storage.local.set({
        isCrawling,
        currentUrlIndex,
        crawlingResults
    });
}

// 通知background script content script已准备就绪
chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_READY' });

// 随机延迟函数
function randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(`[Crawler] Waiting for ${delay}ms...`);
    return new Promise(resolve => setTimeout(resolve, delay));
}

// 获取用户信息
async function getUserInfo() {
    try {
        const username = window.location.pathname.split('/')[1];
        const nameElement = document.querySelector('[data-testid="UserName"]');
        const name = nameElement ? nameElement.textContent.trim() : '';
        
        console.log(`[Crawler] Successfully extracted user info for ${username}`);
        return { username, name };
    } catch (error) {
        console.error('[Crawler] Error getting user info:', error);
        throw error;
    }
}

// 获取推文数据
async function getTweetData(tweetElement) {
    try {
        const tweetText = tweetElement.querySelector('[data-testid="tweetText"]')?.textContent || '';
        const timestamp = tweetElement.querySelector('time')?.getAttribute('datetime') || '';
        const tweetUrl = tweetElement.querySelector('a[href*="/status/"]')?.href || '';
        
        const stats = tweetElement.querySelectorAll('[data-testid$="-count"]');
        const retweets = stats[0]?.textContent || '0';
        const replies = stats[1]?.textContent || '0';
        const likes = stats[2]?.textContent || '0';

        console.log(`[Crawler] Successfully extracted tweet data: ${tweetUrl}`);
        return {
            text: tweetText,
            timestamp,
            retweets,
            replies,
            likes,
            url: tweetUrl
        };
    } catch (error) {
        console.error('[Crawler] Error getting tweet data:', error);
        throw error;
    }
}

// 爬取当前页面的推文
async function crawlCurrentPage() {
    try {
        console.log(`[Crawler] Starting to crawl page: ${window.location.href}`);
        
        // 等待页面加载
        console.log('[Crawler] Waiting for page to load...');
        await randomDelay(2000, 4000);
        console.log('[Crawler] Page load delay completed');
        
        // 获取用户信息
        console.log('[Crawler] Attempting to get user info...');
        const userInfo = await getUserInfo();
        console.log(`[Crawler] User info: ${JSON.stringify(userInfo)}`);
        
        // 获取所有推文元素
        console.log('[Crawler] Searching for tweet elements...');
        const tweetElements = document.querySelectorAll('[data-testid="tweet"]');
        console.log(`[Crawler] Found ${tweetElements.length} tweets`);
        
        if (tweetElements.length === 0) {
            console.log('[Crawler] No tweets found, might need to scroll or wait longer');
            // 尝试滚动页面以加载更多推文
            window.scrollTo(0, document.body.scrollHeight);
            await randomDelay(2000, 3000);
            const newTweetElements = document.querySelectorAll('[data-testid="tweet"]');
            console.log(`[Crawler] After scroll: found ${newTweetElements.length} tweets`);
        }
        
        // 处理每条推文
        let processedCount = 0;
        const pageResults = [];
        
        for (const tweetElement of tweetElements) {
            try {
                console.log(`[Crawler] Processing tweet ${processedCount + 1}/${tweetElements.length}`);
                const tweetData = await getTweetData(tweetElement);
                pageResults.push({
                    ...userInfo,
                    ...tweetData
                });
                console.log(`[Crawler] Successfully processed tweet: ${tweetData.url}`);
                processedCount++;
            } catch (error) {
                console.error('[Crawler] Error processing tweet:', error);
            }
            await randomDelay(500, 1500);
        }
        
        // 发送结果到background script
        console.log(`[Crawler] Sending ${pageResults.length} tweets to background script`);
        chrome.runtime.sendMessage({
            type: 'CRAWLING_DATA',
            data: pageResults
        }, function(response) {
            if (chrome.runtime.lastError) {
                console.error('[Crawler] Error sending data:', chrome.runtime.lastError);
            } else {
                console.log('[Crawler] Data sent successfully');
            }
        });
        
        console.log(`[Crawler] Successfully crawled ${tweetElements.length} tweets`);
        return true;
    } catch (error) {
        console.error('[Crawler] Error crawling page:', error);
        chrome.runtime.sendMessage({
            type: 'CRAWLING_ERROR',
            error: error.message
        });
        return false;
    }
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`[Crawler] Received message: ${message.type}`);
    
    if (message.type === 'START_CRAWLING') {
        console.log('[Crawler] Received start crawling command');
        isCrawling = true;
        currentUrlIndex = 0;
        crawlingResults = [];
        saveState();
        
        // 立即发送响应
        sendResponse({ status: 'started' });
        
        // 使用setTimeout确保页面完全加载
        setTimeout(() => {
            window.location.href = TWITTER_URLS[0];
        }, 100);
    } else if (message.type === 'STOP_CRAWLING') {
        console.log('[Crawler] Received stop crawling command');
        isCrawling = false;
        saveState();
        sendResponse({ status: 'stopped' });
    }
    
    // 返回true表示会异步发送响应
    return true;
});

// 页面加载完成后开始爬取
window.addEventListener('load', async () => {
    console.log('[Crawler] Page loaded, checking if should crawl');
    console.log('[Crawler] Current state:', { isCrawling, currentUrlIndex });
    
    if (isCrawling) {
        console.log('[Crawler] Starting crawl on page load');
        try {
            const success = await crawlCurrentPage();
            if (success) {
                currentUrlIndex++;
                saveState();
                if (currentUrlIndex < TWITTER_URLS.length) {
                    console.log(`[Crawler] Moving to next URL: ${TWITTER_URLS[currentUrlIndex]}`);
                    window.location.href = TWITTER_URLS[currentUrlIndex];
                } else {
                    console.log('[Crawler] Finished crawling all URLs');
                    isCrawling = false;
                    saveState();
                    chrome.runtime.sendMessage({ type: 'CRAWLING_COMPLETE' });
                }
            }
        } catch (error) {
            console.error('[Crawler] Error during crawl:', error);
            chrome.runtime.sendMessage({
                type: 'CRAWLING_ERROR',
                error: error.message
            });
        }
    }
}); 