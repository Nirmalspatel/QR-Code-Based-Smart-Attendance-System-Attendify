import { RouterProvider, createBrowserRouter, Navigate } from "react-router-dom";
import {
  TeacherDashboard,
  StudentDashboard,
  HomeLayout,
  Landing,
  Login,
  Logout,
  Register,
  NewSession,
  ForgotPassword,
  AdminDashboard,
  Profile,
  AdminLogin,
} from "./pages/Index";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeLayout />,
    children: [
      {
        index: true,
        element: <Landing />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "teacher-dashboard",
        element: <TeacherDashboard />,
      },
      {
        path: "student-dashboard",
        element: <StudentDashboard />,
      },
      {
        path: "admin-dashboard",
        element: <AdminDashboard />,
      },
      {
        path: "logout",
        element: <Logout />,
      },
      {
        path: "create-session",
        element: <NewSession />,
      },
      {
        path: "forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "admin-login",
        element: <AdminLogin />,
      },
      {
        path: "*",
        element: <h1>404 Not Found</h1>,
      },
    ],
  },
]);

function App() {
  return (
    <div>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
