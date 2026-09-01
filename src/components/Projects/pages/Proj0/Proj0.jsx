import { useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import "./Proj0.css";

const ImagePlaceholder = ({ label, src, contain }) => {
  const [loaded, setLoaded] = useState(true);

  if (src && loaded) {
    return (
      <img
        className={contain ? "proj0-image proj0-image--contain" : "proj0-image"}
        src={src}
        alt={label}
        onError={() => setLoaded(false)}
      />
    );
  }

  return (
    <div className="image-placeholder">
      <span>{label}</span>
    </div>
  );
};

const Proj0 = () => {
  return (
    <article className="proj0">
      <Link to="/" className="back-link">
        <FaArrowLeft /> Back to projects
      </Link>

      <header className="proj0-header">
        <p className="proj0-eyebrow">CS 180 &middot; Project 0</p>
        <h1>Becoming Friends with Your Camera</h1>
        <p className="proj0-subtitle">
          The goal of this project is to get some intuitive understanding of the somewhat subtle relationship between perspective, focal length/zoom, and the center of projection.
        </p>
      </header>

      <section className="proj0-section">
        <h2>Part 1 &middot; Selfie: The Wrong Way vs. The Right Way</h2>
        <div className="image-row">
          <ImagePlaceholder
            label="Close-up selfie (distorted)"
            src={`${import.meta.env.BASE_URL}proj0/selfie-close.JPG`}
            contain
          />
          <ImagePlaceholder
            label="Stepped-back + zoomed selfie"
            src={`${import.meta.env.BASE_URL}proj0/selfie-far.JPG`}
            contain
          />
        </div>
        <p className="proj0-caption">
          Credit to my roommate Daniel, who is pictured above. When we're looking up close at something our eyes distort it, but when we step back we can see it more clearly. This is whats happening with the camera as well.
        </p>
      </section>

      <section className="proj0-section">
        <h2>Part 2 &middot; Architectural Perspective Compression</h2>
        <div className="image-row">
          <ImagePlaceholder
            label="Zoomed in from a distance"
            src={`${import.meta.env.BASE_URL}proj0/building-zoomed.jpg`}
          />
          <ImagePlaceholder
            label="Walked up, no zoom"
            src={`${import.meta.env.BASE_URL}proj0/building-walked-up.jpg`}
          />
        </div>
        <p className="proj0-caption">
          The zoomed in shot compresses the depth in the image, whereas the shot from closer shows more of the depth.
        </p>
      </section>

      <section className="proj0-section">
        <h2>Part 3 &middot; The Dolly Zoom</h2>
        <p>
          By moving the camera backwards while zooming in to keep the stuffed animals in the same position, I created a dolly zoom!
        </p>
        <div className="image-row">
          <ImagePlaceholder
            label="Dolly zoom GIF"
            src={`${import.meta.env.BASE_URL}proj0/dolly-zoom.GIF`}
            contain
          />
        </div>
      </section>

      <footer className="proj0-footer">
        <Link to="/" className="back-link">
          <FaArrowLeft /> Back to projects
        </Link>
      </footer>
    </article>
  );
};

export default Proj0;
