import GameCanvas from "@/game/GameCanvas";

// Persistent backdrop behind every tool window
// the 3D house lives here and stays mounted as tools come and go
const HouseBackdrop = () => {
  return (
    <div className="house-backdrop">
      <GameCanvas />
    </div>
  );
};

export default HouseBackdrop;
