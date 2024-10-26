import { useEffect, useState } from 'react';
import {
  createKeyStoreInteractor,
  createWeb3ProviderEvmKeyStore,
  hours,
  ttlLoginRule,
} from "@chromia/ft4";
import { createClient } from "postchain-client";

const Home = () => {
  const [xposts, setXposts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [isRequestPending, setIsRequestPending] = useState(false);

  function uint8ArrayToHex(uint8Array) {
    return Array.from(uint8Array)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  // Load connection status from local storage on mount
  useEffect(() => {
    const storedPublicKey = localStorage.getItem("publicKey");
    const storedIsConnected = localStorage.getItem("isConnected") === "true";

    if (storedIsConnected && storedPublicKey) {
      setPublicKey(storedPublicKey);
      setIsConnected(true);
    }
  }, []);

  const connectWallet = async () => {
    if (isRequestPending) {
      console.log("Wallet connection request already pending.");
      return; // Prevent multiple requests
    }

    setIsRequestPending(true);

    try {
      const client = await createClient({
        nodeUrlPool: "http://localhost:7740",
        blockchainRid: "78C96404C03E6E10F6216ED8C3651475BCD12B2A806081FF924CB726B5390442",
      });

      const evmKeyStore = await createWeb3ProviderEvmKeyStore(window.ethereum);
      const evmKeyStoreInteractor = createKeyStoreInteractor(client, evmKeyStore);
      const accounts = await evmKeyStoreInteractor.getAccounts();

      if (accounts.length > 0) {
        // User is already connected
        const { session } = await evmKeyStoreInteractor.login({
          accountId: accounts[0].id,
          config: {
            rules: ttlLoginRule(hours(2)),
            flags: ["MySession"],
          },
        });
        const pubkey = uint8ArrayToHex(session.account.id);
        setPublicKey(pubkey);
        setIsConnected(true);
        localStorage.setItem("publicKey", pubkey);
        localStorage.setItem("isConnected", "true");
      } else {
        // No accounts found; prompt for permission
        const newAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (newAccounts.length > 0) {
          const { session } = await evmKeyStoreInteractor.login({
            accountId: newAccounts[0],
            config: {
              rules: ttlLoginRule(hours(2)),
              flags: ["MySession"],
            },
          });
          const pubkey = uint8ArrayToHex(session.account.id);
          setPublicKey(pubkey);
          setIsConnected(true);
          localStorage.setItem("publicKey", pubkey);
          localStorage.setItem("isConnected", "true");
        } else {
          console.error("No accounts available after requesting.");
        }
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
    } finally {
      setIsRequestPending(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>X | Twitter</h1>
      </header>

      <button 
        style={styles.button} 
        onClick={isConnected ? null : connectWallet} 
        disabled={isConnected || isRequestPending}
      >
        {isConnected ? "User Connected" : "Connect Wallet"}
      </button>

      {publicKey && <div style={styles.pubKey}>Public Key: {publicKey}</div>}

      <div>
        <h5>Create new post</h5>
        <textarea style={styles.makepost} maxLength="255"></textarea>
        <input style={styles.button} value="Submit post" type="button" />
      </div>

      {xposts.length ? (
        xposts.posts.map((post) => (
          <div key={post.id}>
            <div style={styles.username}>{post.user.name}</div>
            <div style={styles.content}>{post.content}</div>
          </div>
        ))
      ) : (
        "Loading ..."
      )}
    </div>
  );
};

const styles = {
  button: {
    backgroundColor: 'skyblue',
    color: 'white',
    padding: 10,
    borderColor: 'transparent',
    borderRadius: '3%',
  },
  makepost: {
    width: 500,
    height: 100,
  },
  pubKey: {
    marginTop: 10,
    color: 'green',
  },
  username: {
    backgroundColor: 'yellow',
    padding: '5px',
    color: 'black',
    width: '50px',
    fontWeight: 'bold',
  },
  content: {
    color: 'red',
    backgroundColor: 'black',
    textAlign: 'left',
    padding: 50,
  },
  container: {
    margin: 0,
    padding: 0,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#f0f0f0',
    padding: '20px',
    borderBottom: '1px solid #ccc',
  },
};

export default Home;
