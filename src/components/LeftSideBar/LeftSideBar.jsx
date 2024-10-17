import React, { useContext, useEffect, useState } from 'react';
import './LeftSideBar.css';
import assets from '../../assets/assets';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDocs, query, setDoc, where, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';

const LeftSideBar = () => {
  const navigate = useNavigate();
  const { userData, chatData, setChatUser, setMessagesId, chatVisible, setChatVisible } = useContext(AppContext);
  const [searchInput, setSearchInput] = useState("");
  const [user, setUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  const inputHandler = async (e) => {
    const input = e.target.value;
    setSearchInput(input);

    if (input) {
      setShowSearch(true);
      const userRef = collection(db, 'users');
      const q = query(userRef, where("username", "==", input.toLowerCase()));
      const querySnap = await getDocs(q);

      if (!querySnap.empty && querySnap.docs[0].data().id !== userData.id) {
        setUser(querySnap.docs[0].data());
      } else {
        setUser(null);
      }
    } else {
      setShowSearch(false);
      setUser(null);
    }
  };

  const addChat = async () => {
    const messagesRef = collection(db, "messages");
    const chatsRef = collection(db, "chats");
    
    try {
      const newMessageRef = doc(messagesRef);
      await setDoc(newMessageRef, {
        createAt: serverTimestamp(),
        messages: [],
      });

      const chatDataEntry = {
        messageId: newMessageRef.id,
        lastMessage: "",
        rId: userData.id,
        updatedAt: Date.now(),
        messageSeen: true,
      };

      await setDoc(doc(chatsRef, user.id), {
        chatsData: arrayUnion(chatDataEntry),
      });

      await setDoc(doc(chatsRef, userData.id), {
        chatsData: arrayUnion({
          ...chatDataEntry,
          rId: user.id,
        }),
      });

      setChatUser({ messageId: newMessageRef.id, userData: user });
      setMessagesId(newMessageRef.id);
      setChatVisible(true);
      setShowSearch(false);
      setSearchInput("");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className={`ls ${chatVisible ? "hidden" : ""}`}>
      <div className="ls-top">
        <div className="ls-nav">
          <img src={assets.logo} className='logo' alt="" />
          <div className="menu">
            <img src={assets.menu_icon} alt="" />
            <div className="sub-menu">
              <p onClick={() => navigate('/profile')}>Edit Profile</p>
              <hr />
              <p>Logout</p>
            </div>
          </div>
        </div>
        <div className="ls-search">
          <input
            type="text"
            placeholder='Search Here..'
            onChange={inputHandler}
            value={searchInput}
          />
          <img src={assets.search_icon} alt="" />
        </div>
      </div>
      <div className="ls-list">
        {showSearch && user ? (
          <div onClick={addChat} className="friends add-user">
            <img src={user.avatar || assets.profile_img} alt='' />
            <p>{user.username}</p>
          </div>
        ) : (
          chatData.length > 0 ? (
            chatData.map((item, index) => (
              <div key={index} onClick={() => {
                setMessagesId(item.messageId);
                setChatUser(item);
                setChatVisible(true);
              }} className={`friends ${item.messageSeen ? "" : "border"}`}>
                <img src={item.userData.avatar || assets.profile_img} alt='' />
                <div>
                  <p>{item.userData.username}</p>
                  <span>{item.lastMessage}</span>
                </div>
              </div>
            ))
          ) : (
            <p>No chats available</p>
          )
        )}
      </div>
    </div>
  );
};

export default LeftSideBar;
