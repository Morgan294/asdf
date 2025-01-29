import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import './src/css/main.css';
import './src/css/util.css';
import './src/js/main.js';

const Index = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'd3callagent' && password === 'd3callagent') {
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('role', 'Call Agent');
      localStorage.setItem('ownerid', 'a6c30958-fa63-ee11-8df0-6045bd1eb957');
      navigate('/landingpage');
    } else if (email === 'd3supervisor' && password === 'd3supervisor') {
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('role', 'Supervisor');
      localStorage.setItem('ownerid', 'f6ef7a96-3102-ee11-8f6e-6045bd1d8b49');
      navigate('/landingpage');
    } else if (email === 'd3smeuser' && password === 'd3smeuser') {
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('role', 'SME User');
      localStorage.setItem('ownerid', 'e4ce7055-7a06-ee11-8f6e-6045bd1eb957');
      navigate('/landingpage');
    } else {
      alert('Invalid username or password.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  return (
    <div style={{ background: '#212529' }}>
      <Helmet>
        <title>Login</title>
      </Helmet>
      <div className="limiter">
        <img src="images/D3SG-logo.png" className="img-fluid" alt="D3 Logo" />
        <div className="container-login100">
          <div className="wrap-login100">
            <form className="login100-form validate-form" onSubmit={handleLogin}>
              <span className="login100-form-title p-b-26">Welcome</span>

              <div className="wrap-input100 validate-input" data-validate="Valid email is: a@b.c">
                <input
                  className={`input100 ${email.length < 1 ? "" : "has-val"}`}
                  type="text"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <span className="focus-input100" data-placeholder="Email"></span>
              </div>

              <div className="wrap-input100 validate-input" data-validate="Enter password">
                <div className="password-container">
                  <input
                    className={`input100 ${password.length < 1 ? "" : "has-val"}`}
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span className="focus-input100" data-placeholder="Password"></span>
                  <span className="btn-show-pass" onClick={togglePasswordVisibility}>
                    <i className={`zmdi ${showPassword ? 'zmdi-eye-off' : 'zmdi-eye'}`}></i>
                  </span>
                </div>
              </div>

              <div className="container-login100-form-btn">
                <div className="login100-form-bgbtn"></div>
                <button className="login100-form-btn" id='loginButton' type="submit">
                  Login
                </button>
                
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
