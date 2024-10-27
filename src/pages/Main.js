// Main.js
import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import {
  createKeyStoreInteractor,
  createWeb3ProviderEvmKeyStore,
  hours,
  ttlLoginRule,
} from "@chromia/ft4";
import { createClient } from "postchain-client";
import { useSession } from './SessionContext';
import ViewUser from './ViewUser';

const Main = () => {
  const { session, setSession, publicKey, setPublicKey, isConnected, setIsConnected, xposts, setXposts, tweetContent, setTweetContent,myId, setMyId} = useSession();
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUsername, setSelectedUsername]= useState(null)
  const [isRequestPending, setIsRequestPending] = useState(false);

 

  useEffect(() => {
    if (isConnected && publicKey) {
      const initSession = async () => {
        const client = await createClient({
          nodeUrlPool: "http://localhost:7740",
          blockchainRid: "78C96404C03E6E10F6216ED8C3651475BCD12B2A806081FF924CB726B5390442",
        });

        try {
          const posts = await client.query("get_all_posts", {});
          setXposts(posts);
        } catch (error) {
          console.error("Query error:", error);
        }
      };

      initSession().catch(console.error);
    }
  }, [isConnected, publicKey, tweetContent]);

  const handleUserClick = (userId, username) => {
    alert(userId);
    setSelectedUserId(userId); 
    setSelectedUsername(username)
    
    // Set the selected user ID
  };

  
  const connectWallet = async () => {
    if (isRequestPending) return;
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
        const { session } = await evmKeyStoreInteractor.login({
          accountId: accounts[0].id,
          config: {
            rules: ttlLoginRule(hours(2)),
            flags: ["MySession"],
          },
        });
        const pubkey = uint8ArrayToHex(session.account.id);
        setSession(session);
        setPublicKey(pubkey);
        if (pubkey){

          setMyId(pubkey)
        }
        setIsConnected(true);
      } else {
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
          setSession(session);
          if (pubkey){

            setMyId(pubkey)
          }
          setPublicKey(pubkey);
          setIsConnected(true);
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

  const postTweet = async (e) => {
    e.preventDefault();
    if (tweetContent.length > 0) {
      await session.call({
        name: "make_post",
        args: [tweetContent],
      });
      setTweetContent("");
      alert("Tweet submitted successfully!");
    } else {
      alert("Tweet can't be empty");
    }
  };

  if (selectedUserId) {
    return <ViewUser userId={selectedUserId}  username={selectedUsername}  session={session} publickey={myId} />; // Render ViewUser if a user is selected
  }

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
        <form onSubmit={postTweet}>
          <textarea
            style={styles.makepost}
            maxLength="255"
            value={tweetContent}
            onChange={(e) => setTweetContent(e.target.value)}
          />
          <input style={styles.buttonPost} value="Submit post" type="submit" />
        </form>
      </div>

      {xposts ? (
        xposts.posts.map((post) => (
          <div key={post.id}>
            <div 
                style={styles.username}
                onClick={() => handleUserClick(post.user.id, post.user.name)} 
            >{post.user.name}</div>
            <div style={styles.content}>{post.content}</div>
          </div>
        ))
      ) : (
        "Loading ..."
      )}
    </div>
  );
};

const uint8ArrayToHex = (uint8Array) => {
  return Array.from(uint8Array)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};



const styles = {
  buttonPost: {
    backgroundColor: 'black',
    color: 'white',
    padding: 5,
    fontWeight: 'bold',
  },
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
    borderColor: 'black',
  },
  pubKey: {
    marginTop: 10,
    color: 'green',
  },
  username: {
    backgroundColor: 'yellow',
    padding: '5px',
    color: 'black',
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

export default Main;
