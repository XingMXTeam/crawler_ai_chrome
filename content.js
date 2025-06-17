// 存储爬取结果
let crawlingResults = [];
let currentUrlIndex = 0;
let isCrawling = false;
let shouldSimulateHuman = false;  // 默认关闭模拟人类行为

// 转发日志到popup
function forwardLog(message, isError = false) {
    chrome.runtime.sendMessage({
        type: 'LOG_MESSAGE',
        message: message,
        isError: isError
    });
}

// 重写console.log和console.error
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function(...args) {
    // 调用原始的console.log
    originalConsoleLog.apply(console, args);
    
    // 将日志转发到popup
    const message = args.map(arg => {
        if (typeof arg === 'object') {
            return JSON.stringify(arg);
        }
        return String(arg);
    }).join(' ');
    forwardLog(message);
};

console.error = function(...args) {
    // 调用原始的console.error
    originalConsoleError.apply(console, args);
    
    // 将错误日志转发到popup
    const message = args.map(arg => {
        if (typeof arg === 'object') {
            return JSON.stringify(arg);
        }
        return String(arg);
    }).join(' ');
    forwardLog(message, true);
};

// 核心要爬取的URL列表
const TWITTER_URLS = [
    // "https://x.com/sama",
    // "https://x.com/github",
    // "https://x.com/gui_penedo",
    // "https://x.com/01Ai_Yi",
    // "https://x.com/gneubig",
    // "https://x.com/AssemblyAI",
    // "https://x.com/perplexity_ai",

    // "https://x.com/ollama",
    // "https://x.com/IterIntellectus",
    // "https://x.com/seti_park",
    // "https://x.com/FireworksAi_HQ",
    // "https://x.com/NVIDIAAIDev",
    // "https://x.com/sundarpichai",
    // "https://x.com/wunderwuzzi23",

    // "https://x.com/cognition_labs",
    // "https://x.com/sunjiao123sun_",
    // "https://x.com/peteratmsr",
    // "https://x.com/GaryMarcus",
    // "https://x.com/runwayml",
    // "https://x.com/OpenAI",

    // "https://x.com/AIatMeta",
    // "https://x.com/windsurf_ai",
    "https://x.com/StanfordHAI",
    "https://x.com/omarsar0",
    "https://x.com/AISafetyMemes",
    "https://x.com/MSFTResearch",

    "https://x.com/xenovacom",
    "https://x.com/tydsh",
    "https://x.com/NeurIPsConf",
    "https://x.com/SiliconFlowAI",
    "https://x.com/intern_lm",
    "https://x.com/alexrives",
    "https://x.com/deepseek_ai",

    "https://x.com/DrJimFan",
    "https://x.com/Scobleizer",
    "https://x.com/AndrewYNg",
    "https://x.com/SakanaAILabs",
    "https://x.com/LumaLabsAI",

    "https://x.com/Alibaba_Qwen",
    "https://x.com/mikeknoop",
    "https://x.com/gdb",
    "https://x.com/GoogleAI",
    "https://x.com/OpenAINewsroom",
    "https://x.com/OpenBMB",

    "https://x.com/nvidia",
    "https://x.com/satyanadella",
    "https://x.com/LangChainAi",
    "https://x.com/garrytan",
    "https://x.com/behrouz_ali",

    "https://x.com/kyutai_labs",
    "https://x.com/spacex",
    "https://x.com/rainisto",
    "https://x.com/unusual_whales",
    "https://x.com/patrickc",
    "https://x.com/linoy_tsaban",
    "https://x.com/itsPaulAi",

    "https://x.com/ProfTomYeh",
    "https://x.com/JacquesThibs",
    "https://x.com/alexalbert__",
    "https://x.com/douwekiela",
    "https://x.com/AlecRad",
    "https://x.com/dnystedt",
    "https://x.com/Haojun_Zhao14",
    
    "https://x.com/Teslaconomics",
    "https://x.com/Koven_Yu",
    "https://x.com/code",
    "https://x.com/ClementDelangue",
    "https://x.com/morteymike",
    "https://x.com/_jasonwei",
    "https://x.com/sriramk",
    "https://x.com/sainingxie",

    "https://x.com/hume_ai",
    "https://x.com/_philschmid",
    "https://x.com/TIIuae",
    "https://x.com/midjourney",
    "https://x.com/NVIDIARobotics",
    "https://x.com/OpenAiDevs",

    "https://x.com/TONGYI_SpeechAI",
    "https://x.com/ideogram_ai",
    "https://x.com/UnitreeRobotics",
    "https://x.com/juberti",
    "https://x.com/CerebrasSystems",
    "https://x.com/kimmonismus",
    "https://x.com/rohanpaul_ai",
    "https://x.com/pika_labs",
    "https://x.com/stevenbjohnson",
    "https://x.com/GoogleCloudTech",

    "https://x.com/minchoi",
    "https://x.com/julien_c",
    "https://x.com/mervenoyann",
    "https://x.com/_nateraw",
    "https://x.com/huggingface",
    "https://x.com/tunguz",
    "https://x.com/rasbt",
    "https://x.com/osanseviero",
    "https://x.com/fchollet",
    "https://x.com/mishig25",
    "https://x.com/abhi1thakur",
    "https://x.com/victormustar",
    "https://x.com/Waymo",
    "https://x.com/cursor_ai", 
    "https://x.com/dair_ai",
    "https://x.com/IFLScience",
    "https://x.com/sciam",
    "https://x.com/jed_yang",
    "https://x.com/freddy_alfonso_",
    "https://x.com/emollick",
    "https://x.com/billyuchenlin",
    "https://x.com/vitrupo",
    "https://x.com/EdwardSun0909",
    "https://x.com/Guodaya",
    "https://x.com/ajassy",
    "https://x.com/chetanp",

    "https://x.com/XDevelopers",
]

// 从storage中恢复状态
function restoreState() {
    return new Promise((resolve, reject) => {
        // 首先重置所有状态为默认值
        isCrawling = false;
        currentUrlIndex = 0;
        shouldSimulateHuman = false;
        crawlingResults = [];
        
        chrome.storage.local.get(['isCrawling', 'currentUrlIndex', 'shouldSimulateHuman', 'crawlingResults'], function(result) {
            if (chrome.runtime.lastError) {
                console.error('[Crawler] Error restoring state:', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
                return;
            }
            
            // 恢复所有状态，确保shouldSimulateHuman默认为false
            isCrawling = result.isCrawling || false;
            currentUrlIndex = result.currentUrlIndex || 0;
            shouldSimulateHuman = result.shouldSimulateHuman || false;
            crawlingResults = result.crawlingResults || [];
            
            console.log('[Crawler] State restored from storage:', {
                isCrawling,
                currentUrlIndex,
                shouldSimulateHuman,
                crawlingResultsLength: crawlingResults.length
            });
            
            // 如果正在爬取，立即开始爬取
            if (isCrawling) {
                console.log('[Crawler] Resuming crawling after state restore');
                crawlCurrentPage();
            }
            
            resolve();
        });
    });
}

// 保存状态到storage
function saveState() {
    const state = {
        isCrawling,
        currentUrlIndex,
        shouldSimulateHuman,
        crawlingResults
    };
    console.log('[Crawler] Saving state to storage:', state);
    chrome.storage.local.set(state);
}

// 初始化时恢复状态
restoreState().catch(error => {
    console.error('[Crawler] Failed to restore state:', error);
});

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
                console.log('[Crawler] Saving data to IndexedDB:', {
                    userInfo,
                    tweetData,
                    timestamp: new Date().toISOString()
                });
                try {
                    await window.dbManager.saveResults([{
                        ...userInfo,
                        ...tweetData
                    }]);
                    // 添加一个确认机制
                    await window.dbManager.verifyDataSaved();
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
        
        // 更新进度
        const nextIndex = currentUrlIndex + 1;
        console.log(`[Crawler] Updating progress: ${nextIndex}/${TWITTER_URLS.length}`);
        chrome.runtime.sendMessage({
            type: 'UPDATE_PROGRESS',
            current: nextIndex,
            total: TWITTER_URLS.length
        }, function(response) {
            if (chrome.runtime.lastError) {
                console.error('[Crawler] Error sending progress update:', chrome.runtime.lastError);
            } else {
                console.log('[Crawler] Progress update sent successfully');
            }
        });
        
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
    // 重置内存中的状态
    isCrawling = false;
    currentUrlIndex = 0;
    shouldSimulateHuman = false;
    crawlingResults = [];
    
    // 重置 localStorage 中的状态
    chrome.storage.local.remove(['isCrawling', 'currentUrlIndex', 'shouldSimulateHuman', 'crawlingResults'], function() {
        console.log('[Crawler] All states cleared from storage');
    });
    
    // 发送状态重置消息
    chrome.runtime.sendMessage({ 
        type: 'STATE_RESET',
        data: {
            isCrawling: false,
            currentUrlIndex: 0,
            shouldSimulateHuman: false
        }
    }, function(response) {
        if (chrome.runtime.lastError) {
            console.error('[Crawler] Error sending state reset message:', chrome.runtime.lastError);
        } else {
            console.log('[Crawler] State reset message sent successfully');
        }
    });
    
    console.log('[Crawler] All states have been reset');
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
        
        // 立即停止所有活动
        shouldSimulateHuman = false;
        isCrawling = false;
        
        // 清除所有定时器
        const highestTimeoutId = setTimeout(() => {}, 0);
        for (let i = 0; i < highestTimeoutId; i++) {
            clearTimeout(i);
        }
        
        // 重置状态
        resetState();
        
        // 确保状态被保存
        chrome.storage.local.set({
            shouldSimulateHuman: false,
            isCrawling: false,
            currentUrlIndex: 0
        }, function() {
            console.log('[Crawler] States saved after stop:', { shouldSimulateHuman, isCrawling });
        });
        
        // 发送停止消息
        chrome.runtime.sendMessage({ type: 'CRAWLING_STOPPED' }, function(response) {
            if (chrome.runtime.lastError) {
                console.error('[Crawler] Error sending stopped message:', chrome.runtime.lastError);
            }
        });
        
        // 停止页面滚动
        window.scrollTo(0, 0);
        
        sendResponse({ status: 'stopped' });
    } else if (message.type === 'STOP_SIMULATE_HUMAN') {
        console.log('[Crawler] Received stop simulate human command');
        shouldSimulateHuman = false;  // 停止模拟人类行为
        saveState();  // 保存状态
        sendResponse({ status: 'simulate_human_stopped' });
    } else if (message.type === 'GET_DATA') {
        console.log('[Crawler] Received get data request');
        
        const getDataWithRetry = async (retries = 3) => {
            for (let i = 0; i < retries; i++) {
                try {
                    const data = await window.dbManager.getAllResults();
                    if (data && data.length > 0) {
                        console.log('[Crawler] Getting data from IndexedDB:', {
                            timestamp: new Date().toISOString(),
                            dataLength: data.length
                        });
                        return data;
                    }
                    // 如果数据为空，等待一段时间后重试
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error(`[Crawler] Retry ${i + 1} failed:`, error);
                    if (i === retries - 1) throw error;
                }
            }
            return [];
        };

        getDataWithRetry()
            .then(data => {
                console.log('[Crawler] Sending data to popup:', data);
                sendResponse({ data });
            })
            .catch(error => {
                console.error('[Crawler] Error getting data:', error);
                sendResponse({ error: error.message });
            });
        
        return true;
    }
    
    // 返回true表示会异步发送响应
    return true;
});

// 页面加载完成后开始爬取
window.addEventListener('load', async () => {
    console.log('[Crawler] Page loaded, checking if should crawl');
    
    // 从storage中获取最新状态
    chrome.storage.local.get(['isCrawling', 'currentUrlIndex', 'shouldSimulateHuman'], function(result) {
        console.log('[Crawler] Retrieved state from storage:', result);
        
        // 更新内存中的状态
        isCrawling = result.isCrawling || false;
        currentUrlIndex = result.currentUrlIndex || 0;
        shouldSimulateHuman = result.shouldSimulateHuman || false;
        
        console.log('[Crawler] Current state after update:', { isCrawling, currentUrlIndex, shouldSimulateHuman });
        
        if (isCrawling) {
            console.log('[Crawler] Starting crawl on page load');
            crawlCurrentPage().then(success => {
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
            }).catch(error => {
                console.error('[Crawler] Error during crawl:', error);
                chrome.runtime.sendMessage({
                    type: 'CRAWLING_ERROR',
                    error: error.message
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error('[Crawler] Error sending error message:', chrome.runtime.lastError);
                    }
                });
            });
        } else {
            console.log('[Crawler] Not crawling, isCrawling is false');
        }
    });
});

// 在 dbManager 初始化时
window.dbManager = {
    isReady: false,
    init: async function() {
        if (this.isReady) return;
        try {
            await initDB();  // 使用 db.js 中的 initDB
            this.isReady = true;
            console.log('[DB] Database initialized successfully');
        } catch (error) {
            console.error('[DB] Failed to initialize database:', error);
            throw error;
        }
    },
    saveResults: async function(results) {
        if (!this.isReady) {
            await this.init();
        }
        return saveResults(results);  // 使用 db.js 中的 saveResults
    },
    getAllResults: async function() {
        if (!this.isReady) {
            await this.init();
        }
        return getAllResults();  // 使用 db.js 中的 getAllResults
    },
    verifyDataSaved: async function() {
        if (!this.isReady) {
            await this.init();
        }
        const results = await getAllResults();
        return results.length > 0;
    },
    clearAll: async function() {
        if (!this.isReady) {
            await this.init();
        }
        return clearResults();  // 使用 db.js 中的 clearResults
    }
};

// 在页面加载时初始化数据库
window.addEventListener('load', async () => {
    try {
        await window.dbManager.init();
        console.log('[DB] Database initialized successfully');
    } catch (error) {
        console.error('[DB] Failed to initialize database:', error);
    }
});