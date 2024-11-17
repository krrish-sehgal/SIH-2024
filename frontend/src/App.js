import React, { useState } from "react";
import "./App.css";

function App() {
  const [publicKey, setPublicKey] = useState(null);
  const [encryptedModel, setEncryptedModel] = useState(null);
  const [encryptedAesKey, setEncryptedAesKey] = useState(null);
  const [iv, setIv] = useState(null); // Initialization Vector
  const [modelLoaded, setModelLoaded] = useState(false);
  const [decryptedModel, setDecryptedModel] = useState(""); // State for storing decrypted model
  const [decryptedModelBuffer, setDecryptedModelBuffer] = useState(null); // Add new state for storing decrypted model buffer

  // Generate Key Pair and securely store the private key in IndexedDB
  const generateKeyPair = async () => {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: { name: "SHA-256" },  // Changed to object format
        },
        true, // Set extractable to true
        ["encrypt", "decrypt"]
      );

      // Export the private key for storage
      const exportedPrivateKey = await window.crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey
      );

      // Store the exported private key
      await storeKeyInIndexedDB("privateKey", exportedPrivateKey);

      // Export the public key for UI display
      const exportedPublicKey = await window.crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey
      );
      setPublicKey(exportedPublicKey);

      console.log("Key pair generated and private key stored securely!");
    } catch (error) {
      console.error("Error generating key pair:", error);
    }
  };

  // Send the public key to the backend to get the encrypted model
  const fetchEncryptedModel = async (publicKey) => {
    try {
      const publicKeyBase64 = arrayBufferToBase64(publicKey);
      console.log("Sending public key:", publicKeyBase64.substring(0, 64) + "...");

      const response = await fetch("http://localhost:8000/api/get-encrypted-model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicKey: arrayBufferToBase64(publicKey),
        }),
      });

      const data = await response.json();
      console.log("Received encrypted data lengths:", {
        modelLength: data.encryptedModel?.length,
        keyLength: data.encryptedAesKey?.length,
        ivLength: data.iv?.length
      });

      if (data.encryptedModel && data.encryptedAesKey && data.iv) {
        setEncryptedModel(data.encryptedModel);
        setEncryptedAesKey(data.encryptedAesKey);
        setIv(data.iv); // Store the IV as well
      } else {
        console.error("Failed to fetch encrypted model:", data.message);
      }
    } catch (error) {
      console.error("Error fetching encrypted model:", error);
    }
  };

  // Store key securely in IndexedDB
  const storeKeyInIndexedDB = async (keyName, keyData) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("SecureKeysDB", 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("keys")) {
          db.createObjectStore("keys");
        }
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction("keys", "readwrite");
        const store = transaction.objectStore("keys");

        const keyRequest = store.put(keyData, keyName); // Store keyData
        keyRequest.onsuccess = () => resolve();
        keyRequest.onerror = () => reject(keyRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  };

  const loadModel = async () => {
    try {
      if (!publicKey) {
        console.error("Please generate key pair first!");
        return;
      }

      // Fetch encrypted model from backend
      await fetchEncryptedModel(publicKey);
      setModelLoaded(true);
    } catch (error) {
      console.error("Error loading model:", error);
    }
  };

  // Retrieve key from IndexedDB
  const getKeyFromIndexedDB = async (keyName) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("SecureKeysDB", 1);

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction("keys", "readonly");
        const store = transaction.objectStore("keys");

        const keyRequest = store.get(keyName);
        keyRequest.onsuccess = async () => {
          const keyData = keyRequest.result;

          // Import the private key
          const privateKey = await window.crypto.subtle.importKey(
            "pkcs8",
            keyData,
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["decrypt"]
          );

          resolve(privateKey);
        };
        keyRequest.onerror = () => reject(keyRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  };

  // Decrypt the model using the private key from IndexedDB and AES
  const decryptModel = async () => {
    try {
      console.log("Decrypting model...");

      // Retrieve the private key from IndexedDB
      const privateKey = await getKeyFromIndexedDB("privateKey");
      if (!privateKey) {
        console.error("Private key not found!");
        return;
      }

      // Decrypt the AES key using the private RSA key
      const aesKey = await decryptAesKey(privateKey, encryptedAesKey);

      console.log("AES Key decrypted:", aesKey);

      // Decrypt the model using the decrypted AES key and IV
      const decryptedModelBuffer = await decryptWithAes(aesKey, encryptedModel, iv);
      console.log("Model decrypted successfully!");

      // Update the state to store the decrypted model
      setDecryptedModelBuffer(decryptedModelBuffer);
      setDecryptedModel(`Model decrypted successfully`);
    } catch (error) {
      console.error("Error decrypting model:", error);
      setDecryptedModel("Error: Failed to decrypt model");
    }
  };

  // Decrypt the AES key using the RSA private key
  const decryptAesKey = async (privateKey, encryptedAesKeyBase64) => {
    try {
      console.log("Starting AES key decryption...");
      const encryptedAesKeyBuffer = base64ToArrayBuffer(encryptedAesKeyBase64);

      console.log("Encrypted AES key details:", {
        byteLength: encryptedAesKeyBuffer.byteLength,
        firstFewBytes: Array.from(new Uint8Array(encryptedAesKeyBuffer.slice(0, 4))),
      });

      const decryptedAesKey = await window.crypto.subtle.decrypt(
        {
          name: "RSA-OAEP",
          hash: { name: "SHA-256" }  // Match the hash used in key generation
        },
        privateKey,
        encryptedAesKeyBuffer
      );

      console.log("Decrypted AES key details:", {
        byteLength: decryptedAesKey.byteLength,
        expectedLength: 32  // Should be 32 bytes for AES-256
      });

      // Import as raw AES-CBC key
      const aesKey = await window.crypto.subtle.importKey(
        "raw",
        decryptedAesKey,
        {
          name: "AES-CBC",
          length: 256  // Specify key length
        },
        false,  // non-extractable
        ["decrypt"]
      );

      return aesKey;
    } catch (error) {
      console.error("Detailed error in decryptAesKey:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        inputKeyLength: encryptedAesKeyBase64?.length
      });
      throw error;  // Re-throw to maintain error chain
    }
  };

  // Decrypt the model using the AES key and IV
  const decryptWithAes = async (aesKey, encryptedModelBase64, ivBase64) => {
    try {
      console.log("Decrypting model with AES...");

      const encryptedModelBuffer = base64ToArrayBuffer(encryptedModelBase64);
      const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));

      console.log("Encrypted model size:", encryptedModelBuffer.byteLength);
      console.log("IV size:", iv.byteLength);

      const algorithm = {
        name: "AES-CBC",
        iv: iv
      };

      const decryptedModelBuffer = await window.crypto.subtle.decrypt(
        algorithm,
        aesKey,
        encryptedModelBuffer
      );

      // Don't try to decode the binary data as text
      console.log("Model decrypted successfully! Size:", decryptedModelBuffer.byteLength);

      // Return the buffer directly
      return decryptedModelBuffer;
    } catch (error) {
      console.error("Error decrypting model:", error);
      throw new Error("Model decryption failed.");
    }
  };

  // Helper functions for downloading models
  const downloadDecryptedModel = () => {
    try {
      const blob = new Blob([decryptedModelBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'decrypted-model.onnx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading decrypted model:", error);
    }
  };

  const downloadEncryptedModel = () => {
    try {
      const modelBuffer = base64ToArrayBuffer(encryptedModel);
      const blob = new Blob([modelBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'encrypted-model.bin';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading encrypted model:", error);
    }
  };

  // Helper function: Convert ArrayBuffer to Base64 for display
  const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // Helper function: Convert Base64 to ArrayBuffer
  const base64ToArrayBuffer = (base64) => {
    try {
      const binaryString = window.atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      console.error("Error in base64ToArrayBuffer:", error);
      throw new Error("Invalid base64 string");
    }
  };

  // Add this helper function for formatting file sizes
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="container">
      <h1>ML Model Security</h1>
      <button onClick={generateKeyPair}>Generate Key Pair</button>
      {publicKey && (
        <div>
          <h3>Public Key:</h3>
          <textarea
            readOnly
            value={arrayBufferToBase64(publicKey)}
          />
          <button onClick={loadModel}>Load ML Model</button>
        </div>
      )}
      {modelLoaded && (
        <div>
          <h3>Encrypted Model:</h3>
          <div className="model-info">
            <p>Size: {formatFileSize(base64ToArrayBuffer(encryptedModel).byteLength)}</p>
            <button onClick={downloadEncryptedModel}>Download Encrypted Model</button>
          </div>
          <textarea
            readOnly
            value={encryptedModel}
          />
          <h3>Encrypted AES Key:</h3>
          <p>Size: {formatFileSize(base64ToArrayBuffer(encryptedAesKey).byteLength)}</p>
          <textarea
            readOnly
            value={encryptedAesKey}
          />
          <h3>Initialization Vector (IV):</h3>
          <p>Size: {formatFileSize(base64ToArrayBuffer(iv).byteLength)}</p>
          <textarea
            readOnly
            value={iv}
          />
          <h3>Status:</h3>
          <p>Model loaded and encrypted. Ready for decryption.</p>
          <button onClick={decryptModel}>Decrypt Model</button>
        </div>
      )}
      {decryptedModel && (
        <div>
          <h3>Decrypted Model Status:</h3>
          <div className="model-info">
            {decryptedModelBuffer && (
              <>
                <p>Size: {formatFileSize(decryptedModelBuffer.byteLength)}</p>
                <button onClick={downloadDecryptedModel}>
                  Download Decrypted Model
                </button>
              </>
            )}
          </div>
          <pre>{decryptedModel}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
