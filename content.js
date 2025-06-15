// 存储爬取结果
let crawlingResults = [];
let currentUrlIndex = 0;
let isCrawling = false;
let shouldSimulateHuman = false;  // 默认关闭模拟人类行为

// 核心要爬取的URL列表
const TWITTER_URLS = [
    // AI/ML 研究机构与公司
    "https://x.com/OpenAI",
    "https://x.com/GoogleAI",
    "https://x.com/huggingface",
    "https://x.com/NVIDIAAIDev",
    "https://x.com/AIatMeta",
    "https://x.com/AnthropicAI",  // Claude的创建者
    // "https://x.com/DeepMind",     // DeepMind官方

    // // AI/ML 领域重要人物
    // "https://x.com/sama",
    // "https://x.com/AndrewYNg",
    // "https://x.com/GaryMarcus",
    // "https://x.com/DrJimFan",
    // "https://x.com/fchollet",
    // "https://x.com/ylecun",       // Yann LeCun
    // "https://x.com/geoffreyhinton", // Geoffrey Hinton
    // "https://x.com/ylecun",       // Yann LeCun

    // // 创新AI公司
    // "https://x.com/perplexity_ai",
    // "https://x.com/runwayml",
    // "https://x.com/midjourney",
    // "https://x.com/pika_labs",
    // "https://x.com/ideogram_ai",
    // "https://x.com/StabilityAI",  // Stable Diffusion
    // "https://x.com/CharacterAI",  // Character.AI

    // // AI基础设施与工具
    // "https://x.com/LangChainAi",
    // "https://x.com/ollama",
    // "https://x.com/CerebrasSystems",
    // "https://x.com/Waymo",
    // "https://x.com/Replicate",    // AI模型部署平台
    // "https://x.com/CohereAI",     // 语言模型API

    // // AI安全与伦理
    // "https://x.com/StanfordHAI",
    // "https://x.com/AISafetyMemes",
]

// 额外的优质账号（按需使用）
const ADDITIONAL_TWITTER_URLS = [
    // AI研究社区
    "https://x.com/NeurIPsConf",      // NeurIPS会议
    "https://x.com/ICMLconf",         // ICML会议
    "https://x.com/ICLRconf",         // ICLR会议
    // "https://x.com/ACL_Conference",   // ACL会议

    // AI创业公司
    "https://x.com/AssemblyAI",
    "https://x.com/FireworksAi_HQ",
    "https://x.com/cognition_labs",
    "https://x.com/SakanaAILabs",
    "https://x.com/LumaLabsAI",

    // AI工具与平台
    "https://x.com/OpenAINewsroom",
    "https://x.com/OpenBMB",
    "https://x.com/NVIDIARobotics",
    "https://x.com/UnitreeRobotics",
    "https://x.com/GoogleCloudTech",

    // AI研究者与工程师
    "https://x.com/_jasonwei",
    "https://x.com/sriramk",
    "https://x.com/sainingxie",
    "https://x.com/_philschmid",
    "https://x.com/rasbt",
    "https://x.com/osanseviero",
    "https://x.com/mishig25",

    // AI教育与资源
    "https://x.com/dair_ai",
    "https://x.com/IFLScience",
    "https://x.com/sciam",
    "https://x.com/emollick",
    "https://x.com/billyuchenlin"
]

// 从storage中恢复状态
chrome.storage.local.get(['isCrawling', 'currentUrlIndex'], function(result) {
    isCrawling = result.isCrawling || false;
    currentUrlIndex = result.currentUrlIndex || 0;
    console.log('[Crawler] State restored:', { isCrawling, currentUrlIndex });
});

// 保存状态到storage
function saveState() {
    chrome.storage.local.set({
        isCrawling,
        currentUrlIndex
    });
}

// 通知background script content script已准备就绪
chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_READY' }, function(response) {
    if (chrome.runtime.lastError) {
        console.error('[Crawler] Error sending ready message:', chrome.runtime.lastError);
    } else {
        console.log('[Crawler] Ready message sent successfully');
    }
});

// 随机延迟函数
function randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(`[Crawler] Waiting for ${delay}ms...`);
    return new Promise(resolve => setTimeout(resolve, delay));
}

// 模拟人类行为
async function simulateHumanBehavior() {
    if (!shouldSimulateHuman) return;  // 如果不需要模拟人类行为，直接返回
    
    // 随机滚动
    const scrollAmount = Math.floor(Math.random() * 300) + 100;
    window.scrollBy(0, scrollAmount);
    await randomDelay(500, 1500);
    
    // 随机鼠标移动
    const event = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: Math.random() * window.innerWidth,
        clientY: Math.random() * window.innerHeight
    });
    document.dispatchEvent(event);
    
    await randomDelay(1000, 2000);
}

// 获取用户信息
async function getUserInfo() {
    try {
        await simulateHumanBehavior();
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
        await simulateHumanBehavior();
        console.log('[Crawler] Attempting to extract tweet data...');
        
        const tweetText = tweetElement.querySelector('[data-testid="tweetText"]')?.textContent || '';
        console.log('[Crawler] Tweet text found:', tweetText ? 'Yes' : 'No');
        
        const timestamp = tweetElement.querySelector('time')?.getAttribute('datetime') || '';
        console.log('[Crawler] Timestamp found:', timestamp ? 'Yes' : 'No');
        
        const tweetUrl = tweetElement.querySelector('a[href*="/status/"]')?.href || '';
        console.log('[Crawler] Tweet URL found:', tweetUrl ? 'Yes' : 'No');
        
        const stats = tweetElement.querySelectorAll('[data-testid$="-count"]');
        console.log('[Crawler] Stats elements found:', stats.length);
        
        const retweets = stats[0]?.textContent || '0';
        const replies = stats[1]?.textContent || '0';
        const likes = stats[2]?.textContent || '0';
        
        console.log('[Crawler] Stats extracted:', { retweets, replies, likes });

        if (!tweetText) {
            console.log('[Crawler] Warning: Tweet has no text content');
        }

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
        await simulateHumanBehavior();
        
        // 获取用户信息
        console.log('[Crawler] Attempting to get user info...');
        const userInfo = await getUserInfo();
        console.log(`[Crawler] User info: ${JSON.stringify(userInfo)}`);
        
        // 获取所有推文元素
        console.log('[Crawler] Searching for tweet elements...');
        const tweetElements = document.querySelectorAll('[data-testid="tweet"]');
        console.log(`[Crawler] Found ${tweetElements.length} tweets`);
        
        if (tweetElements.length === 0) {
            console.log('[Crawler] No tweets found, checking page structure...');
            console.log('[Crawler] Current page HTML:', document.documentElement.innerHTML);
            
            // 尝试其他可能的选择器
            const alternativeSelectors = [
                'article[data-testid="tweet"]',
                'div[data-testid="tweet"]',
                'div[data-testid="cellInnerDiv"]',
                'div[data-testid="tweetText"]'
            ];
            
            for (const selector of alternativeSelectors) {
                const elements = document.querySelectorAll(selector);
                console.log(`[Crawler] Found ${elements.length} elements with selector: ${selector}`);
            }
            
            // 尝试滚动页面以加载更多推文
            console.log('[Crawler] Attempting to scroll page...');
            window.scrollTo(0, document.body.scrollHeight);
            await randomDelay(2000, 3000);
            await simulateHumanBehavior();
            
            const newTweetElements = document.querySelectorAll('[data-testid="tweet"]');
            console.log(`[Crawler] After scroll: found ${newTweetElements.length} tweets`);
            
            if (newTweetElements.length === 0) {
                console.log('[Crawler] Still no tweets found after scrolling');
                console.log('[Crawler] Page URL:', window.location.href);
                console.log('[Crawler] Page title:', document.title);
            }
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
                
                // 保存到IndexedDB
                try {
                    await window.dbManager.saveResults([{
                        ...userInfo,
                        ...tweetData
                    }]);
                } catch (error) {
                    console.error('[Crawler] Error saving to IndexedDB:', error);
                }
            } catch (error) {
                console.error('[Crawler] Error processing tweet:', error);
            }
            await randomDelay(500, 1500);
        }
        
        // 发送结果到background script
        console.log(`[Crawler] Sending ${pageResults.length} tweets to background script`);
        if (pageResults.length === 0) {
            console.log('[Crawler] Warning: No tweets were processed successfully');
        }
        
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

// 重置所有状态
function resetState() {
    isCrawling = false;
    currentUrlIndex = 0;
    shouldSimulateHuman = false;
    crawlingResults = [];
    saveState();
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`[Crawler] Received message: ${message.type}`);
    
    if (message.type === 'START_CRAWLING') {
        console.log('[Crawler] Received start crawling command');
        isCrawling = true;
        shouldSimulateHuman = true;  // 开始爬取时启用模拟人类行为
        currentUrlIndex = 0;
        crawlingResults = [];
        saveState();
        
        // 发送进度更新
        chrome.runtime.sendMessage({
            type: 'UPDATE_PROGRESS',
            current: 0,
            total: TWITTER_URLS.length
        }, function(response) {
            if (chrome.runtime.lastError) {
                console.error('[Crawler] Error sending progress update:', chrome.runtime.lastError);
            }
        });
        
        // 立即发送响应
        sendResponse({ status: 'started' });
        
        // 使用setTimeout确保页面完全加载
        setTimeout(() => {
            window.location.href = TWITTER_URLS[0];
        }, 100);
    } else if (message.type === 'STOP_CRAWLING') {
        console.log('[Crawler] Received stop crawling command');
        resetState();  // 停止爬取时重置所有状态
        sendResponse({ status: 'stopped' });
    } else if (message.type === 'STOP_SIMULATE_HUMAN') {
        console.log('[Crawler] Received stop simulate human command');
        shouldSimulateHuman = false;  // 停止模拟人类行为
        sendResponse({ status: 'simulate_human_stopped' });
    } else if (message.type === 'GET_DATA') {
        console.log('[Crawler] Received get data request');
        // 从window.dbManager获取数据
        window.dbManager.getAllResults()
            .then(data => {
                console.log('[Crawler] Sending data to popup:', data);
                sendResponse({ data });
            })
            .catch(error => {
                console.error('[Crawler] Error getting data:', error);
                sendResponse({ error: error.message });
            });
        return true;  // 保持消息通道开放以进行异步响应
    }
    
    // 返回true表示会异步发送响应
    return true;
});

// 页面加载完成后开始爬取
window.addEventListener('load', async () => {
    console.log('[Crawler] Page loaded, checking if should crawl');
    console.log('[Crawler] Current state:', { isCrawling, currentUrlIndex });
    
    // 确保页面加载时关闭模拟
    // shouldSimulateHuman = false;
    
    if (isCrawling) {
        console.log('[Crawler] Starting crawl on page load');
        try {
            const success = await crawlCurrentPage();
            if (success) {
                // 发送进度更新
                chrome.runtime.sendMessage({
                    type: 'UPDATE_PROGRESS',
                    current: currentUrlIndex + 1,
                    total: TWITTER_URLS.length
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error('[Crawler] Error sending progress update:', chrome.runtime.lastError);
                    }
                });
                
                currentUrlIndex++;
                saveState();
                
                if (currentUrlIndex < TWITTER_URLS.length) {
                    console.log(`[Crawler] Moving to next URL: ${TWITTER_URLS[currentUrlIndex]}`);
                    window.location.href = TWITTER_URLS[currentUrlIndex];
                } else {
                    console.log('[Crawler] Finished crawling all URLs');
                    resetState();  // 使用resetState替代单独的状态重置
                    chrome.runtime.sendMessage({ type: 'CRAWLING_COMPLETE' }, function(response) {
                        if (chrome.runtime.lastError) {
                            console.error('[Crawler] Error sending complete message:', chrome.runtime.lastError);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('[Crawler] Error during crawl:', error);
            chrome.runtime.sendMessage({
                type: 'CRAWLING_ERROR',
                error: error.message
            }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error('[Crawler] Error sending error message:', chrome.runtime.lastError);
                }
            });
        }
    }
});

// 添加页面关闭事件监听
// window.addEventListener('unload', () => {
//     console.log('[Crawler] Page unloading, resetting all states');
//     resetState();
// }); 