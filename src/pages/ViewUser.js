import React, { useEffect, useState } from 'react';
import { createClient } from "postchain-client";

const ViewUser = ({ userId, username, session, publickey}) => {
  const [followers, setFollowers] = useState(50); // Initial followers count
  const [following, setFollowing] = useState(100);
  const [isFollowing, setIsFollowing] = useState(false); // Track follow status
  const [xposts, setXposts] = useState(null);
  const [StatChange, setStatChange] = useState(false);
  const [myId, setMyId] =useState(null)
 
  useEffect(() => {
    
    const fetchPosts = async () => {
      const client = await createClient({
        nodeUrlPool: "http://localhost:7740",
        blockchainRid: "78C96404C03E6E10F6216ED8C3651475BCD12B2A806081FF924CB726B5390442",
      });

      try {
        const posts = await client.query("get_post", { 'isbn': userId });
        setXposts(posts);
      } catch (error) {
        console.error("Query error:", error);
      }

      try {
        const followers = await client.query("get_followers_count", { 'user_id': userId });
        setFollowers(followers);
      } catch (error) {
        console.error("Query error:", error);
      }

      try {
        const following = await client.query("get_following_count", { 'user_id': userId });
        setFollowing(following);
      } catch (error) {
        console.error("Query error:", error);
      }


      try {
        const isFollowing = await client.query("is_following", { 'my_id': userId, 'your_id':publickey });
        setIsFollowing(isFollowing);
        console.log(isFollowing)
      } catch (error) {
        console.error("Query error:", error);
      }


    };

    fetchPosts();
  }, [userId,StatChange]);

  const toggleFollow = () => {
    setIsFollowing(prev => !prev);
    setFollowers(prev => isFollowing ? prev - 1 : prev + 1);
  };

  return (
    <div style={styles.container}>
      <div>
        <h1>User Details</h1>
        <p>User ID: {userId}</p>
        <h2>Profile: {username}</h2>
        
        {/* Follow/Unfollow Button */}
        <button style={styles.button} onClick={toggleFollow}>
          {isFollowing ? 'Unfollow' : 'Follow'}
        </button>

        {/* Profile Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={styles.box}>
            <div style={styles.bigNumber}>{followers}</div>
            <div style={styles.smallText}>Followers</div>
          </div>
          <div style={styles.box}>
            <div style={styles.bigNumber}>100</div>
            <div style={styles.smallText}>Following</div>
          </div>
        </div>

        {/* User Posts */}
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
    </div>
  );
};

 
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'start',
    height: '100vh',
    textAlign: 'center',
    backgroundColor: '#f0f0f0',
  },
  box: {
    backgroundColor: 'red',
    color: 'white',
    padding: '20px',
    margin: '0 20px',
    borderRadius: '10px',
    width: '150px', // Adjust width as needed
  },
  bigNumber: {
    fontSize: '48px',
  },
  smallText: {
    fontSize: '14px',
    color: 'black',
  },
  button: {
    backgroundColor: 'blue',
    color: 'white',
    padding: '15px 30px',
    fontSize: '20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  content: {
    color: 'red',
    backgroundColor: 'black',
    textAlign: 'left',
    padding: 50,
  },
  username: {
    backgroundColor: 'green',
    padding: '5px',
    color: 'black',
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#f0f0f0',
    padding: '20px',
    borderBottom: '1px solid #ccc',
  },
};



export default ViewUser;
