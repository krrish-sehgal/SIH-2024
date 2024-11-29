import React, { useEffect, useState ,useRef } from "react";


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
const [forceUpdate, setForceUpdate] = useState(false);
  // Loading indicators for UI feedback during asynchronous operations
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const[backendPublicKey,setBackendPublicKey] =useState(null);
  const [isVerified,setIsVerified]=useState(false);
  const [foundModel,setFoundModel]=useState(false);
  const modelStatus=useRef(1);
  const hasInitialized = useRef(false);
  const encryptedModelsURL = process.env.REACT_APP_MODELSURL;
  const verificationURL=process.env.REACT_APP_VERIFICATIONURL;
  const versionsURL=process.env.REACT_APP_VERSIONSURL;
  const [versionsVerfied,setVersionsVerified]=useState(false);
  console.log(encryptedModelsURL);
  

  // Function to generate RSA key pair and securely store the private key
  const generateKeyPair = async () => {
    setIsGeneratingKeys(true);
    try {
        // Step 1: Generate an ECDH key pair
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "ECDH",
                namedCurve: "P-256", // Use P-256 curve for ECDH
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
            "raw", // Export the raw public key for ECDH
            keyPair.publicKey
        );

        // Convert the public key to a base64 string for easy transfer
        const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedPublicKey)));
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

const verifyModels = async () => {
  try {
    const combinedHash = await generateCombinedHash(
      decryptedModels.map((model) => model.decryptedModel)
    );
    
    if (await verifySignedHash(combinedHash, signedHash)) {
      console.log("All models verified successfully!");
      setIsVerified(true);
      props.setIsVerified(true);
      props.setIsVerifying(false); // Ensure loading is removed
      props.setReVerify(false);
      setIsVerified(false);
    } else {
      modelStatus.current = 0;
      console.log("Model verification failed, aborting decryption.");
      props.setIsVerifying(false); // Also remove loading on failure
      props.setIsVerified(false);
      props.setReVerify(false);
      setModelsLoaded(false);
    }
  } catch(error) {
    console.log("Error Verifying models:", error);
    modelStatus.current = 0;
    props.setIsVerifying(false); // Remove loading on error
  }
};


  const generateAesKey = async (frontendPrivateKey, backendPublicKeyBase64) => {
    try {
      // Step 1: Convert the backend public key from base64 to a raw format
      const backendPublicKeyBuffer = Uint8Array.from(
        atob(backendPublicKeyBase64),
        (c) => c.charCodeAt(0)
      );
  
      // Step 2: Import the backend public key for ECDH key exchange
      const backendPublicKey = await window.crypto.subtle.importKey(
        "raw", // Import the public key as raw bytes for ECDH
        backendPublicKeyBuffer,
        { name: "ECDH", namedCurve: "P-256" }, // Specify the curve used
        false, // The key is not extractable
        [] // No specific usages, just for ECDH
      );
  
      // Step 3: Derive the shared secret using the frontend private key and the backend public key
      const sharedSecret = await window.crypto.subtle.deriveBits(
        {
          name: "ECDH",
          public: backendPublicKey,
        },
        frontendPrivateKey, // Use the frontend private key
        256 // Length of the output in bits (to match AES key size)
      );
  
      // Step 4: Export the shared secret as raw data
      const sharedSecretArrayBuffer = sharedSecret;
  
      // Hash the shared secret like the backend does
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', sharedSecretArrayBuffer);
      
      // Use the hashed value as AES key
      const aesKey = await window.crypto.subtle.importKey(
        "raw",
        hashBuffer,
        { name: "AES-CBC" },
        true,
        ["encrypt", "decrypt"]
      );
  
      console.log("AES key generated successfully!");
  
      // Step 6: Export the AES key to verify its raw content
      const exportedKey = await window.crypto.subtle.exportKey("raw", aesKey);
  
      // Convert the AES key to a hexadecimal string for logging
      const aesKeyHex = Array.from(new Uint8Array(exportedKey))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
      console.log("AES Key in Hex:", aesKeyHex);
  
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
      console.log(frontendPrivateKey);
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
      storeDecryptedModels(decryptedModelsList)
  .then(() => console.log("Models successfully stored in IndexedDB."))
  .catch((err) => console.error("Error storing models:", err));

      
      setDecryptedModels(decryptedModelsList);
      setIsDecrypted(true);
    } catch (error) {
      console.error("Error decrypting models:", error);
    } finally {
      setIsDecrypting(false);
    }
  };
  
  const checkModelsInLocalStorage = () => {
    const storedModels = localStorage.getItem("decryptedModels");
    return storedModels ? JSON.parse(storedModels) : null;
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
  
      if (data.encryptedModels && data.backendPublicKey && data.iv && data.signedCombinedHash) {
        // Store the backend's public key for later use in DHKE
        const backendPublicKeyBase64 = data.backendPublicKey; // Ensure the backend sends this public key
        storeSignedHash(data.signedCombinedHash);
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
                    try {
                        // Import the private key for ECDH
                        const privateKey = await window.crypto.subtle.importKey(
                            "pkcs8",
                            keyData,
                            { name: "ECDH", namedCurve: "P-256" },
                            true,
                            ["deriveKey", "deriveBits"]
                        );
                        resolve(privateKey);
                    } catch (error) {
                        reject(`Failed to import private key: ${error}`);
                    }
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

  const storeSignedHash = async (signedHash) => {
    const db = await initializeModelDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("signedHash", "readwrite");
      const store = transaction.objectStore("signedHash");
  
      store.put({ id: "signedHash", data: signedHash }); 
  
      transaction.oncomplete = () => {
        console.log("Signed Hash stored successfully.");
        resolve();
      };
  
      transaction.onerror = (event) => {
        console.error("Error storing Signed Hash:", event.target.error);
        reject(event.target.error);
      };
    });
  };

// Function to fetch signedCache from IndexedDB
const fetchSignedHash = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DecryptedModelsDB', 2);

    request.onsuccess = (event) => {
      const db = event.target.result;
      // Check if the object store exists
      if (!db.objectStoreNames.contains('signedHash')) {
        console.warn('signedHash object store does not exist.');
        resolve(null);
        return;
      }

      const transaction = db.transaction(['signedHash'], 'readonly');
      const store = transaction.objectStore('signedHash');
      const getRequest = store.get('signedHash');

      getRequest.onsuccess = (event) => {
        const result = event.target.result;
        resolve(result ? result.data : null);
      };

      getRequest.onerror = (event) => {
        reject('Error fetching signed hash:', event.target.error);
      };
    };

    request.onerror = (event) => {
      reject('Error opening IndexedDB:', event.target.error);
    };
  });
};
  
  const initializeModelDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("DecryptedModelsDB", 2);
  
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("decryptedModels")) {
          db.createObjectStore("decryptedModels", { keyPath: "id" });
          
        }
        if (!db.objectStoreNames.contains("signedHash")) {
          db.createObjectStore("signedHash", { keyPath: "id" });
        }
      };
  
      request.onsuccess = () => {
        resolve(request.result);
      };
  
      request.onerror = (event) => {
        console.error("Error initializing IndexedDB:", event.target.error);
        reject(event.target.error);
      };
    });
  };
  const storeDecryptedModels = async (models) => {
    const db = await initializeModelDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("decryptedModels", "readwrite");
      const store = transaction.objectStore("decryptedModels");
  
      store.put({ id: "allModels", data: models }); // Save models under "allModels"
  
      transaction.oncomplete = () => {
        console.log("Decrypted models stored successfully.");
        resolve();
      };
  
      transaction.onerror = (event) => {
        console.error("Error storing decrypted models:", event.target.error);
        reject(event.target.error);
      };
    });
  };
  const getDecryptedModels = async () => {
    const db = await initializeModelDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("decryptedModels", "readonly");
      const store = transaction.objectStore("decryptedModels");
  
      const request = store.get("allModels");
  
      request.onsuccess = (event) => {
        if (request.result) {
          console.log("Decrypted models retrieved successfully.");
          resolve(request.result.data); // Return the stored models
        } else {
          console.warn("No decrypted models found in IndexedDB.");
          resolve(null);
        }
      };
  
      request.onerror = (event) => {
        console.error("Error retrieving decrypted models:", event.target.error);
        reject(event.target.error);
      };
    });
  };
      
  async function verifySignedHash(originalHash, signedHash) {
    try {

      const modelVersions = decryptedModels.reduce((acc, model) => {
        acc[model.modelName] = model.version;
        return acc;
      }, {});
  
      const response = await fetch(verificationURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          combinedHash: originalHash,
          digitalSignature: signedHash,
          livenessStatus: true,
          versions: modelVersions // Add model versions to request body
        }),
      });
      
  
      const data = await response.json();
  
      if (response.status === 200) {
        console.log('Model verified and authenticated:', data.message);
        return true;
      } else if (response.status === 400) {
        console.error('Combined hash and digital signature are required:', data.message);
      } else if (response.status === 401) {
        console.error('Invalid digital signature. Verification failed:', data.message);
      } else if (response.status === 500) {
        console.error('Error verifying model:', data.message);
      } else {
        console.error('Unexpected response:', data.message);
      }
  
      return false;
    } catch (error) {
      console.error('Error verifying hash:', error);
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
 
  const initializeModels = async () => {
    const storedModels = await getDecryptedModels();
    const storedSignedHash = await fetchSignedHash();
    if (storedModels&&storedSignedHash) {
      console.log("Using cached models from indexedDB");
      setDecryptedModels(storedModels);
      setSignedHash(storedSignedHash);
      return 1;
    } else {
      console.log("Models not found in indexedDB, fetching...");
      return 0;
     // Fetch and decrypt logic
    }
  };
  const verifyVersions = async () => {
    try {
      const response = await fetch(versionsURL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const { versions: expectedVersions } = await response.json();
      
      // Check if all current model versions match expected versions
      const versionsMatch = decryptedModels.every(model => 
        expectedVersions[model.modelName] === model.version
      );
  
      if (!versionsMatch) {
        console.log("Model versions verification failed");
        modelStatus.current = 0;
        if(modelsLoaded) {
          setModelsLoaded(false);
        } else {
          setForceUpdate((prev) => !prev);
        }
        return false;
      }
      
      console.log("All model versions verified successfully!");
      setVersionsVerified(true);

    } catch (error) {
      console.error("Error verifying versions:", error);
      modelStatus.current = 0;

    }
  };
  
  useEffect(() => {
     // Tracks if `initializeModels` has been run
  
    const init = async () => {
      if (!hasInitialized.current) {
        hasInitialized.current = true; // Set to true to prevent re-execution
        modelStatus.current = await initializeModels();
         // Wait for initializeModels to complete
         if(modelStatus.current===0){
          setForceUpdate((prev) => !prev);
        }
        return;
      }
      
        if (modelStatus.current === 1&&!versionsVerfied) {
          verifyVersions();
         
        } else if (modelStatus.current === 0) {
          
          
          // Models need fetching or decryption
          if (!keyGenerated) {
            generateKeyPair();
          } else if (keyGenerated && !modelsLoaded) {
            loadModel();
          } else if (modelsLoaded && !isDecrypted) {
            decryptModels();
            return;
          } 
        }
        if (props.reVerify&&!isVerified) {
          verifyModels();
        }
        else if (isDecrypted||versionsVerfied) {
          props.setDecryptedModels(decryptedModels);
          props.setModelReady(true);
        }
        else if(isVerified){
          props.setIsVerified(true);
          props.setReVerify(false);
          props.setIsVerifying(false);
          setIsVerified(false);
        }
        
      
    };
  
    init(); // Call the async initializer function
  }, [
    keyGenerated,
    forceUpdate,
    modelsLoaded,
    isDecrypted,
    isVerified,
    props.reVerify,
    decryptedModels,
    versionsVerfied
  ]);
  
}

export default ModelService;