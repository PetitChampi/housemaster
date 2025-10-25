import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const navigate = useNavigate();
  const authContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#333'
  }
  const authPanelStyle = {
    padding: '40px',
    background: 'rgba(0,0,0,0.5)',
    borderRadius: '16px',
    textAlign: 'center'
  }
  const buttonStyle = {
    display: 'block',
    width: '200px',
    padding: '10px',
    margin: '10px 0',
    cursor: 'pointer'
  }
  
  return (
    <div style={authContainerStyle}>
      <div style={authPanelStyle}>
        <h2>Welcome</h2>
        <button style={buttonStyle} onClick={() => navigate('/')}>Continue as Guest</button>
        <button style={buttonStyle} onClick={() => alert('Login not implemented yet!')}>Login</button>
      </div>
    </div>
  )
}

export default Auth;