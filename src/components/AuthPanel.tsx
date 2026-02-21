import { useNavigate } from "react-router-dom";
import { IconKey } from "@tabler/icons-react";
import "@/styles/components/AuthPanel.css";

const AuthPanel = () => {
  const navigate = useNavigate();
  
  return (
    <div className="auth-panel">
      <div className="household-picture">
        <img src="img/household-default.jpg" alt="Household profile picture" />
      </div>
      <h2 className="household-name">The Haddons</h2>

      <div className="login-form">
        <div className="input-container">
          <label htmlFor="username">Your name</label>
          <input type="text" id="username" name="username" />
        </div>
        <div className="input-container">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" />
        </div>

        <div className="actions">
          <button className="btn crimson primary" onClick={() => alert("Login not implemented yet!")}><IconKey size={24} stroke={2} />Enter house</button>
          <p className="bottom-note">Not a member of this household?<a className="text-link" onClick={() => navigate("/")}>Enter&nbsp;as&nbsp;guest</a></p>
        </div>
      </div>
    </div>
  )
}

export default AuthPanel;