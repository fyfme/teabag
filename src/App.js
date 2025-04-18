import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';

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
      alert("Welcome To TeaBag!");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
    } catch (err) {
      setStatus("❌ Gagal koneksi wallet");
    }
  };

  const fetchMessages = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const msgs = await contract.getMessages();
      setMessages([...msgs].reverse());
    } catch (err) {
      console.error(err);
      setStatus("❌ Gagal mengambil pesan");
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
      setStatus("✅ Success!");
      fetchMessages();
    } catch (err) {
      console.error(err);
      setStatus("❌ Something Went Wrong");
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
      {messages.map((msg, i) => (
        <div key={i} className="message-card">
          <p>{msg.content}</p>
          <small>👤 {msg.sender}</small><br />
          <small>🕒 {new Date(msg.timestamp * 1000).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}

export default App;
