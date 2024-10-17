import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { createContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { updateDoc } from "firebase/firestore";

export const AppContext = createContext();

const AppContextProvider = (props) => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [chatData, setChatData] = useState([]);
    const [messagesId, setMessagesId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatUser, setChatUser] = useState(null);
    const [chatVisible, setChatVisible] = useState(false);

    // Function to load the current user's data
    const loadUserData = async (uid) => {
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data();
            setUserData(userData);
            if (userData.avatar && userData.name) {
                navigate('/chat');
            } else {
                navigate('/profile');
            }
            await updateDoc(userRef, {
                lastSeen: Date.now()
            });

            setInterval(async () => {
                if (auth.currentUser) {
                    await updateDoc(userRef, {
                        lastSeen: Date.now()
                    });
                }
            }, 60000); // Updated interval to 60 seconds
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    };

    // Fetch the chat list when the userData is set
    useEffect(() => {
        if (userData) {
            const chatRef = doc(db, 'chats', userData.id);
            const unSub = onSnapshot(chatRef, async (res) => {
                const chatItems = res.data().chatsData;
                const tempData = [];
                for (const item of chatItems) {
                    const userRef = doc(db, 'users', item.rId);
                    const userSnap = await getDoc(userRef);
                    const userData = userSnap.data();
                    tempData.push({ ...item, userData });
                }
                setChatData(tempData.sort((a, b) => b.updatedAt - a.updatedAt));
            });
            return () => {
                unSub();
            };
        }
    }, [userData]);

    // Function to initiate chat with a specific user and load previous messages
    const initiateChat = async (selectedChatUser) => {
        setChatUser(selectedChatUser);
        const messageId = selectedChatUser.messageId; // Assuming messageId is available in chatUser data
        setMessagesId(messageId);

        if (messageId) {
            const messagesRef = doc(db, 'messages', messageId);
            const unSub = onSnapshot(messagesRef, (res) => {
                setMessages(res.data().messages.reverse());
            });
            return () => {
                unSub();
            };
        }
    };

    // Exposing values through the context provider
    const value = {
        userData, setUserData,
        chatData, setChatData,
        loadUserData,
        messages, setMessages,
        messagesId, setMessagesId,
        chatUser, setChatUser,
        chatVisible, setChatVisible,
        initiateChat
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;
