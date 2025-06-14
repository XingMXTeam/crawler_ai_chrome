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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    sendLog(`Received message: ${message.type}`);
    
    switch (message.type) {
        case 'CRAWLING_STARTED':
            sendLog('Crawling started');
            break;
            
        case 'CRAWLING_DATA':
            sendLog(`Received ${message.data.length} tweets`);
            crawlingResults = crawlingResults.concat(message.data);
            // 保存到storage以防数据丢失
            chrome.storage.local.set({ crawlingResults }, () => {
                if (chrome.runtime.lastError) {
                    sendLog(`Error saving data: ${chrome.runtime.lastError.message}`, true);
                } else {
                    sendLog('Data saved to storage successfully');
                }
            });
            break;
            
        case 'CRAWLING_ERROR':
            sendLog(`Crawling error: ${message.error}`, true);
            break;
            
        case 'CRAWLING_COMPLETE':
            sendLog('Crawling completed');
            sendLog(`Total tweets collected: ${crawlingResults.length}`);
            if (crawlingResults.length > 0) {
                // 发送所有数据到popup
                chrome.runtime.sendMessage({
                    type: 'CRAWLING_DATA',
                    data: crawlingResults
                });
            } else {
                sendLog('No results to display', true);
            }
            break;
            
        case 'CRAWLING_STOPPED':
            sendLog('Crawling stopped');
            break;
    }
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