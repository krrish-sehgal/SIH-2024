import React, { useEffect, useState } from "react";


function ModelService(props) {
  // State variables for managing keys, model data, and UI loading states
  const [frontendPublicKey, setFrontendPublicKey] = useState(null); // Stores the public RSA key
  const [encryptedModels, setEncryptedModels] = useState(null); // Encrypted ML model data
  const [encryptedAesKey, setEncryptedAesKey] = useState(null); // Encrypted AES key
  const [iv, setIv] = useState(null); // Initialization Vector for AES decryption
  const [modelsLoaded, setModelsLoaded] = useState(false); // Flag to indicate model is loaded
  const [decryptedModels, setDecryptedModels] = useState(null); // Buffer for decrypted model
  const [signedHash, setSignedHash] = useState(null); // State for signed hash
const [keyGenerated, setKeyGenerated] = useState(false);
const [isDecrypted, setIsDecrypted] = useState(false);
  // Loading indicators for UI feedback during asynchronous operations
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const[backendPublicKey,setBackendPublicKey] =useState(null);
  const [isVerified,setIsVerified]=useState(false);
  const encryptedModelsURL = process.env.REACT_APP_MODELSURL;
  const verificationKeyURL=process.env.REACT_APP_VERIFICATIONURL;
  console.log(encryptedModelsURL);
  

  // Function to generate RSA key pair and securely store the private key
  const generateKeyPair = async () => {
    setIsGeneratingKeys(true);
    try {
      // Step 1: Generate an ECDH key pair
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "ECDH",
          namedCurve: "P-256", // Using P-256 curve (common for ECDH)
        },
        true, // Keys can be exported (extractable)
        ["deriveKey", "deriveBits"] // Key usages
      );
  
      // Step 2: Export the private key and store it securely in IndexedDB
      const exportedPrivateKey = await window.crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey
      );
      await storeKeyInIndexedDB("privateKey", exportedPrivateKey);
  
      // Step 3: Export the public key to send it to the backend
      const exportedPublicKey = await window.crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey
      );
  
      // Convert the public key to a base64 string for easy transfer
      const publicKeyBase64 = btoa(
        String.fromCharCode(...new Uint8Array(exportedPublicKey))
      );
      console.log(publicKeyBase64);
      setFrontendPublicKey(publicKeyBase64);
      setKeyGenerated(true);
      console.log("ECDH key pair generated and private key stored securely!");
    } catch (error) {
      console.error("Error generating ECDH key pair:", error);
    } finally {
      setIsGeneratingKeys(false);
      
    }
  };
  

  // Function to fetch the encrypted model from the backend using the public key
  const loadModel = async () => {
    setIsLoadingModel(true);
    try {
      if (!frontendPublicKey) {
        throw new Error("Please generate key pair first!");
      }

      // Fetch encrypted model data from the backend
      await fetchEncryptedModel();

      setModelsLoaded(true);
    } catch (error) {
      console.error("Error loading model:", error);
    } finally {
      setIsLoadingModel(false);
      
    }
  };
  const verifyModels =async () =>{
    // Generate combined hash of all decrypted models
    try{
    const combinedHash = await generateCombinedHash(
      decryptedModels.map((model) => model.decryptedModel)
    );
    console.log("combinedhash");
    console.log(combinedHash);

    // Verify the combined signed hash
    const publicVerificationKey = await fetchPublicVerificationKey();
    console.log(publicVerificationKey);
    if (await verifySignedHash(combinedHash, signedHash, publicVerificationKey)) {
      console.log("All models verified successfully!");
      setIsVerified(true);
      
      
    } else {
      console.error("Model verification failed, aborting decryption.");
      setModelsLoaded(false);
    }}
    catch(error){
      console.error("Error Verifying models:", error);
    } 

  };

  const generateAesKey = async (frontendPrivateKey, backendPublicKeyBase64) => {
    try {
      // Step 1: Import the backend public key
      const backendPublicKeyBuffer = Uint8Array.from(
        atob(backendPublicKeyBase64),
        (c) => c.charCodeAt(0)
      );
      const backendPublicKey = await window.crypto.subtle.importKey(
        "spki",
        backendPublicKeyBuffer,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        []
      );
  
      // Step 2: Derive the shared secret
      const sharedSecret = await window.crypto.subtle.deriveBits(
        {
          name: "ECDH",
          public: backendPublicKey,
        },
        frontendPrivateKey,
        256 // Length of the output in bits
      );
  
      // Step 3: Derive the AES key from the shared secret
      const aesKey = await window.crypto.subtle.importKey(
        "raw",
        sharedSecret,
        { name: "AES-CBC" },
        false,
        ["decrypt"]
      );
  
      return aesKey;
    } catch (error) {
      console.error("Error generating AES key:", error);
      throw error;
    }
  };



  // Function to decrypt the model using the private key and AES decryption
  const decryptModels = async () => {
    setIsDecrypting(true);
    try {
      console.log("Decrypting models...");
  
      // Retrieve the private key from IndexedDB
      const frontendPrivateKey = await getKeyFromIndexedDB("privateKey");
      if (!frontendPrivateKey) {
        console.error("Frontend private key not found!");
        return;
      }
  
      // Step 2: Generate the AES key using the frontend private key and backend public key
      const aesKey = await generateAesKey(frontendPrivateKey, backendPublicKey);
  
      // Array to store decrypted models
      const decryptedModelsList = [];
  
      // Iterate through each encrypted model in the array
      for (const model of encryptedModels) {
        const { modelName, encryptedModel, version } = model;
  
        // Decrypt the model using the decrypted AES key and IV
        const decryptedBuffer = await decryptWithAes(aesKey, encryptedModel, iv);
  
        // Store the decrypted model along with its metadata
        decryptedModelsList.push({
          modelName,
          decryptedModel: decryptedBuffer,
          version,
        });
      }
      setDecryptedModels(decryptedModelsList);
      setIsDecrypted(true);
    } catch (error) {
      console.error("Error decrypting models:", error);
    } finally {
      setIsDecrypting(false);
    }
  };


  const fetchEncryptedModel = async () => {
    try {
      const response = await fetch(encryptedModelsURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicKey: frontendPublicKey, // Send the frontend's public key to the backend
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Received encrypted data lengths:", {
        models: data.encryptedModels?.length,
        keyLength: data.backendPublicKey?.length,
        ivLength: data.iv?.length
      });
  
      if (data.encryptedModels && data.encryptedAesKey && data.iv && data.signedCombinedHash) {
        // Store the backend's public key for later use in DHKE
        const backendPublicKeyBase64 = data.backendPublicKey; // Ensure the backend sends this public key
        storeBackendPublicKey(backendPublicKeyBase64); // Store the public key securely, e.g., in state
  
        // Add small delay before updating state to ensure smooth transition
        await new Promise(resolve => setTimeout(resolve, 200));
        setEncryptedModels(data.encryptedModels);
        setIv(data.iv);
        setSignedHash(data.signedCombinedHash); // Store in state instead of IndexedDB
  
      } else {
        throw new Error("Failed to fetch encrypted model: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error fetching encrypted model:", error);
      throw error; // Re-throw to be caught by loadModel
    }
  };
  
  // Function to store the backend's public key in state (or IndexedDB)
  const storeBackendPublicKey = (publicKeyBase64) => {
    // Assuming you are using state to store the backend's public key
    setBackendPublicKey(publicKeyBase64);
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
      const response = await fetch(verificationKeyURL);
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
      
      ///////////////////////////////////////////////////////////////to be changed
      return 1;
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

     

     
      console.log("Model decrypted successfully! Size:", decryptedModelBuffer.byteLength);

      // Return the buffer directly
      return decryptedModelBuffer;
    } catch (error) {
      console.error("Error decrypting model:", error);
      throw new Error("Model decryption failed.");
    }
  };
  //old down
  async function generateModelHash(inputBuffer) {
    try {
      const hashBuffer = await crypto.subtle.digest("SHA-256", inputBuffer);
      return arrayBufferToHex(hashBuffer);
    } catch (error) {
      console.error("Error generating hash:", error);
      throw new Error("Failed to generate model hash.");
    }
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
  async function generateCombinedHash(decryptedModels) {
    try {
      console.log(decryptedModels);
        // Concatenate all decrypted model buffers into a single buffer
        const concatenatedBuffer = new Uint8Array(
            decryptedModels.reduce((acc, buffer) => acc + buffer.byteLength, 0)
        );

        let offset = 0;
        for (const buffer of decryptedModels) {
            concatenatedBuffer.set(new Uint8Array(buffer), offset);
            offset += buffer.byteLength;
        }

        // Generate a hash of the concatenated buffer
        const hashBuffer = await crypto.subtle.digest("SHA-256", concatenatedBuffer.buffer);

        // Return the combined hash in a readable hex format
        return arrayBufferToHex(hashBuffer);
    } catch (error) {
        console.error("Error generating combined hash:", error);
        throw new Error("Failed to generate combined model hash.");
    }
}

// Convert ArrayBuffer to Hexadecimal string
function arrayBufferToHex(buffer) {
    const byteArray = new Uint8Array(buffer);
    return Array.from(byteArray).map(byte => byte.toString(16).padStart(2, "0")).join("");
}
  
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
                
                props.setKeyGenerated(keyGenerated) ;
                props.setIsLoaded(modelsLoaded);
                props.setIsDecrypted(isDecrypted);
                
                console.log(keyGenerated,modelsLoaded,isDecrypted,decryptedModels,props.reVerify);
                if(!keyGenerated){
                generateKeyPair();}
                if(keyGenerated&&!modelsLoaded){loadModel(); }
                if(props.reVerify){setIsVerified(false);

                }
                if(modelsLoaded&&!isDecrypted){decryptModels()};
                if(isDecrypted&&!isVerified){
                  verifyModels();
                }
                if(isDecrypted&&isVerified){(
                  props.setDecryptedModels(decryptedModels));
                  if (props.reVerify) {
                    props.setReVerify(false); // Assuming setReVerify is passed as a prop
                }
                }},[keyGenerated, modelsLoaded, isDecrypted,isVerified,props.reVerify]);
}

export default ModelService;