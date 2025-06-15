// IndexedDB 数据库管理
const DB_NAME = 'twitter_crawler_db';
const DB_VERSION = 1;
const STORE_NAME = 'crawl_results';

// 初始化数据库
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('[DB] Error opening database:', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            console.log('[DB] Database opened successfully');
            resolve(event.target.result);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('username', 'username', { unique: false });
                console.log('[DB] Store created successfully');
            }
        };
    });
}

// 保存爬取结果
async function saveResults(results) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            const timestamp = new Date().toISOString();
            const savePromises = results.map(result => {
                return new Promise((resolve, reject) => {
                    const request = store.add({
                        ...result,
                        timestamp,
                        savedAt: new Date().toISOString()
                    });
                    
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            });

            Promise.all(savePromises)
                .then(() => {
                    console.log(`[DB] Successfully saved ${results.length} results`);
                    resolve();
                })
                .catch(error => {
                    console.error('[DB] Error saving results:', error);
                    reject(error);
                });
        });
    } catch (error) {
        console.error('[DB] Error in saveResults:', error);
        throw error;
    }
}

// 获取所有结果
async function getAllResults() {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                console.log(`[DB] Retrieved ${request.result.length} results`);
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('[DB] Error getting results:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('[DB] Error in getAllResults:', error);
        throw error;
    }
}

// 清除所有结果
async function clearResults() {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => {
                console.log('[DB] All results cleared');
                resolve();
            };

            request.onerror = () => {
                console.error('[DB] Error clearing results:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('[DB] Error in clearResults:', error);
        throw error;
    }
}

// 导出函数
window.dbManager = {
    saveResults,
    getAllResults,
    clearResults
}; 