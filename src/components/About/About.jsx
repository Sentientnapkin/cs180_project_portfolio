import React from "react";
import { about } from "../../data/portfolio";
import "./About.css";
const About = () => {
  const { title, description } = about;
  return (
    <section className="about" id="about">
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
};

export default About;
