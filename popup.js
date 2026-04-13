document.addEventListener('DOMContentLoaded', function() {
  const startButton = document.getElementById('startButton');
  const stopButton = document.getElementById('stopButton');
  const statusDiv = document.getElementById('status');
  const logDiv = document.getElementById('log');
  const promptData = document.getElementById('promptData');
  const copyPromptButton = document.getElementById('copyPromptButton');
  const generatePromptButton = document.getElementById('generatePromptButton');
  const currentProgress = document.getElementById('currentProgress');
  const progressPercentage = document.getElementById('progressPercentage');
  const progressFill = document.getElementById('progressFill');
  const clearCacheButton = document.getElementById('clearCacheButton');
  const timeRangeSelect = document.getElementById('timeRange');
  
  let isCrawling = false;
  let retryCount = 0;
  const MAX_RETRIES = 3;
  let currentData = null;
  let totalUrls = 0;
  let currentUrlIndex = 0;
  
  // 清理 IndexedDB
  async function clearIndexedDB() {
    try {
      const databases = await window.indexedDB.databases();
      for (const db of databases) {
        if (db.name) {
          await window.indexedDB.deleteDatabase(db.name);
        }
      }
      updateStatus('缓存清理成功');
    } catch (error) {
      updateStatus(`清理缓存失败: ${error.message}`, true);
    }
  }

  // 清除缓存按钮点击事件
  clearCacheButton.addEventListener('click', async function() {
    if (isCrawling) {
      updateStatus('爬取过程中无法清理缓存', true);
      return;
    }
    
    if (confirm('确定要清理所有缓存数据吗？此操作不可恢复。')) {
      await clearIndexedDB();
    }
  });
  
  // 从content script获取数据
  async function getDataFromContentScript() {
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      if (!tab) {
        throw new Error('No active tab found');
      }
      
      const response = await chrome.tabs.sendMessage(tab.id, {type: 'GET_DATA'});
      if (response && response.data) {
        currentData = response.data;
        return response.data;
      } else {
        throw new Error('No data received from content script');
      }
    } catch (error) {
      updateStatus(`Error getting data from content script: ${error.message}`, true);
      return null;
    }
  }
  
  // 更新进度显示
  function updateProgress(current, total) {
    console.log(`[Popup] Updating progress: ${current}/${total}`);
    if (total === 0) {
      currentProgress.textContent = '0/0';
      progressPercentage.textContent = '0%';
      progressFill.style.width = '0%';
      return;
    }
    
    const percentage = Math.round((current / total) * 100);
    currentProgress.textContent = `${current}/${total}`;
    progressPercentage.textContent = `${percentage}%`;
    progressFill.style.width = `${percentage}%`;
    
    // 强制重绘进度条
    progressFill.style.display = 'none';
    progressFill.offsetHeight; // 触发重绘
    progressFill.style.display = 'block';
  }
  
  // 更新状态显示
  function updateStatus(message, isError = false) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.textContent = `[${timestamp}] ${message}`;
    logEntry.style.color = isError ? '#dc3545' : '#495057';
    logDiv.appendChild(logEntry);
    logDiv.scrollTop = logDiv.scrollHeight;
    
    statusDiv.textContent = message;
    statusDiv.style.color = isError ? '#dc3545' : '#495057';
  }
  
  // 根据时间范围过滤数据
  function filterByTimeRange(data) {
    const timeRange = timeRangeSelect.value;
    if (timeRange === 'all') return data;

    const now = new Date();
    let cutoff;
    switch (timeRange) {
      case 'today':
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '3days':
        cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        break;
      case '1week':
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1month':
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return data;
    }

    return data.filter(tweet => {
      if (!tweet.timestamp) return false;
      const tweetDate = new Date(tweet.timestamp);
      return tweetDate >= cutoff;
    });
  }

  // 生成Prompt
  async function generatePrompt(data) {
    try {
      // 总是从content script获取最新数据
      // 将所选数据源带给content script，以便返回对应源的数据
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      const response = await chrome.tabs.sendMessage(tab.id, {type: 'GET_DATA', dataSource: dataSourceSelect ? dataSourceSelect.value : 'ai'});
      data = response && response.data ? response.data : [];
      if (!data || data.length === 0) {
        updateStatus('No data available to generate prompt', true);
        return;
      }

      // 根据时间范围过滤
      data = filterByTimeRange(data);
      if (data.length === 0) {
        updateStatus('No tweets found in the selected time range', true);
        return;
      }

      // 更新currentData
      currentData = data;

      // 按URL分组数据
      const groupedData = {};
      data.forEach(tweet => {
        const url = tweet.url || '无链接';
        if (!groupedData[url]) {
          groupedData[url] = [];
        }
        groupedData[url].push({
          text: tweet.text,
          metrics: {
            retweet: tweet.retweets || 0,
            reply: tweet.replies || 0,
            like: tweet.likes || 0
          }
        });
      });

      // 生成结构化的提示文本
      let structuredContent = '';
      Object.keys(groupedData).forEach((url, urlIndex) => {
        const tweets = groupedData[url];
        structuredContent += `=== 数据源 ${urlIndex + 1} ===\n`;
        structuredContent += `来源URL: ${url}\n`;
        structuredContent += `推文数量: ${tweets.length}\n\n`;
        
        tweets.forEach((tweet, tweetIndex) => {
          structuredContent += `推文 ${tweetIndex + 1}:\n`;
          structuredContent += `内容: ${tweet.text}\n`;
          structuredContent += `---\n`;
        });
        structuredContent += '\n';
      });

      const prompt = `采用结构化的形式,按照每个抓取的url分组,总结内容

=== 抓取数据 ===

${structuredContent}`;

      promptData.value = prompt;
      promptData.style.display = 'block';
      copyPromptButton.style.display = 'block';
      updateStatus('Prompt generated successfully');
    } catch (error) {
      updateStatus(`Error generating prompt: ${error.message}`, true);
    }
  }
  
  // 复制Prompt数据
  copyPromptButton.addEventListener('click', function() {
    promptData.select();
    document.execCommand('copy');
    updateStatus('Prompt copied to clipboard');
  });
  
  // 生成Prompt
  generatePromptButton.addEventListener('click', async function() {
    await generatePrompt(currentData);
  });
  
  // 检查content script是否已加载，如果没有则注入
  async function ensureContentScriptLoaded(tabId) {
    try {
      // 尝试ping content script
      await chrome.tabs.sendMessage(tabId, {type: 'PING'});
      return true;
    } catch (error) {
      // Content script未加载，尝试注入
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['db.js', 'content.js']
        });
        // 等待一小段时间让脚本初始化
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
      } catch (injectError) {
        console.error('Failed to inject content script:', injectError);
        return false;
      }
    }
  }
  
  // 发送消息到content script
  async function sendMessageToContentScript(message, retry = true) {
    try {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      
      if (!tabs[0]) {
        updateStatus('Error: No active tab found', true);
        return;
      }
      
      const tab = tabs[0];
      
      // 检查是否在正确的域名上
      if (!tab.url || (!tab.url.includes('twitter.com') && !tab.url.includes('x.com'))) {
        updateStatus('Error: Please navigate to twitter.com or x.com first', true);
        return;
      }
      
      // 确保content script已加载
      const scriptLoaded = await ensureContentScriptLoaded(tab.id);
      if (!scriptLoaded && retry && retryCount < MAX_RETRIES) {
        retryCount++;
        updateStatus(`Retrying... (${retryCount}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return sendMessageToContentScript(message, true);
      }
      
      if (!scriptLoaded) {
        updateStatus('Error: Could not load content script. Try refreshing the page.', true);
        retryCount = 0;
        return;
      }
      
      // 发送消息
      const response = await chrome.tabs.sendMessage(tab.id, message);
      retryCount = 0;
      
      if (response && response.status) {
        updateStatus(`Message sent successfully: ${response.status}`);
      }
    } catch (error) {
      if (retry && retryCount < MAX_RETRIES) {
        retryCount++;
        updateStatus(`Retrying... (${retryCount}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return sendMessageToContentScript(message, true);
      } else {
        updateStatus('Error: ' + error.message, true);
        retryCount = 0;
      }
    }
  }
  
  // 开始爬取
  startButton.addEventListener('click', function() {
    if (isCrawling) return;
    
    isCrawling = true;
    startButton.disabled = true;
    updateStatus('Starting crawling...');
    
    // 隐藏Prompt
    promptData.style.display = 'none';
    copyPromptButton.style.display = 'none';
    currentData = null;
    
    // 重置进度
    currentUrlIndex = 0;
    updateProgress(0, 0);
    
    sendMessageToContentScript({type: 'START_CRAWLING', timeRange: timeRangeSelect.value});
  });
  
  // 停止爬取
  stopButton.addEventListener('click', async function() {
    isCrawling = false;
    startButton.disabled = false;
    updateStatus('Stopping crawling...');
    
    // 发送停止爬取和停止模拟人类行为的消息
    try {
      await sendMessageToContentScript({type: 'STOP_CRAWLING'});
      await sendMessageToContentScript({type: 'STOP_SIMULATE_HUMAN'});
      
      // 重置状态
      currentData = null;
      currentUrlIndex = 0;
      updateProgress(0, 0);
      
      // 隐藏Prompt
      promptData.style.display = 'none';
      copyPromptButton.style.display = 'none';
      
      updateStatus('Crawling stopped successfully');
    } catch (error) {
      updateStatus(`Error stopping crawling: ${error.message}`, true);
    }
  });
  
  // 监听来自background script的消息
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log(`[Popup] Received message type: ${message.type}`);
    
    switch (message.type) {
      case 'CONTENT_SCRIPT_READY':
        updateStatus('Content script is ready');
        break;
        
      case 'CRAWLING_STARTED':
        updateStatus('Crawling started');
        isCrawling = true;
        startButton.disabled = true;
        break;
        
      case 'CRAWLING_DATA':
        updateStatus(`Received ${message.data.length} tweets`);
        currentData = message.data;
        break;
        
      case 'CRAWLING_ERROR':
        updateStatus(`Error: ${message.error}`, true);
        break;
        
      case 'CRAWLING_COMPLETE':
        updateStatus('Crawling completed');
        isCrawling = false;
        startButton.disabled = false;
        break;
        
      case 'CRAWLING_STOPPED':
        updateStatus('Crawling stopped');
        isCrawling = false;
        startButton.disabled = false;
        break;
        
      case 'LOG_MESSAGE':
        updateStatus(message.message, message.isError);
        break;
        
      case 'UPDATE_PROGRESS':
        console.log(`[Popup] Progress update received: ${message.current}/${message.total}`);
        totalUrls = message.total;
        currentUrlIndex = message.current;
        updateProgress(currentUrlIndex, totalUrls);
        break;
    }
  });
});

function startCrawling() {
  // 在这里实现爬虫逻辑
  console.log('Starting crawling...');
}

function stopCrawling() {
  // 在这里实现停止爬虫的逻辑
  console.log('Stopping crawling...');
} 