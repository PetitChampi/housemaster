// import houseImage from '../assets/dummy-house.png'; // Make sure to have an image here

const Dashboard = () => {
  const style = {
    width: '100%',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundImage: `url(${houseImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: 'white',
    fontSize: '2rem'
  };

  return (
    <div style={style}>
      <h1>Welcome Home</h1>
      {/* 3D House will be rendered here */}
    </div>
  );
};
export default Dashboard;