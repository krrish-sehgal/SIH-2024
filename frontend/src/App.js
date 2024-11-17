import React, { useState } from "react";
import {
  ShieldCheckIcon,
  KeyIcon,
  CloudArrowDownIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

function App() {
  // State variables for managing keys, model data, and UI loading states
  const [publicKey, setPublicKey] = useState(null); // Stores the public RSA key
  const [encryptedModel, setEncryptedModel] = useState(null); // Encrypted ML model data
  const [encryptedAesKey, setEncryptedAesKey] = useState(null); // Encrypted AES key
  const [iv, setIv] = useState(null); // Initialization Vector for AES decryption
  const [modelLoaded, setModelLoaded] = useState(false); // Flag to indicate model is loaded
  const [decryptedModelBuffer, setDecryptedModelBuffer] = useState(null); // Buffer for decrypted model
  const [signedHash, setSignedHash] = useState(null); // State for signed hash

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
      setModelLoaded(true);
    } catch (error) {
      console.error("Error loading model:", error);
    } finally {
      setIsLoadingModel(false);
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
    // Fetch the PEM formatted public key from the server
    const response = await fetch('http://localhost:8000/api/public-verification-key');
    if (!response.ok) {
        throw new Error("Failed to fetch public key.");
    }

    const publicKeyPem = await response.text(); // Assuming the public key is returned as PEM format

    // Import the PEM formatted public key into a CryptoKey object
    const publicKey = await importPublicKey(publicKeyPem);

    return publicKey; // Return the imported CryptoKey object
}

async function importPublicKey(pemKey) {
    // Remove the "BEGIN" and "END" parts of the PEM string and decode the base64
    const keyParts = pemKey.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n/g, '');
    const keyBytes = Uint8Array.from(atob(keyParts), c => c.charCodeAt(0));

    try {
        const importedKey = await crypto.subtle.importKey(
            "spki", // Format for public keys
            keyBytes,
            {
                name: "RSA-OAEP", // Algorithm name (or you can use another algorithm, depending on your use case)
                hash: { name: "SHA-256" }
            },
            true, // Extractable
            ["verify"] // The operations the key will be used for
        );
        return importedKey;
    } catch (error) {
        console.error("Error importing public key:", error);
        throw new Error("Failed to import public key.");
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
        console.log("Model hash:", modelHash);
        console.log("Signed hash:", signedHash);
        const publicVerificationKey = await fetchPublicVerificationKey();
        if(await verifySignedHash(modelHash, signedHash, publicVerificationKey)){ 

            console.log("Model verified successfully, loading model...");
        }else{
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
  async function verifySignedHash(originalHash, signedHash, publicKey) {
    // Convert the signed hash from Base64 to Uint8Array
    const signedHashBuffer = new Uint8Array(atob(signedHash).split("").map(c => c.charCodeAt(0)));
    
    // Convert the original hash from hex string to ArrayBuffer
    const originalHashBuffer = hexStringToArrayBuffer(originalHash);

    // Use the SubtleCrypto API to verify the signature
    const isValid = await crypto.subtle.verify(
        {
            name: "RSASSA-PKCS1-v1_5", // RSA algorithm for signature verification
        },
        publicKey,                   // Public key to verify with
        signedHashBuffer,            // The signed hash (signature)
        originalHashBuffer           // The original hash that was signed
    );

    return isValid; // Returns true if the signature is valid, otherwise false
}

// Utility function to convert a hex string to ArrayBuffer
function hexStringToArrayBuffer(hex) {
    const length = hex.length / 2;
    const arrayBuffer = new ArrayBuffer(length);
    const uint8Array = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < length; i++) {
        uint8Array[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return arrayBuffer;
}
function hexStringToArrayBuffer(hexString) {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
      bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }
  return bytes.buffer;
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <ShieldCheckIcon className="w-16 h-16 mx-auto text-primary mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ML Model Security</h1>
          <p className="text-gray-600">Secure your machine learning models with advanced encryption</p>
        </div>

        <div className="space-y-8">
          {/* Key Generation Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <KeyIcon className="w-6 h-6 mr-2 text-primary" />
                Key Generation
              </h2>
              <button
                onClick={generateKeyPair}
                className="btn-primary flex items-center justify-center"
                disabled={publicKey || isGeneratingKeys}
              >
                {isGeneratingKeys ? (
                  <>
                    <LoadingSpinner />
                    Generating...
                  </>
                ) : (
                  'Generate Key Pair'
                )}
              </button>
            </div>

            {publicKey && (
              <div className="animate-slide-in">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public Key
                </label>
                <textarea
                  readOnly
                  value={arrayBufferToBase64(publicKey)}
                  className="textarea-custom"
                />
                <button
                  onClick={loadModel}
                  className="btn-primary mt-4 flex items-center justify-center"
                  disabled={modelLoaded || isLoadingModel}
                >
                  {isLoadingModel ? (
                    <>
                      <LoadingSpinner />
                      Loading Model...
                    </>
                  ) : (
                    'Load ML Model'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Encrypted Model Section */}
          {modelLoaded && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
                <LockClosedIcon className="w-6 h-6 mr-2 text-primary" />
                Encrypted Model Details
              </h2>

              <div className="space-y-6">
                {/* Encrypted Model Info */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Encrypted Model
                    </label>
                    <span className="text-sm text-gray-500">
                      {formatFileSize(base64ToArrayBuffer(encryptedModel).byteLength)}
                    </span>
                  </div>
                  <textarea
                    readOnly
                    value={encryptedModel}
                    className="textarea-custom"
                  />
                  <button
                    onClick={downloadEncryptedModel}
                    className="btn-secondary mt-2 text-sm"
                  >
                    <CloudArrowDownIcon className="w-4 h-4 inline mr-1" />
                    Download Encrypted Model
                  </button>
                </div>

                {/* AES Key and IV Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Encrypted AES Key
                    </label>
                    <textarea
                      readOnly
                      value={encryptedAesKey}
                      className="textarea-custom"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initialization Vector (IV)
                    </label>
                    <textarea
                      readOnly
                      value={iv}
                      className="textarea-custom"
                    />
                  </div>
                </div>

                <button
                  onClick={decryptModel}
                  className="btn-primary w-full flex items-center justify-center"
                  disabled={isDecrypting}
                >
                  {isDecrypting ? (
                    <>
                      <LoadingSpinner />
                      Decrypting...
                    </>
                  ) : (
                    'Decrypt Model'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Decrypted Model Section */}
          {decryptedModelBuffer && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
                <ShieldCheckIcon className="w-6 h-6 mr-2 text-green-600" />
                Decrypted Model Status
              </h2>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-700">
                  Model successfully decrypted! Size: {formatFileSize(decryptedModelBuffer.byteLength)}
                </p>
                <button
                  onClick={downloadDecryptedModel}
                  className="btn-primary mt-3 flex items-center justify-center"
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <LoadingSpinner />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <CloudArrowDownIcon className="w-5 h-5 inline mr-2" />
                      Download Decrypted Model
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;