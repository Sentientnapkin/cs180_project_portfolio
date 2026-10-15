import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import sections from "./proj3-content.json";
import "./Proj.css";
import "./Proj2.css";
import "./Proj3.css";

const asset = (filename) => `${import.meta.env.BASE_URL}proj3/${filename}`;

const WritingPlaceholder = () => (
  <div className="writing-placeholder proj2-writing-placeholder">
    <strong>[Your writing here]</strong>
  </div>
);

const TrainingSettings = ({ settings }) => (
  <aside className="proj3-training-settings" aria-label="Training settings">
    <h3>Training settings</h3>
    <dl className="proj3-training-grid">
      {settings.map(({ label, value }) => (
        <div className="proj3-training-item" key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  </aside>
);

export default function Proj3() {
  return (
    <article className="proj proj3">
      <Link to="/" className="back-link"><FaArrowLeft /> Back to projects</Link>
      <header className="proj-header">
        <p className="proj-eyebrow">CS 180 · Project 3</p>
        <h1>Fun with Flow Models</h1>
        <p>This project will cover using flow models to create cool images (Part A) and how to create flow models by hand (Part B)!</p>
      </header>
      <nav className="proj2-toc" aria-label="Project 3 sections">
        {sections.map(({id, title}) => <a key={id} href={`#${id}`}>{title}</a>)}
      </nav>
      {sections.map((section, index) => (
        <section className="proj-section" id={section.id} key={section.id}>
          {(index === 0 || section.id === "b-1-1") && <p className="proj-eyebrow">Part {section.id[0].toUpperCase()}</p>}
          <h2>{section.title}</h2>
          {section.writing ? <p className="proj3-writing">{section.writing}</p> : <WritingPlaceholder />}
          {section.trainingSettings?.length > 0 && <TrainingSettings settings={section.trainingSettings} />}
          {section.equations.map(eq => <div className="proj-equation" key={eq}>{eq}</div>)}
          {section.references?.length > 0 && <div className={`proj3-reference-grid ${section.id === "a-3-3" ? "proj3-reference-grid--paired" : ""}`}>
            {section.references.map(figure => <figure className="result proj3-reference" key={`${figure.src}-${figure.rotated ? "rotated" : "normal"}`}>
              <a href={asset(figure.src)} target="_blank" rel="noreferrer" aria-label={figure.label}>
                <img className={`proj-image proj-image--contain ${figure.rotated ? "proj3-rotate180" : ""}`} src={asset(figure.src)} alt={figure.label} loading="eager" />
              </a>
              {figure.distant && <img className="proj3-distant" src={asset(figure.src)} alt={`${figure.label} · distant view`} width="64" height="64" />}
              <figcaption>
                <strong>{figure.label}</strong>
                <a className="proj3-reference-source" href={figure.source} target="_blank" rel="noreferrer">CS 180 assignment</a>
              </figcaption>
            </figure>)}
          </div>}
          <div className={`proj3-figures ${section.id === "a-3-4" ? "proj3-hybrids" : ""}`}>
            {section.figures.map(figure => <figure className="result proj3-card" key={figure.src}>
              <a href={asset(figure.src)} target="_blank" rel="noreferrer" aria-label={figure.label}>
                <img className="proj-image proj-image--contain" src={asset(figure.src)} alt={figure.label} loading="eager" />
              </a>
              <figcaption><strong>{figure.label}</strong></figcaption>
              {section.id === "a-3-4" && <img className="proj3-distant" src={asset(figure.src)} alt={`${figure.label} · distant view`} width="64" height="64" />}
            </figure>)}
            {section.missing.map(label => <figure className="result" key={label}>
              <div className="image-placeholder proj2-placeholder"><strong>[Image placeholder]</strong><span>{label}</span></div>
            </figure>)}
          </div>
        </section>
      ))}
    </article>
  );
}
