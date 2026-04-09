import React from "react";
import { Outlet } from "react-router-dom";
import Nav from "./Nav";

const HomeLayout = () => {
  return (
    <>
      <Nav />
      <Outlet />
    </>
  );
};

export default HomeLayout;
