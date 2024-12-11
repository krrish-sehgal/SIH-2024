(async function () {
    try {
      const dbName = "DecryptedModelsDB"; // Database name
      const objectStoreName = "decryptedModels"; // Object store name
      const keyToFetch = "allModels"; // The key to fetch
  
      console.log("Opening IndexedDB...");
      const openRequest = indexedDB.open(dbName);
  
      openRequest.onsuccess = async function (event) {
        console.log("IndexedDB opened successfully.");
        const db = openRequest.result;
  
        // Start a transaction
        const transaction = db.transaction(objectStoreName, "readonly");
        const store = transaction.objectStore(objectStoreName);
  
        console.log(`Fetching key "${keyToFetch}" from object store "${objectStoreName}"...`);
        const request = store.get(keyToFetch);
  
        request.onsuccess = function (event) {
          const data = request.result;
          console.log("Data fetched from IndexedDB:", data);
  
          if (!data || !data.data || !data.data[0] || !data.data[0].decryptedModel) {
            console.error("Decrypted model not found in the fetched data. Please check the structure of your IndexedDB.");
            return;
          }
  
          // Extract the ArrayBuffer
          const decryptedModelBuffer = data.data[0].decryptedModel;
          console.log("Decrypted Model Buffer found:", decryptedModelBuffer);
  
          // Convert ArrayBuffer to Blob and download as a file
          const blob = new Blob([decryptedModelBuffer], { type: "application/octet-stream" });
          const url = URL.createObjectURL(blob);
  
          // Trigger file download
          const a = document.createElement("a");
          a.href = url;
          a.download = "model.onnx";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          console.log("Model downloaded successfully as model.onnx");
        };
  
        request.onerror = function (event) {
          console.error("Error fetching data from IndexedDB:", event.target.error);
        };
      };
  
      openRequest.onerror = function (event) {
        console.error("Error opening IndexedDB:", event.target.error);
      };
    } catch (error) {
      console.error("An error occurred:", error);
    }
  })();
  