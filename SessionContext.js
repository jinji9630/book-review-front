// SessionContext.js
import React, { createContext, useContext, useState } from 'react';
import Cookies from 'js-cookie';

const SessionContext = createContext();

export const useSession = () => {
  return useContext(SessionContext);
};

export const SessionProvider = ({ children }) => {
  const [session, setSession] = useState(() => {
    const storedSession = Cookies.get('session');
    return storedSession ? JSON.parse(storedSession) : null;
  });

  const [publicKey, setPublicKey] = useState(() => {
    return Cookies.get('publicKey') || null;
  });

  const [isConnected, setIsConnected] = useState(!!session);
  const [xposts, setXposts] = useState(null);
  const [tweetContent, setTweetContent] = useState("");

  return (
    <SessionContext.Provider value={{ session, setSession, publicKey, setPublicKey, isConnected, setIsConnected, xposts, setXposts, tweetContent, setTweetContent }}>
      {children}
    </SessionContext.Provider>
  );
};
