(async function () {
    try {
      const dbName = "DecryptedModelsDB"; // Database name
      const objectStoreName = "decryptedModels"; // Object store name
      const keyToUpdate = "allModels"; // The key to update
  
      console.log("Opening IndexedDB...");
      const openRequest = indexedDB.open(dbName);
  
      openRequest.onsuccess = async function (event) {
        console.log("IndexedDB opened successfully.");
        const db = openRequest.result;
  
        if (!db.objectStoreNames.contains(objectStoreName)) {
          console.error(`Object store "${objectStoreName}" not found. Please check the name.`);
          return;
        }
  
        // Prompt user to select the new ONNX file
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".onnx";
  
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) {
            console.error("No file selected.");
            return;
          }
  
          console.log(`Selected file: ${file.name}`);
  
          // Convert the ONNX file to ArrayBuffer
          const arrayBuffer = await file.arrayBuffer();
          console.log("New ONNX model buffer size:", arrayBuffer.byteLength);
  
          // Fetch the current data from IndexedDB
          const transaction = db.transaction(objectStoreName, "readwrite");
          const store = transaction.objectStore(objectStoreName);
  
          const getRequest = store.get(keyToUpdate);
  
          getRequest.onsuccess = function (event) {
            const data = getRequest.result;
            if (!data || !data.data || !data.data[1]) {
              console.error("Data structure not found. Please check the IndexedDB content.");
              return;
            }
  
            console.log("Existing data fetched successfully:", data);
  
            // Replace the decryptedModel buffer with the new one
            data.data[1].decryptedModel = arrayBuffer;
  
            // Update the IndexedDB record
            const putRequest = store.put(data);
  
            putRequest.onsuccess = function () {
              console.log("Model buffer replaced successfully in IndexedDB!");
            };
  
            putRequest.onerror = function (event) {
              console.error("Error updating IndexedDB:", event.target.error);
            };
          };
  
          getRequest.onerror = function (event) {
            console.error("Error fetching data from IndexedDB:", event.target.error);
          };
        };
  
        // Trigger file selection dialog
        input.click();
      };
  
      openRequest.onerror = function (event) {
        console.error("Error opening IndexedDB:", event.target.error);
      };
    } catch (error) {
      console.error("An error occurred:", error);
    }
  })();
  