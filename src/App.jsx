import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import About from "./components/About/About";
import Navbar from "./components/Navbar/Navbar";
import Projects from "./components/Projects/Projects";
import Proj0 from "./components/Projects/pages/Proj0/Proj0";
import "./App.css";
const App = () => {
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    if (theme === "light") {
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };

  useEffect(() => {
    const currentTheme = localStorage.getItem("theme");
    if (currentTheme) {
      setTheme(currentTheme);
    }
  }, []);

  return (
    <div className="app" id={`${theme}`}>
      <main>
        <Navbar toggleTheme={toggleTheme} theme={theme} />
        <Routes>
          <Route
            path="/"
            element={
              <>
                <About />
                <Projects />
              </>
            }
          />
          <Route path="/projects/proj0" element={<Proj0 />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
