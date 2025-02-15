import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../src/css/d3_tenantchatstyle.css";
import ReactDOM from "react-dom/client";
import { Helmet } from "react-helmet";
import { Chart } from "chart.js/auto";
import { jwtDecode } from "jwt-decode";
import { useCookies } from "react-cookie";
import axios from "axios";

const TenantChat = () => {
  const [cookies, removeCookie] = useCookies(["token", "role", "searchText"]);
  const [userMessage, setUserMessage] = useState();
  const [showChat, setShowChat] = useState(window.innerWidth > 768);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText] = useState(cookies.searchText);
  const navigate = useNavigate();

  useEffect(() => {
    const tkn = cookies.token;

    if (tkn) {
      getChatHistory(tkn);
      console.log(tkn);
    } else {
      console.error("No token found, redirecting to login...");
      window.location.href = "/index";
    }
  }, []);

  const fetchMessages = async (token) => {
    try {
      const response = await fetch("https://python-api.politewater-9cd83a3d.southeastasia.azurecontainerapps.io/api", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          queries: [userMessage],
        }),
      });

      setMessages(response.data.messages);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      setLoading(false);
    }
  };

  const handleToggleChat = () => {
    setShowChat((prev) => !prev);
  };

  const handleSessionClick = (sessionId) => {};

  const getChatHistory = async (token) => {
    const URL = "https://python-api.politewater-9cd83a3d.southeastasia.azurecontainerapps.io/chat/sessions";
    try {
      const response = await fetch(URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      console.log(data);
      setChatHistory(
        data.sessions.sort((a, b) => {
          return Date.parse(a.timestamp) - Date.parse(b.timestamp);
        })
      );
      setLoading(false);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      setLoading(false);
    }
  };

  const updateChat = async (sessionid) => {
    const URL = "https://python-api.politewater-9cd83a3d.southeastasia.azurecontainerapps.io/chat/session/" + sessionid;
    try {
      const response = await fetch(URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${cookies.token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      console.log(data);

      document.getElementsByClassName("chat-messages").textContent = [];

      data.chat_history.map((item) => {
        displayUserMessage(item["user_query"]);
        displayChatbotMessage(item["bot_response"]);
        console.log("json");
        // console.log(JSON.parse(item['bot_response'].replaceAll('\'','\"').replaceAll('/','\\')))

        //item['bot_response']
        // const actionType = data.outputs.action;
        // const entity = data.outputs.entity;

        // if (actionType === "list") {

        //   if (userMessage.toLowerCase().includes('list all cases')) {
        //     const caseDetails = renderCasesRecord(data.outputs.data);
        //     displayChatbotMessage("", '', caseDetails);
        //   }

        //   else if (userMessage.toLowerCase().includes('list all tenants')) {
        //     const tenantDetails = renderTenantRecord(data.outputs.data);
        //     displayChatbotMessage("", tenantDetails);
        //   }
        // }

        // else if (actionType === "show_details" && entity === "case") {
        //   if (Array.isArray(data?.outputs?.data)) {
        //     const caseDetailsFormatted = renderCaseDetailsFormatted(data.outputs.data);

        //     displayChatbotMessage("", "", "", caseDetailsFormatted);
        //   }
        // }

        // else if (actionType === "show" && entity === "tenant") {
        //   if (Array.isArray(data?.outputs?.data)) {
        //     const tenantDetails = renderTenantRecord(data.outputs.data);
        //     displayChatbotMessage(tenantDetails);
        //   }
        // }
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const logoutButton = document.getElementById("logoutButton");
    const sendButton = document.getElementById("send-button");
    const userInput = document.getElementById("user-input");

    const handleLogout = () => {
      removeCookie("role");
      navigate("/index");
    };

    if (logoutButton) {
      logoutButton.addEventListener("click", handleLogout);
    }

    if (sendButton) {
      sendButton.addEventListener("click", sendMessage);
    }

    if (userInput) {
      userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          sendMessage();
        }
      });
    }

    return () => {
      logoutButton.removeEventListener("click", handleLogout);
      sendButton.removeEventListener("click", sendMessage);
    };
  }, []);

  const handleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserMessage(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error: " + event.error);
        alert("Speech recognition error: " + event.error);
      };

      recognition.start();
    } else {
      alert("Speech Recognition API is not supported in this browser.");
    }
  };

  useEffect(() => {
    if (searchText) {
      const searchDisplay = document.getElementById("search-display");
      if (searchDisplay) {
        searchDisplay.textContent = searchText;
      }
      chatResponse(searchText);
    }
  }, [searchText]);

  //Chat Response
  const chatResponse = async (userMessage) => {
    const API_URL = "https://python-api.politewater-9cd83a3d.southeastasia.azurecontainerapps.io/api";
    console.log("User message:", userMessage);

    const token = cookies?.token;
    if (!token) {
      console.error("❌ No authentication token found.");
      displayChatbotMessage("Authentication error. Please log in again.");
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ queries: [userMessage] }),
      });

      // ✅ Ensure response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("❌ API response is not JSON. Received:", contentType);
        displayChatbotMessage("Invalid response format. Expected JSON.");
        return;
      }

      const data = await response.json();
      console.log("📌 Parsed API Response:", data);

      if (!data || !data.outputs) {
        console.error("❌ Invalid API response structure.");
        displayChatbotMessage("Unexpected response from the server.");
        return;
      }

      let textResponse = "";
      if (data.outputs.action === "list") {
        const records = data.outputs.data?.value;
        if (Array.isArray(records) && records.length > 0) {
          const caseDetails = renderCasesRecord(records);
          displayChatbotMessage(caseDetails);
        } else {
          displayChatbotMessage("No cases found.");
        }
      } else {
        textResponse = data.outputs || "Unexpected response structure.";
        displayChatbotMessage(textResponse);
      }
    } catch (error) {
      console.error("❌ API Request Failed:", error);
      displayChatbotMessage("An error occurred while processing your request.");
    }
  };

  //Case Records
  const renderCasesRecord = (casesData) => {
    if (!Array.isArray(casesData) || casesData.length === 0) {
      return "<p>No cases available.</p>";
    }

    const caseRows = casesData
      .map((item) => {
        const caseNumber = item?.cr425_casenumber || "N/A";
        const caseSubject = item?.cr425_subject || "N/A";
        const casePriority =
          getCasePriorityLabel(item?.cr425_priority) || "N/A";
        const caseStatus = 
          getCaseStatusLabel(item?.cr425_casestatus) || "N/A";

        return `
          <tr>
            <td>${caseNumber}</td>
            <td>${caseSubject}</td>
            <td><span class="priority-${casePriority.toLowerCase()}">${casePriority}</span></td>
            <td>${caseStatus}</td>
          </tr>
        `;
      })
      .join("");

    return `
      <table class="table-cases">
        <thead>
          <tr>
            <th>Case Number</th>
            <th>Subject</th>
            <th>Priority</th>
            <th>Case Status</th>
          </tr>
        </thead>
        <tbody>
          ${caseRows}
        </tbody>
      </table>
    `;
  };

  //Tenant Record
  const renderTenantRecord = (tenantData) => {
    return tenantData.map((item) => {
      const tenantName = item?.d3_name || "N/A";
      const tenantAddress = item?.d3_addressline1 || "N/A";
      const rentAmount = item?.d3_rentamount || "N/A";
      const startDate =
        item?.["d3_startdate@OData.Community.Display.V1.FormattedValue"] ||
        "N/A";

      return `
          <tr>
            <td>${tenantName}</td>
            <td>${tenantAddress}</td>
            <td>${startDate}</td>
            <td>${rentAmount}</td>
          </tr>
        `;
    });
  };

  //Priority
  const getCasePriorityLabel = (priorityValue) => {
    const priorityMap = {
      1: "High",
      2: "Normal",
      3: "Low",
    };

    return priorityMap[priorityValue] || "Unknown";
  };

  const getCaseCategoryLabel = (priorityValue) => {
    const priorityMap = {
      0: "Performance Issue",
      1: "Internet Speed Issue",
      2: "Installation Issue",
      3: "Feature Request",
    };

    return priorityMap[priorityValue] || "Unknown";
  };

  const getCaseStatusLabel = (priorityValue) => {
    const priorityMap = {
      0: "New",
      1: "Open",
      2: "Closed",
      3: "Reopened",
      4: "Routed",
      5: "Submit for Approval",
      6: "Approved",
    };

    return priorityMap[priorityValue] || "Unknown";
  };

  const sendMessage = () => {
    const inputElement = document.getElementById("user-input");
    const userMessage = inputElement.value.trim();

    if (userMessage) {
      displayUserMessage(userMessage);
      chatResponse(userMessage);
      inputElement.value = "";
    }
  };

  //DisplayUserMessage
  const displayUserMessage = (message) => {
    const chatMessagesContainer = document.querySelector(".chat-messages");
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message");
    messageElement.innerHTML = `
            <div class="chat-message">
              <div class="chat-message">
                <figure class="chat-avatar">
                  <img
                    src="images/d3_userchat.png"
                    alt="User Avatar"
                  />
                </figure>
                <div class="chat-bubble">
                  <div class="username-display"></div>
                  <p>${message}</p>
                </div>
              </div>
            </div>
          `;

    chatMessagesContainer.appendChild(messageElement);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  };

  window.addEventListener("load", async () => {
    try {
      const clearStateURL = "https://python-api.politewater-9cd83a3d.southeastasia.azurecontainerapps.io/clear";
      await fetch(clearStateURL, { method: "POST" });
      console.log("Conversation state cleared on page load.");
    } catch (error) {
      console.error("Failed to clear state:", error);
    }
  });

  const displayChatbotMessage = (message, tenantDetails = '', caseDetails = '', caseDetailsFormatted = '') => {
    const chatMessagesContainer = document.querySelector('.chat-messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message-left', 'bot-message');
  
    let content = '';
    console.log('Case Details Formatted:', caseDetailsFormatted);
  
    // Render the tenant table if tenantDetails is provided
    if (tenantDetails) {
      content = `
        <table class="table table-striped-tenant">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Start Date</th>
              <th>Rent Amount</th>
            </tr>
          </thead>
          <tbody>
            ${tenantDetails}
          </tbody>
        </table>
      `;
    }
    // Render the case table if caseDetails is provided
    else if (caseDetails) {
      content = `
        <table class="table table-striped-cases">
          <thead>
            <tr>
              <th>Case Number</th>
              <th>Case Subject</th>
              <th>Case Priority</th>
            </tr>
          </thead>
          <tbody>
            ${caseDetails}
          </tbody>
        </table>
      `;
    }
    // Render formatted case details if provided
    else if (caseDetailsFormatted) {
      // Ensure we're passing a string, not an object
      if (typeof caseDetailsFormatted === 'object') {
        content = `<p>${JSON.stringify(caseDetailsFormatted)}</p>`;  // Ensure it is rendered as a string
      } else {
        content = `<p>${caseDetailsFormatted}</p>`;  // Render the case details formatted string
      }
    }
    // Render summary and chart if priority_count exists
    else if (message['summary'] && message['priority_count']) {
      const summary = message['summary'];
      const prioritycount = message['priority_count'];
  
      console.log('Summary', summary);
      console.log('Priority Count', prioritycount);
  
      const formattedMessage = summary.replace(/\n/g, '<br>');
      content = `<p>${formattedMessage}</p>`;
  
      content += `
        <div class="chartBox">
          <canvas id="myChart"></canvas>
        </div>
      `;
    }
    // Default case if no other conditions are met
    else {
      const plainMessage = message || 'No additional information available.';
      content = `<p>${plainMessage}</p>`;
    }
  
    messageElement.innerHTML = `
        <div class="chat-bubble">${content}</div>
        <figure class="chatbot-avatar">
            <img src="images/d3_robotchat.png" alt="Chatbot Avatar">
        </figure>
    `;

    chatMessagesContainer.appendChild(messageElement);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

    // Render the chart if priority_count is available
    if (message['priority_count']) {
      const prioritycount = message['priority_count'];
      const labels = Object.keys(prioritycount);
      const dataValues = Object.values(prioritycount);

      const data = {
        labels: labels,
        datasets: [
          {
            label: 'Priority',
            data: dataValues,
            backgroundColor: [
              'rgba(255, 26, 104, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              // 'rgba(75, 192, 192, 0.2)',
              // 'rgba(153, 102, 255, 0.2)',
              // 'rgba(255, 159, 64, 0.2)',
              // 'rgba(0, 0, 0, 0.2)',
            ],
            borderColor: [
              'rgba(255, 26, 104, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              // 'rgba(75, 192, 192, 1)',
              // 'rgba(153, 102, 255, 1)',
              // 'rgba(255, 159, 64, 1)',
              // 'rgba(0, 0, 0, 1)',
            ],
            borderWidth: 1,
          },
        ],
      };

      const config = {
        type: 'pie',
        data: data,
      };

      const ctx = document.getElementById('myChart');
      if (ctx) {
        new Chart(ctx, config);
      }
    }
  };

  return (
    <main className="chat-main">
      <Helmet>
        <title>My Chat</title>
      </Helmet>

      <meta charSet="UTF-8" />

      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
      />

      <nav className={`chat-sidebar ${showChat ? "" : "hidden"}`}>
        <div className="chatList">
          <button onClick={() => navigate("/landingpage")}>
            Create a new Chat
          </button>
          <span className="title">RECENT CHATS</span>
          {chatHistory?.map((item, index) => {
            return (
              <div key={index}>
                <button
                  className="list"
                  id={"Chat" + index}
                  onClick={() => updateChat(item["session_id"])}
                >
                  Last User Query: {item["last_user_query"]}
                </button>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="chat-wrapper">
        <header className="chat-header">
          <div className="chat-header-left">
            <button
              title="Menu"
              className="menu-toggle"
              onClick={handleToggleChat}
              aria-label="Toggle chat menu"
            >
              <i className="fa fa-bars"></i>
            </button>
            <Link to="/landingpage" className="home-link">
              <i className="fa fa-home"></i> Home
            </Link>
          </div>
          <button
            id="logoutButton"
            className="logout-btn"
            title="Logout"
            aria-label="Logout"
          >
            <img src="images/tenantlogout.png" alt="Logout" />
          </button>
        </header>

        <section className={`chat-container ${showChat ? "shrink" : ""}`}>
          <div className="chat-card">
            <div className="chat-messages">
              <div className="chat-message">
                <figure className="chat-avatar">
                  <img src="images/d3_userchat.png" alt="User Avatar" />
                </figure>
                <div className="chat-bubble">
                  <div className="username-display"></div>
                  <p>
                    {searchText
                      ? searchText
                      : "No messages available for this session."}
                  </p>
                </div>
              </div>
            </div>

            <footer className="chat-input-box">
              <div className="input-group">
                <input
                  id="user-input"
                  type="text"
                  className="chat-input"
                  placeholder="Type your message"
                  onChange={(e) => setUserMessage(e.target.value)}
                />
                <div className="voice-icon-wrapper">
                  <i
                    className="fa-solid fa-microphone"
                    id="voice-input-btn"
                    alt="Voice Input"
                    onClick={handleVoiceInput}
                  ></i>
                </div>
                <button id="send-button" className="send-button" type="button">
                  Send
                </button>
              </div>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
};

export default TenantChat;
