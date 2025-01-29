import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import '../src/css/d3_landingpage.css';

const LandingPage = () => {
  const [role, setRole] = useState('');
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate(); // Hook to navigate to another page

  // Handle logout action
  const handleLogout = () => {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('role');
    localStorage.removeItem('ownerid');
    navigate('/index'); // Redirect to index page after logout
  };

  // Handle search and navigate to tenant chat page
  const handleSearch = () => {
    if (!searchText.trim()) {
      alert('Please enter a search term!');
      return;
    }

    localStorage.setItem('searchText', searchText.trim()); // Save search text to localStorage
    navigate(`/tenantchat?search=${encodeURIComponent(searchText.trim())}`); // Navigate with query parameter
  };

  // Handle voice input and set the transcript as search text
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        setSearchText(event.results[0][0].transcript); // Set transcript as search text
      };

      recognition.onerror = (event) => {
        console.error('Error occurred in speech recognition: ', event.error);
        alert('An error occurred: ' + event.error);
      };

      recognition.start(); // Start voice recognition
    } else {
      alert('Speech Recognition API is not supported in this browser.');
    }
  };

  // Update role from localStorage when component mounts
  React.useEffect(() => {
    const userRole = localStorage.getItem('role');
    setRole(userRole || 'Unauthorized Access');
  }, []);

  return (
    <div>
      <Helmet>
        <title>Home</title>
      </Helmet>
      <div className="logout-icon-container">
        <img
          src="images/logout.png"
          alt="Logout"
          onClick={handleLogout}
        />
      </div>

      <div className="D3-container">
        <img
          src="images/D3SG-logo.png"
          alt="D3 Logo"
        />
      </div>

      <div className="content-container">
        <h1>Welcome, <span className="role-text">{role}</span>!</h1>

        <form className="search-bar" id="search-form" onSubmit={(e) => e.preventDefault()}>
          <div className="search-input-container">
            <img
              src="images/d3_TenantSearchIcon.png"
              alt="Search"
              onClick={handleSearch} // Call handleSearch when clicked
              className="search-icon"
            />
            <input
              type="search"
              name="search"
              pattern=".*\S.*"
              placeholder="What can I help you with today?"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)} // Update searchText on input change
              required
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault(); // Prevent default form submission
                  handleSearch(); // Call handleSearch when "Enter" is pressed
                }
              }}
            />
          </div>

          {/* Voice Input Icon */}
          <div className="voice-icon-container" onClick={handleVoiceInput}>
            <img
              src="images/d3_voice_icon.png"
              alt="Voice Input"
              className="voice-icon"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default LandingPage;
