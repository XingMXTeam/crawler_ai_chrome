// IndexedDB 数据库管理
const DB_VERSION = 1;
const STORE_NAME = 'crawl_results';
let dbInstance = null;  // 缓存数据库实例

// 获取当前日期的数据库名称
function getCurrentDBName() {
    const today = new Date();
    return `twitter_crawler_db_${today.toISOString().split('T')[0]}`;
}

// 获取所有数据库名称
async function getAllDatabaseNames() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.databases();
        request.onsuccess = (event) => {
            const databases = event.target.result;
            const dbNames = databases
                .filter(db => db.name.startsWith('twitter_crawler_db_'))
                .map(db => db.name)
                .sort()
                .reverse(); // 按日期降序排序
            resolve(dbNames);
        };
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// 删除旧的数据库
async function deleteOldDatabases() {
    try {
        const dbNames = await getAllDatabaseNames();
        // 保留最新的两个数据库
        const databasesToDelete = dbNames.slice(2);
        
        for (const dbName of databasesToDelete) {
            await new Promise((resolve, reject) => {
                const request = indexedDB.deleteDatabase(dbName);
                request.onsuccess = () => {
                    console.log(`[DB] Deleted old database: ${dbName}`);
                    resolve();
                };
                request.onerror = (event) => {
                    console.error(`[DB] Error deleting database ${dbName}:`, event.target.error);
                    reject(event.target.error);
                };
            });
        }
    } catch (error) {
        console.error('[DB] Error in deleteOldDatabases:', error);
    }
}

// 初始化数据库
async function initDB() {
    console.log('[DB] Starting database initialization...');
    
    // 如果已经有数据库实例，直接返回
    if (dbInstance) {
        console.log('[DB] Using existing database instance');
        return dbInstance;
    }
    
    const DB_NAME = getCurrentDBName();
    
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('[DB] Error opening database:', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            console.log('[DB] Database opened successfully');
            dbInstance = event.target.result;
            
            // 监听数据库关闭事件
            dbInstance.onclose = () => {
                console.log('[DB] Database connection closed');
                dbInstance = null;
            };
            
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            console.log('[DB] Database upgrade needed');
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                console.log('[DB] Creating object store:', STORE_NAME);
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('username', 'username', { unique: false });
                console.log('[DB] Store and indexes created successfully');
            }
        };
    });
}

// 保存爬取结果
async function saveResults(results) {
    console.log('[DB] Starting to save results, count:', results.length);
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const timestamp = new Date().toISOString();
            console.log('[DB] Transaction started, timestamp:', timestamp);

            // 使用单个事务保存所有结果
            const savePromises = results.map((result, index) => {
                return new Promise((resolve, reject) => {
                    const data = {
                        ...result,
                        timestamp,
                        savedAt: new Date().toISOString()
                    };
                    console.log(`[DB] Saving result ${index + 1}/${results.length}`);

                    const request = store.add(data);

                    request.onsuccess = () => {
                        console.log(`[DB] Successfully saved result ${index + 1}`);
                        resolve();
                    };
                    request.onerror = () => {
                        console.error(`[DB] Error saving result ${index + 1}:`, request.error);
                        reject(request.error);
                    };
                });
            });

            Promise.all(savePromises)
                .then(() => {
                    console.log(`[DB] Successfully saved all ${results.length} results`);
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
    console.log('[DB] Starting to get all results');
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
    console.log('[DB] Starting to clear all results');
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => {
                console.log('[DB] All results cleared successfully');
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
// 在content script中
window.dbManager = {
    saveResults,
    getAllResults,
    clearResults
};
