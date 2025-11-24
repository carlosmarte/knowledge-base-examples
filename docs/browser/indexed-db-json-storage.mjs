const DB_NAME = 'JsonDB';
const STORE_NAME = 'documents';

export async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) =>
      reject(new Error('IndexedDB open error: ' + event.target.errorCode));
  });
}

export async function saveJSON(id, jsonString) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(jsonString, id);

    request.onsuccess = () => resolve(true);
    request.onerror = () =>
      reject(new Error('Failed to store JSON with ID: ' + id));
  });
}

export async function loadJSON(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      try {
        resolve(JSON.parse(request.result));
      } catch {
        reject(new Error(`Stored data for ID "${id}" is not valid JSON`));
      }
    };

    request.onerror = () =>
      reject(new Error('Failed to load JSON with ID: ' + id));
  });
}

export async function loadAllJSON() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const allData = {};

    const cursorRequest = store.openCursor();

    cursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        try {
          allData[cursor.key] = JSON.parse(cursor.value);
        } catch {
          allData[cursor.key] = null;
        }
        cursor.continue();
      } else {
        resolve(allData);
      }
    };

    cursorRequest.onerror = () => {
      reject(new Error('Failed to load all JSON entries'));
    };
  });
}

export async function exportAllToJSONFile(filename = 'indexeddb_export.json') {
  try {
    const data = await loadAllJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    console.log(`📁 Exported data to ${filename}`);
  } catch (err) {
    console.error('❌ Export failed:', err.message);
  }
}


const run = async () => {
  await saveJSON('item:001', JSON.stringify({ label: 'Example', value: 123 }));
  await saveJSON('item:002', JSON.stringify({ label: 'Another', value: 456 }));

  await exportAllToJSONFile();
};

run();
