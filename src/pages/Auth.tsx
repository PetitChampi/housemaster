import AuthPanel from "@/components/AuthPanel";
import "@/styles/AuthView.css";

const Auth = () => {
  return (
    <div className="auth-container">
      <img className="app-brand" src="/img/logos/logo-full.svg" alt="housemaster" />
      <AuthPanel />
    </div>
  )
}

export default Auth;