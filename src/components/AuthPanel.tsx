import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import { IconKey } from "@tabler/icons-react";
import { authenticate, guest } from "@/lib/auth";
import { household } from "@/data/household";
import { useAuthStore } from "@/store/authStore";
import "@/styles/components/AuthPanel.css";

const AuthPanel = () => {
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: SyntheticEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    const user = await authenticate(name, password);
    setBusy(false);

    if (!user) {
      setError("That name and password don't match anyone here.");
      return;
    }

    signIn(user);
    navigate("/");
  };

  const enterAsGuest = () => {
    signIn(guest);
    navigate("/");
  };

  return (
    <div className="auth-panel">
      <div className="household-picture">
        <img src={household.pictureUrl} alt="Household profile picture" />
      </div>
      <h2 className="household-name">{household.name}</h2>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="input-container">
          <label htmlFor="username">Your name</label>
          <input
            type="text"
            id="username"
            name="username"
            autoComplete="username"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="input-container">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="actions">
          <button type="submit" className="btn crimson primary" disabled={busy}>
            <IconKey size={24} stroke={2} />
            {busy ? "Checking…" : "Enter house"}
          </button>
          <p className="bottom-note">
            Not a member of this household?
            <button type="button" className="text-link" onClick={enterAsGuest}>
              Enter&nbsp;as&nbsp;guest
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default AuthPanel;
