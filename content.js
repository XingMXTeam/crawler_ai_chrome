// 存储爬取结果
let crawlingResults = [];
let currentUrlIndex = 0;
let isCrawling = false;

// 要爬取的URL列表
const TWITTER_URLS = [
    "https://x.com/sama",
    "https://x.com/github",
    "https://x.com/gui_penedo",
    "https://x.com/01Ai_Yi",
    "https://x.com/gneubig",
    "https://x.com/AssemblyAI",
    "https://x.com/perplexity_ai",

    "https://x.com/ollama",
    "https://x.com/IterIntellectus",
    "https://x.com/seti_park",
    "https://x.com/FireworksAi_HQ",
    "https://x.com/NVIDIAAIDev",
    "https://x.com/sundarpichai",
    "https://x.com/wunderwuzzi23",

    "https://x.com/cognition_labs",
    "https://x.com/sunjiao123sun_",
    "https://x.com/peteratmsr",
    "https://x.com/GaryMarcus",
    "https://x.com/runwayml",
    "https://x.com/OpenAI",

    "https://x.com/AIatMeta",
    "https://x.com/windsurf_ai",
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

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`[Crawler] Received message: ${message.type}`);
    
    if (message.type === 'START_CRAWLING') {
        console.log('[Crawler] Received start crawling command');
        isCrawling = true;
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
                    isCrawling = false;
                    saveState();
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