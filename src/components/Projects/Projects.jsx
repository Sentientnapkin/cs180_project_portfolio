import React from "react";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import "./Projects.css";
import { projects } from "../../data/portfolio";
const Projects = () => {
  const { title, course_projects } = projects;
  return (
    <section className="projects" id="projects">
      <h1>{title}</h1>
      <div className="container-grid">
        {course_projects.map((project, index) => (
          <Link
            to={project.slug ? `/projects/${project.slug}` : "#"}
            className="project-card"
            key={index}
          >
            <h3 className="project-title">{project.title}</h3>
            <p className="project-description">{project.description}</p>
            <span className="project-enter">
              View project <FaArrowRight />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default Projects;
