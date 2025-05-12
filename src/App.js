import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const CONTRACT_ADDRESS = "0xc3610cC4F6E3f16ba8EcB9C6007c00Deed3B912b";
const ABI = [
  "function postMessage(string calldata _content) external",
  "function getMessages() external view returns (tuple(address sender, string content, uint256 timestamp)[])",
  "event NewMessage(address indexed sender, string content, uint256 timestamp)"
];

function App() {
  const [account, setAccount] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [status, setStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightedTimestamp, setHighlightedTimestamp] = useState(null);

  const messagesPerPage = 5;
  const totalPages = Math.ceil(messages.length / messagesPerPage);
  const startIndex = (currentPage - 1) * messagesPerPage;
  const endIndex = currentPage * messagesPerPage;

  const placeholders = [
    "Got any thoughts brewing or tea you're making today? Let us know!..",
    "Spill your TEA 🍵✨",
    "What’s steeping in your mind today?",
    "Drop your hot take or warm thoughts here!",
    "Share your TEA vibes with the community!"
  ];
  const randomPlaceholder = placeholders[Math.floor(Math.random() * placeholders.length)];

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Never Share Your Personal information Here");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
    } catch (err) {
      setStatus("❌ Failed to connect wallet");
    }
  };
useEffect(() => {
  toast.info("Welcome to TEA BAG!");
}, []);

  const fetchMessages = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const msgs = await contract.getMessages();
      setMessages([...msgs].reverse());
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to fetch messages");
    }
  };

  const postMessage = async () => {
    if (!newMessage.trim()) return;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    try {
      const tx = await contract.postMessage(newMessage);
      setStatus("⏳ Sending Message...");
      await tx.wait();
      setNewMessage("");
      setStatus("✅ Message Sent!");
      toast.success("🌱 Your TEA has been planted!");
      await fetchMessages();
      setCurrentPage(1);
      setHighlightedTimestamp(Math.floor(Date.now() / 1000));
      setTimeout(() => setHighlightedTimestamp(null), 4000);
    } catch (err) {
      console.error(err);
      setStatus("❌ Something went wrong");
      toast.error("Failed to send message.");
    }
  };

  useEffect(() => {
    connectWallet();
  }, []);

  useEffect(() => {
    if (account) fetchMessages();
  }, [account]);

  return (
    <div className="app-container">
      <ToastContainer position="top-center" />

      <h1 className="title">
        <img
          src="https://sepolia.tea.xyz/assets/configs/network_logo.svg"
          alt="TEA Logo"
          style={{ width: "800px", height: "200px", marginRight: "10px" }}
        />
        TEA BAG
      </h1>

      {account ? (
        <>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={randomPlaceholder}
            maxLength={280}
          />
          <button onClick={postMessage}>Send Message</button>
          <p>{status}</p>
        </>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}

      <hr />
      <h2>🍃 New Messages</h2>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.4 }}
        >
          {messages.slice(startIndex, endIndex).map((msg, i) => (
            <motion.div
              key={i}
              className={`message-card ${msg.timestamp === highlightedTimestamp ? "highlight" : ""}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <p>{msg.content}</p>
              <small>👤 {msg.sender}</small><br />
              <small>🕒 {new Date(msg.timestamp * 1000).toLocaleString()}</small>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="pagination">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          ← Newer
        </button>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage >= totalPages}
        >
          Older →
        </button>
      </div>
    </div>
  );
}

export default App;
