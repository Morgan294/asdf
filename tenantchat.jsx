import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import '../src/css/d3_tenantchatstyle.css';
import { Helmet } from 'react-helmet';
import {Chart} from 'chart.js'

const TenantChat = () => {

  const [searchText] = useState(localStorage.getItem("searchText"));
  const [userMessage, setUserMessage] = useState("");
  const [isLoggedIn] = useState(localStorage.getItem("loggedIn") === "true");
  const navigate = useNavigate();

  useEffect(() => {

    const logoutButton = document.getElementById("logoutButton");
    const sendButton = document.getElementById("send-button");
    const userInput = document.getElementById("user-input");

    // Check if logoutButton exists before adding the event listener
    if (logoutButton) {
      const handleLogout = () => {
        localStorage.removeItem("loggedIn");
        localStorage.removeItem("role");
        navigate('/index');
      };

      logoutButton.addEventListener("click", handleLogout);

      // Cleanup event listener on component unmount
      return () => {
        logoutButton.removeEventListener("click", handleLogout);
      };
    }

    // Check if sendButton exists before adding the event listener
    if (sendButton) {
      sendButton.addEventListener("click", sendMessage);
    }
    // Check if userInput exists before adding the keypress event listener
    if (userInput) {
      userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
    }
    // Voice recognition setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserMessage(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Error occurred in speech recognition: " + event.error);
        alert("Speech recognition error: " + event.error);
      };

      const voiceInputBtn = document.getElementById("voice-input-btn");
      voiceInputBtn.addEventListener("click", () => {
        recognition.start();
      });
    } else {
      alert("Speech Recognition API is not supported in this browser.");
    }

    // Cleanup on component unmount
    return () => {
      logoutButton.removeEventListener("click", handleLogout);
    };
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (searchText) {
      const searchDisplay = document.getElementById("search-display");
      searchDisplay.textContent = searchText;
      chatResponse(searchText);
    }
  }, [searchText]);


  //Chat Response
  const chatResponse = async (userMessage) => {
    const API_URL =
      "https://python-api.politewater-9cd83a3d.southeastasia.azurecontainerapps.io/api";
    console.log("User message:", userMessage);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          queries: [userMessage],
        }),
      });

      const data = await response.json();
      console.log("Response Data:", data);
      console.log("Raw response data:", JSON.stringify(data));

      let textResponse = "";

      if (data?.outputs?.action) {
        const actionType = data.outputs.action;
        const entity = data.outputs.entity;

        if (actionType === "list") {
          if (Array.isArray(data?.outputs?.data)) {
            if (data.outputs.data.length === 0) {
              displayChatbotMessage("There is no record to display");
            } else {
              // Render cases table when "list all cases" is requested
              if (userMessage.toLowerCase().includes('list all cases')) {
                const caseDetails = renderCasesRecord(data.outputs.data);
                displayChatbotMessage("", '', caseDetails);
              }
              // Render tenant table when "list all tenants" is requested
              else if (userMessage.toLowerCase().includes('list all tenants')) {
                const tenantDetails = renderTenantRecord(data.outputs.data);
                displayChatbotMessage("", tenantDetails);
              }
            }
          } else {
            textResponse = data?.outputs?.data?.message || "Invalid response data";
            displayChatbotMessage(textResponse);
          }
        } else if (actionType === "show_details" && entity === "case") {
          if (Array.isArray(data?.outputs?.data)) {
            const caseDetailsFormatted = renderCaseDetailsFormatted(data.outputs.data);
            // Pass JSX directly, not as a string
            displayChatbotMessage("", "", "", caseDetailsFormatted);
          }
        } else if (actionType === "show" && entity === "tenant") {
          if (Array.isArray(data?.outputs?.data)) {
            const tenantDetails = renderTenantRecord(data.outputs.data);
            displayChatbotMessage(tenantDetails);
          }
        }
      } else {
        textResponse = data?.outputs || "Unexpected response structure.";
        displayChatbotMessage(textResponse);
      }
    } catch (error) {
      console.error("Error:", error);
      displayChatbotMessage("An error occurred while processing your request.");
    }
  };

  // Case Details
const renderCaseDetailsFormatted = (caseData) => {
  if (!Array.isArray(caseData) || caseData.length === 0) {
    return '<div class="case-detail"><p>No case details available.</p></div>';
  }

  return caseData.map((textResponseItem, index) => {
    const caseNumber = textResponseItem?.cr425_casenumber || 'N/A';
    const caseSubject = textResponseItem?.cr425_subject || 'N/A';
    const caseSummary = textResponseItem?.cr425_casesummary || 'N/A';
    const casePriority = getCasePriorityLabel(textResponseItem?.cr425_priority) || 'N/A';
    const caseCategory = getCaseCategoryLabel(textResponseItem?.cr425_category) || 'N/A';
    const caseStatus = getCaseStatusLabel(textResponseItem?.cr425_casestatus) || 'N/A';

    return `
      <div key="${index}" class="case-detail">
        <p><strong>Case Number:</strong> ${caseNumber}</p>
        <p><strong>Case Subject:</strong> ${caseSubject}</p>
        <p><strong>Case Summary:</strong> ${caseSummary}</p>
        <p><strong>Case Priority:</strong> ${casePriority}</p>
        <p><strong>Case Category:</strong> ${caseCategory}</p>
        <p><strong>Case Status:</strong> ${caseStatus}</p>
      </div>
    `;
  }).join(''); // Combine the array into a single string
};


  //Case Records
  const renderCasesRecord = (casesData) => {
    return casesData
      .map((item) => {
        const caseNumber = item?.cr425_casenumber || "N/A";
        const caseSubject = item?.cr425_subject || "N/A";
        const casePriority = getCasePriorityLabel(item?.cr425_priority) || "N/A";
        return `
          <tr>
            <td>${caseNumber}</td>
            <td>${caseSubject}</td>
            <td>${casePriority}</td>
          </tr>
        `;
      })
      .join("");
  };


  //Tenant Record
  const renderTenantRecord = (tenantData) => {
    return tenantData
      .map((item) => {
        const tenantName = item?.d3_name || "N/A";
        const tenantAddress = item?.d3_addressline1 || "N/A";
        const rentAmount = item?.d3_rentamount || "N/A";
        const startDate = item?.["d3_startdate@OData.Community.Display.V1.FormattedValue"] || "N/A";

        return `
          <tr>
            <td>${tenantName}</td>
            <td>${tenantAddress}</td>
            <td>${startDate}</td>
            <td>${rentAmount}</td>
          </tr>
        `;
      })
      .join("");
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

      // Generate the chatbot's response
      chatResponse(userMessage);

      // Clear the input field
      inputElement.value = "";
    }
  };

  //DisplayUserMessage
  const displayUserMessage = (message) => {
    const chatMessagesContainer = document.querySelector('.chat-messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message-right', 'pb-4');

    messageElement.innerHTML = `
            <div>
              <img src="https://bootdey.com/img/Content/avatar/avatar1.png" class="rounded-circle mr-1" alt="User Avatar" width="40" height="40">
              <div class="text-muted small text-nowrap mt-2"></div>
            </div>
            <div class="flex-shrink-1 bg-light rounded py-2 px-3 mr-3">
              <p>${message}</p>
            </div>
          `;

    chatMessagesContainer.appendChild(messageElement);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  };

  window.addEventListener('load', async () => {
    try {
      const clearStateURL =
        'https://python-api.politewater-9cd83a3d.southeastasia.azurecontainerapps.io/clear';
      await fetch(clearStateURL, { method: 'POST' });
      console.log('Conversation state cleared on page load.');
    } catch (error) {
      console.error('Failed to clear state:', error);
    }
  });

  const displayChatbotMessage = (message, tenantDetails = '', caseDetails = '', caseDetailsFormatted = '') => {
    const chatMessagesContainer = document.querySelector('.chat-messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message-left', 'pb-4');
  
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
      <div>
        <img src="images/d3_robotchat.png" class="rounded-circle mr-1" width="100" height="60">
        <div class="text-muted small text-nowrap mt-2"></div>
      </div>
      <div class="flex-shrink-1 bg-light rounded py-2 px-3 ml-3">
        <div class="font-weight-bold mb-1">Chatbot</div>
        ${content}
      </div>
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
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)',
              'rgba(0, 0, 0, 0.2)',
            ],
            borderColor: [
              'rgba(255, 26, 104, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(0, 0, 0, 1)',
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
    <main className="content">

      <Helmet>
        <title>My Chat</title>
      </Helmet>

      <meta charSet="UTF-8" />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@4.5.0/dist/css/bootstrap.min.css"
      />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
      />
      <div className="container p-0">

        <h1 className="h6 mt-3 mb-3 d-flex justify-content-between align-items-center" >
          <Link to="/landingpage" style={{ fontSize: "15px", color: 'white'}}>
            <i className="fa fa-home mr-2"></i> Home
          </Link>
          <a
            id="logoutButton"
            title="Logout"
            style={{ cursor: "pointer" }}
          >
            <img src="images/tenantlogout.png" alt="logout" />
          </a>
        </h1>

        <div className="card">
          <div className="row g-0">
            <div className="col-12 col-lg-12 col-xl-12">
              <div className="position-relative">
                <div className="chat-messages p-4">
                  {/* User Message */}
                  <div className="chat-message-right pb-4">
                    <div>
                      <img
                        src="https://bootdey.com/img/Content/avatar/avatar1.png"
                        className="rounded-circle mr-1"
                        alt="User Avatar"
                        width="40"
                        height="40"
                      />
                      <div className="text-muted small text-nowrap mt-2"></div>
                    </div>
                    <div className="flex-shrink-1 bg-light rounded py-2 px-3 mr-3">
                      <div className="font-weight-bold mb-1 username-display"></div>
                      <p id="search-display"></p>
                    </div>
                  </div>

                </div>


              </div>
              <div className="flex-grow-0 py-3 px-4 border-top">
                <div className="input-group">
                  <input
                    type="text"
                    id="user-input"
                    className="form-control"
                    placeholder="Type your message"
                  />
                  <img
                    src="images/d3_voice_icon.png"
                    alt="Voice Input"
                    id="voice-input-btn"
                    style={{
                      cursor: "pointer",
                      width: "38px",
                      height: "40px",
                      marginLeft: "10px",
                      marginRight: "10px",
                      borderRadius: "10px"
                    }}
                  />
                  <button id="send-button" type='button' onClick={sendMessage}>
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );

};

export default TenantChat;