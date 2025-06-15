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
  
  let isCrawling = false;
  let retryCount = 0;
  const MAX_RETRIES = 3;
  let currentData = null;
  let totalUrls = 0;
  let currentUrlIndex = 0;
  
  // 从IndexedDB获取数据
  async function getDataFromIndexedDB() {
    try {
      if (!window.dbManager) {
        throw new Error('Database not initialized');
      }
      const results = await window.dbManager.getAllResults();
      currentData = results;
      return results;
    } catch (error) {
      updateStatus(`Error getting data from IndexedDB: ${error.message}`, true);
      return null;
    }
  }
  
  // 更新进度显示
  function updateProgress(current, total) {
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
  
  // 生成Prompt
  function generatePrompt(data) {
    try {
      // 处理推文数据
      const tweets = data.map(tweet => ({
        text: tweet.text,
        url: tweet.url || '无链接',
        metrics: {
          retweet: tweet.retweets || 0,
          reply: tweet.replies || 0,
          like: tweet.likes || 0
        }
      }));

      // 生成提示文本
      const combinedText = tweets.map((text, i) => 
        `推文 ${i+1}:\n${text.text}\n来源: ${text.url}\n互动数据: 转发 ${text.metrics.retweet} | 回复 ${text.metrics.reply} | 点赞 ${text.metrics.like}`
      ).join('\n\n');

      const prompt = `请以科技主编的视角总结以下推文内容，可以详细介绍，要求：

1. 内容要求：
   - 交代清楚背景信息
   - 主语必须是人或机构组织（如果是人要带上身份/职位）
   - 使用简单易懂的中文，避免专业术语
   - 纯文本输出，不要使用markdown格式

2. 信息来源要求：
   - 优先使用推文中的直接信息
   - 如需补充外部信息，必须引用网络公开信息，并标注具体来源链接，请直接用链接URL
   - 对于推测性内容，必须明确标注"推测"或"可能"
   - 对于有争议的内容，需要标注不同观点及其来源
   - 所有引用的外部信息必须是可公开访问的网络资料

${combinedText}`;

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
    if (!currentData) {
      const data = await getDataFromIndexedDB();
      if (data) {
        generatePrompt(data);
      } else {
        updateStatus('No data available to generate prompt', true);
      }
    } else {
      generatePrompt(currentData);
    }
  });
  
  // 发送消息到content script
  function sendMessageToContentScript(message, retry = true) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (chrome.runtime.lastError) {
        updateStatus('Error: ' + chrome.runtime.lastError.message, true);
        return;
      }
      if (!tabs[0]) {
        updateStatus('Error: No active tab found', true);
        return;
      }
      
      chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
        if (chrome.runtime.lastError) {
          if (retry && retryCount < MAX_RETRIES) {
            retryCount++;
            updateStatus(`Retrying... (${retryCount}/${MAX_RETRIES})`);
            setTimeout(() => sendMessageToContentScript(message, true), 1000);
          } else {
            updateStatus('Error: ' + chrome.runtime.lastError.message, true);
            retryCount = 0;
          }
          return;
        }
        retryCount = 0;
        if (response && response.status) {
          updateStatus(`Message sent successfully: ${response.status}`);
        }
      });
    });
  }
  
  // 开始爬取
  startButton.addEventListener('click', function() {
    if (isCrawling) return;
    
    isCrawling = true;
    startButton.disabled = true;
    stopButton.disabled = false;
    updateStatus('Starting crawling...');
    
    // 隐藏Prompt
    promptData.style.display = 'none';
    copyPromptButton.style.display = 'none';
    currentData = null;
    
    // 重置进度
    currentUrlIndex = 0;
    updateProgress(0, 0);
    
    sendMessageToContentScript({type: 'START_CRAWLING'});
  });
  
  // 停止爬取
  stopButton.addEventListener('click', function() {
    if (!isCrawling) return;
    
    isCrawling = false;
    startButton.disabled = false;
    stopButton.disabled = true;
    updateStatus('Stopping crawling...');
    
    sendMessageToContentScript({type: 'STOP_CRAWLING'});
  });
  
  // 监听来自background script的消息
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    switch (message.type) {
      case 'CONTENT_SCRIPT_READY':
        updateStatus('Content script is ready');
        break;
        
      case 'CRAWLING_STARTED':
        updateStatus('Crawling started');
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
        stopButton.disabled = true;
        break;
        
      case 'CRAWLING_STOPPED':
        updateStatus('Crawling stopped');
        isCrawling = false;
        startButton.disabled = false;
        stopButton.disabled = true;
        break;
        
      case 'LOG_MESSAGE':
        updateStatus(message.message, message.isError);
        break;
        
      case 'UPDATE_PROGRESS':
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