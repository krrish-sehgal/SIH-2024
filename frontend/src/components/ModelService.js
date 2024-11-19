import React, { useEffect, useState } from "react";

function ModelService(props) {
  // State variables for managing keys, model data, and UI loading states
  const [publicKey, setPublicKey] = useState(null); // Stores the public RSA key
  const [encryptedModel, setEncryptedModel] = useState(null); // Encrypted ML model data
  const [encryptedAesKey, setEncryptedAesKey] = useState(null); // Encrypted AES key
  const [iv, setIv] = useState(null); // Initialization Vector for AES decryption
  const [modelLoaded, setModelLoaded] = useState(false); // Flag to indicate model is loaded
  const [decryptedModelBuffer, setDecryptedModelBuffer] = useState(null); // Buffer for decrypted model
  const [signedHash, setSignedHash] = useState(null); // State for signed hash
const [keyGenerated, setKeyGenerated] = useState(false);
const [isDecrypted, setIsDecrypted] = useState(false);
  // Loading indicators for UI feedback during asynchronous operations
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Function to generate RSA key pair and securely store the private key
  const generateKeyPair = async () => {
    setIsGeneratingKeys(true);
    try {
      // Generate an RSA key pair for encryption and decryption
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: { name: "SHA-256" },
        },
        true, // Keys can be exported (extractable)
        ["encrypt", "decrypt"] // Key usages
      );

      // Export the private key and store it securely in IndexedDB
      const exportedPrivateKey = await window.crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey
      );
      await storeKeyInIndexedDB("privateKey", exportedPrivateKey);

      // Export the public key and update state to send it to the backend
      const exportedPublicKey = await window.crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey
      );
      setPublicKey(exportedPublicKey);
      
      console.log("Key pair generated and private key stored securely!");
    } catch (error) {
      console.error("Error generating key pair:", error);
    } finally {
      setIsGeneratingKeys(false);
      setKeyGenerated(true);
      
    }
  };

  // Function to fetch the encrypted model from the backend using the public key
  const loadModel = async () => {
    setIsLoadingModel(true);
    try {
      if (!publicKey) {
        throw new Error("Please generate key pair first!");
      }

      // Fetch encrypted model data from the backend
      await fetchEncryptedModel(publicKey);
      
      
    } catch (error) {
      console.error("Error loading model:", error);
    } finally {
      setIsLoadingModel(false);
      setModelLoaded(true);
    }
  };

  // Function to decrypt the model using the private key and AES decryption
  const decryptModel = async () => {
    setIsDecrypting(true);
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

      // Decrypt the model using the decrypted AES key and IV
      const decryptedBuffer = await decryptWithAes(aesKey, encryptedModel, iv);

      // Update state with the decrypted model buffer
      setDecryptedModelBuffer(decryptedBuffer);
      setIsDecrypted(true);
      console.log("Model decrypted successfully!");
    } catch (error) {
      console.error("Error decrypting model:", error);
    } finally {
      setIsDecrypting(false);
      
    }
  };

  // Function to fetch encrypted model data from the backend
  const fetchEncryptedModel = async (publicKey) => {
    try {
      const publicKeyBase64 = arrayBufferToBase64(publicKey);
      console.log("Sending public key:", publicKeyBase64.substring(0, 64) + "...");

      // Add artificial delay to ensure smooth loading animation (optional, remove in production)
      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await fetch("http://localhost:8000/api/encrypted-model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicKey: arrayBufferToBase64(publicKey),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received encrypted data lengths:", {
        modelLength: data.encryptedModel?.length,
        keyLength: data.encryptedAesKey?.length,
        ivLength: data.iv?.length
      });

      if (data.encryptedModel && data.encryptedAesKey && data.iv && data.signedHash) {

        // Add small delay before updating state to ensure smooth transition
        await new Promise(resolve => setTimeout(resolve, 200));
        setEncryptedModel(data.encryptedModel);
        setEncryptedAesKey(data.encryptedAesKey);
        setIv(data.iv);
        setSignedHash(data.signedHash); // Store in state instead of IndexedDB

      } else {
        throw new Error("Failed to fetch encrypted model: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error fetching encrypted model:", error);
      throw error; // Re-throw to be caught by loadModel
    }
  };



  // Helper function to store the private key securely in IndexedDB
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

  // Helper function to retrieve the private key from IndexedDB
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
          if (keyName === "privateKey") {
            // Only import as CryptoKey if it's the private key
            const privateKey = await window.crypto.subtle.importKey(
              "pkcs8",
              keyData,
              { name: "RSA-OAEP", hash: "SHA-256" },
              true,
              ["decrypt"]
            );
            resolve(privateKey);
          } else {
            resolve(keyData); // Return raw data for other keys
          }
        };
        keyRequest.onerror = () => reject(keyRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  };

  // Function to decrypt the AES key using the RSA private key
  const decryptAesKey = async (privateKey, encryptedAesKeyBase64) => {
    try {
      console.log("Starting AES key decryption...");
      const encryptedAesKeyBuffer = base64ToArrayBuffer(encryptedAesKeyBase64);

      console.log("Encrypted AES key details:", {
        byteLength: encryptedAesKeyBuffer.byteLength,
        firstFewBytes: Array.from(new Uint8Array(encryptedAesKeyBuffer.slice(0, 4))),
      });
      
      console.log(privateKey);
      
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

  async function fetchPublicVerificationKey() {
    try {
      const response = await fetch('http://localhost:8000/api/public-verification-key');
      if (!response.ok) {
        throw new Error("Failed to fetch public key.");
      }
      const data = await response.json();
      console.log("Received public key data:", data); // Debug log
      return await importPublicKey(data.publicKey);
    } catch (error) {
      console.error("Error fetching public key:", error);
      throw error;
    }
  }

  async function importPublicKey(pemKey) {
    try {
      if (!pemKey) {
        throw new Error("PEM key is undefined or null");
      }

      // Clean the PEM key
      const pemContents = pemKey
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/[\r\n]+/g, '')
        .trim();

      console.log("Cleaned PEM contents length:", pemContents.length); // Debug log

      // Convert from base64 to binary
      const binaryString = window.atob(pemContents);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Import the key
      return await window.crypto.subtle.importKey(
        'spki',
        bytes.buffer,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: { name: 'SHA-256' },
        },
        true,
        ['verify']
      );
    } catch (error) {
      console.error("Error importing public key:", error);
      console.error("PEM key received:", pemKey);
      throw error;
    }
  }

  async function verifySignedHash(originalHash, signedHash, publicKey) {
    try {
      // Convert the signed hash from base64
      const signatureBytes = new Uint8Array(atob(signedHash).split('').map(c => c.charCodeAt(0)));

      // Convert the original hash from hex to ArrayBuffer
      const messageBytes = new Uint8Array(originalHash.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

      return await window.crypto.subtle.verify(
        {
          name: 'RSASSA-PKCS1-v1_5',
        },
        publicKey,
        signatureBytes,
        messageBytes
      );
    } catch (error){
      console.error("Error verifying hash:", error);
      return false;
    }
  }

  // Function to decrypt the model data using the AES key and IV
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

      // Step 3: Generate hash of the decrypted model
      const modelHash = await generateModelHash(decryptedModelBuffer);
      console.log("Frontend Model hash:", modelHash);
      console.log("Frontend Signed Model hash:", signedHash);
      const publicVerificationKey = await fetchPublicVerificationKey();
      if (await verifySignedHash(modelHash, signedHash, publicVerificationKey)) {

        console.log("Model verified successfully, loading model...");
      } else {
        console.error("Model verification failed, aborting decryption.");

      }

      // Don't try to decode the binary data as text
      console.log("Model decrypted successfully! Size:", decryptedModelBuffer.byteLength);

      // Return the buffer directly
      return decryptedModelBuffer;
    } catch (error) {
      console.error("Error decrypting model:", error);
      throw new Error("Model decryption failed.");
    }
  };
  async function generateModelHash(inputBuffer) {
    try {
      const hashBuffer = await crypto.subtle.digest("SHA-256", inputBuffer);
      return arrayBufferToHex(hashBuffer);
    } catch (error) {
      console.error("Error generating hash:", error);
      throw new Error("Failed to generate model hash.");
    }
  }

  function arrayBufferToHex(buffer) {
    const byteArray = new Uint8Array(buffer);
    let hexString = "";
    for (let i = 0; i < byteArray.length; i++) {
      const hex = byteArray[i].toString(16).padStart(2, "0");
      hexString += hex;
    }
    return hexString;
  }

  // Utility functions for data conversion between ArrayBuffer and Base64
  const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

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

  // Function to format file sizes in a human-readable format
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Functions to handle downloading of encrypted and decrypted models
  const downloadDecryptedModel = async () => {
    setIsDownloading(true);
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
    } finally {
      setIsDownloading(false);
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

  // Component for displaying a loading spinner during asynchronous operations
  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Main component rendering the application UI
  useEffect(
                ()=>{
                console.log(keyGenerated,modelLoaded,isDecrypted,decryptedModelBuffer);
                props.setKeyGenerated(keyGenerated) ;
                props.setIsLoaded(modelLoaded);
                props.setIsDecrypted(isDecrypted);
                if(!keyGenerated){
                generateKeyPair();}
                if(keyGenerated&&!modelLoaded){loadModel(); }
                (modelLoaded&&!isDecrypted)&&decryptModel();
                isDecrypted||(props.setDecryptedModel(decryptedModelBuffer));},[keyGenerated, modelLoaded, isDecrypted, decryptedModelBuffer]);
}

export default ModelService;