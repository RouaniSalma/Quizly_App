import "./App.css";
import Login from "./enseignant/login/login";
import LoginE from "./etudiant/login/logine";
import Signup from "./enseignant/signup/signup";
import SignupE from "./etudiant/signup/signupe";
import Landingpage from "./landingPage/landingpage";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

function App() {
  const route = createBrowserRouter([
    {
      path: "/",
      element: <Landingpage />,
    },
    {
      path: "/signup",
      element: <Signup />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/signupe",
      element: <SignupE />,
    },
    {
      path: "/logine",
      element: <LoginE />,
    },
  ]);
  return (
    <div className="App">
      <RouterProvider router={route} />
    </div>
  );
}

export default App;
