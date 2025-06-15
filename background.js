// 存储爬取结果
let crawlingResults = [];

// 发送日志到popup
function sendLog(message, isError = false) {
    console.log(`[Background] ${message}`);
    chrome.runtime.sendMessage({
        type: 'LOG_MESSAGE',
        message: `[Background] ${message}`,
        isError
    });
}

// 监听来自content script的消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log(`[Background] Received message type: ${message.type}`);
    
    switch (message.type) {
        case 'CONTENT_SCRIPT_READY':
            console.log('[Background] Content script is ready');
            sendResponse({ status: 'received' });
            break;
            
        case 'CRAWLING_STARTED':
            console.log('[Background] Crawling started');
            crawlingResults = []; // 重置结果
            sendResponse({ status: 'received' });
            break;
            
        case 'CRAWLING_DATA':
            console.log(`[Background] Received ${message.data.length} tweets`);
            crawlingResults = crawlingResults.concat(message.data);
            sendResponse({ status: 'received' });
            break;
            
        case 'CRAWLING_ERROR':
            console.error('[Background] Error:', message.error);
            sendResponse({ status: 'received' });
            break;
            
        case 'CRAWLING_COMPLETE':
            console.log('[Background] Crawling completed');
            console.log(`[Background] Total tweets collected: ${crawlingResults.length}`);
            sendResponse({ status: 'received' });
            break;
            
        case 'CRAWLING_STOPPED':
            console.log('[Background] Crawling stopped');
            sendResponse({ status: 'received' });
            break;
            
        case 'UPDATE_PROGRESS':
            // 转发进度更新到popup
            chrome.runtime.sendMessage({
                type: 'UPDATE_PROGRESS',
                current: message.current,
                total: message.total
            }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error('[Background] Error forwarding progress update:', chrome.runtime.lastError);
                }
            });
            sendResponse({ status: 'received' });
            break;
    }
    
    // 返回true表示会异步发送响应
    return true;
});

// 下载结果
function downloadResults() {
    sendLog('Preparing to download results');
    try {
        // 直接使用内存中的数据
        if (crawlingResults.length === 0) {
            sendLog('No results in memory, trying to get from storage', true);
            // 从storage中获取最新结果
            chrome.storage.local.get(['crawlingResults'], function(result) {
                if (chrome.runtime.lastError) {
                    sendLog(`Error getting data from storage: ${chrome.runtime.lastError.message}`, true);
                    return;
                }
                
                const results = result.crawlingResults || [];
                sendLog(`Retrieved ${results.length} tweets from storage`);
                
                if (results.length === 0) {
                    sendLog('No results to download', true);
                    return;
                }
                
                createAndDownloadFile(results);
            });
        } else {
            sendLog(`Using ${crawlingResults.length} tweets from memory`);
            createAndDownloadFile(crawlingResults);
        }
    } catch (error) {
        sendLog(`Error preparing download: ${error.message}`, true);
    }
}

// 创建并下载文件
function createAndDownloadFile(results) {
    try {
        sendLog('Creating JSON file...');
        const jsonString = JSON.stringify(results, null, 2);
        sendLog(`JSON string created, length: ${jsonString.length}`);
        
        const blob = new Blob([jsonString], { type: 'application/json' });
        sendLog('Blob created');
        
        const url = URL.createObjectURL(blob);
        sendLog('URL created');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `twitter_crawl_${timestamp}.json`;
        
        sendLog(`Starting download with filename: ${filename}`);
        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                sendLog(`Download error: ${chrome.runtime.lastError.message}`, true);
            } else {
                sendLog(`Download started with ID: ${downloadId}`);
            }
        });
    } catch (error) {
        sendLog(`Error creating/downloading file: ${error.message}`, true);
    }
} 