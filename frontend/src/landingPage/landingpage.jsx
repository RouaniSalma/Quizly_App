import { Link } from "react-router-dom";
import "./landingpage.css"; 

const Landingpage = () => {
  return (
    <div className="home-container">
      <h2>Welcome!</h2>
      <p>Choose your profile :</p>
      <div className="buttons">
        <Link to="/signup" className="btn">I'm a teacher</Link>
        <Link to="/signupe" className="btn">I'm a student</Link>
      </div>
    </div>
  );
};

export default Landingpage;
