import { useEffect, useState } from 'react';
import { createClient } from "postchain-client";

const Home = () => {
  const [xposts, setXposts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null); // To store logged-in user info
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      console.log("Initializing Session");
      const client = await createClient({
        nodeUrlPool: "http://localhost:7740",
        blockchainRid: "78C96404C03E6E10F6216ED8C3651475BCD12B2A806081FF924CB726B5390442",
      });

      try {
        const posts = await client.query("get_all_posts", { "pointer": 1 });
        if (isMounted) {
          setXposts(posts);
          console.log(posts);
        }
      } catch (error) {
        if (isMounted) {
          setError("Failed to fetch posts");
          console.error("Query error:", error);
        }
      }
    };

    initSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePostSubmit = () => {
    console.log("Submitting post:", newPostContent);
    setNewPostContent('');
  };

  const generateRandomUsername = () => {
    const randomSuffix = Math.floor(Math.random() * 10000);
    return `User${randomSuffix}`;
  };

  const createUserInBackend = async (name, pubkey) => {
    const client = await createClient({
      nodeUrlPool: "http://localhost:7740",
      blockchainRid: "78C96404C03E6E10F6216ED8C3651475BCD12B2A806081FF924CB726B5390442",
    });

    try {
      await client.query("create_user", { name, pubkey });
      console.log("User created:", name, pubkey);
    } catch (error) {
      console.error("Error creating user:", error);
      setError("Failed to create user");
    }
  };

  const getUserNameFromBackend = async (pubkey) => {
    const client = await createClient({
      nodeUrlPool: "http://localhost:7740",
      blockchainRid: "78C96404C03E6E10F6216ED8C3651475BCD12B2A806081FF924CB726B5390442",
    });

    try {
      const userName = await client.query("get_user_name", { user_id: pubkey });
      return userName;
    } catch (error) {
      console.error("Error retrieving username:", error);
      setError("Failed to retrieve username");
      return null;
    }
  };

  const setupAuthAndLoginUser = async () => {
    if (window.ethereum) {
      try {
        setLoading(true);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

        if (accounts.length > 0) {
          const userAddress = accounts[0];
          console.log(user)
          const existingUsername = await getUserNameFromBackend(userAddress); // Check for existing user

          if (existingUsername) {
            setUser({ id: userAddress, name: existingUsername }); // Set existing user
          } else {
            const username = generateRandomUsername(); // Generate random username
            await createUserInBackend(username, userAddress); // Create user in backend
            setUser({ id: userAddress, name: username }); // Set new user
          }

          console.log("Logged in as:", userAddress);
        } else {
          console.log("No accounts found");
        }
      } catch (error) {
        console.error("Error during authentication:", error);
        setError("Failed to connect wallet");
      } finally {
        setLoading(false);
      }
    } else {
      console.error("MetaMask is not installed");
      setError("Please install MetaMask to use this feature.");
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>X | Twitter</h1>
      </header>

      {user ? (
        <div style={styles.userInfo}>
          Logged in as: {user.name} (Address: {user.id}) {/* Display user info */}
        </div>
      ) : (
        <button style={styles.buttonmt} onClick={setupAuthAndLoginUser} disabled={loading}>
          {loading ? "Connecting..." : "Connect Wallet"}
        </button>
      )}

      <div>
        <h5>Create new post</h5>
        <textarea
          style={styles.makepost}
          maxLength="255"
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
        />
        <input
          style={styles.button}
          value="Submit post"
          type="button"
          onClick={handlePostSubmit}
        />
      </div>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      {xposts.posts ? (
        xposts.posts.map((post) => (
          <div key={post.id}>
            <div style={styles.username}>{post.user.name}</div>
            <div style={styles.content}>{post.content}</div>
          </div>
        ))
      ) : (
        "Loading posts..."
      )}
    </div>
  );
};

const styles = {
  buttonmt:{
    backgroundColor: 'orange',
    color: 'white',
    padding: 10,
    borderColor: 'transparent',
    borderRadius: '3%',
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
  userInfo: {
    margin: '10px 0',
    fontSize: '16px',
    fontWeight: 'bold',
  },
};

export default Home;
