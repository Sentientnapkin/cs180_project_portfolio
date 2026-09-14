import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import images from "../../../../data/proj1Results.json";
import "./Proj.css";

const Shift = ({ label, value }) => (
  <span>
    {label}: ({value[0]}, {value[1]})
  </span>
);

const Result = ({ title, result }) => (
  <figure className="result">
    <img
      className="proj-image proj-image--contain"
      src={`${import.meta.env.BASE_URL}${result.image}`}
      alt={`${title} colorized with ${result.metricLabel}`}
      loading="lazy"
    />
    <figcaption>
      <strong>{result.metricLabel}</strong>
      <span className="shift-list">
        <Shift label="Green" value={result.green} />
        <Shift label="Red" value={result.red} />
      </span>
    </figcaption>
  </figure>
);

const ImageComparison = ({ image, mode }) => {
  const results = image[mode];
  return (
    <section className="comparison" aria-labelledby={`${mode}-${image.slug}`}>
      <h3 id={`${mode}-${image.slug}`}>{image.title}</h3>
      <div className="image-row">
        <Result
          title={image.title}
          result={{ ...results.l2, metricLabel: "L2-Norm" }}
        />
        <Result
          title={image.title}
          result={{ ...results.ncc, metricLabel: "NCC" }}
        />
      </div>
      {image.note && <p className="result-note">{image.note}</p>}
    </section>
  );
};

const Gallery = ({ images, mode }) => (
  <div className="results-gallery">
    {images.map((image) => (
      <ImageComparison key={`${mode}-${image.slug}`} image={image} mode={mode} />
    ))}
  </div>
);

const Proj1 = () => {
  const singleScaleImages = images.filter((image) => image.single);
  const providedImages = images.filter((image) => !image.custom);
  const customImages = images.filter((image) => image.custom);
  const emirImage = images.find((image) => image.slug === "emir");

  return (
    <article className="proj">
      <Link to="/" className="back-link">
        <FaArrowLeft /> Back to projects
      </Link>

      <header className="proj-header">
        <p className="proj-eyebrow">CS 180 &middot; Project 1</p>
        <h1>Images of the Russian Empire</h1>
        <p className="proj-subtitle">
          The goal of this assignment is to take the digitized Prokudin-Gorskii glass plate images and, using image processing techniques, automatically produce a color image with as few visual artifacts as possible.
        </p>
      </header>

      <section className="proj-section">
        <h2>Part 1 &middot; Single Scale Alignment on Smaller Images</h2>
        <p>
          For this part of the project, we're starting by doing this the naive way. We're first taking our green image, and then sliding it across our blue image until we get the best alignment. Then we do the same with our red image, and then we stack all three together to get an RGB image in the end. For both channels, I searched every x and y displacement in the range [-15, 15].
        </p>
        <h3>L2 Norm</h3>
        <p>
          The L2 norm measures the Euclidean distance between the pixel values of two image vectors. For a reference vector <em>v</em> and a shifted vector <em>u</em>, I compute:
        </p>
        <div className="proj-equation" role="math" aria-label="L2 of u and v equals the square root of the sum over all pixels p of u sub p minus v sub p squared">
          <span>L</span><sub>2</sub><span>(u, v) = </span>
          <span className="radical">√</span>
          <span className="radicand">
            <span className="sum">∑</span>
            <span className="sum-index">p</span>
            <span>(u</span><sub>p</sub><span> − v</span><sub>p</sub><span>)</span><sup>2</sup>
          </span>
        </div>
        <p>
          A smaller distance means the channels are more similar. I made the L2 Norm negative, so the Euclidean norm with the largest score is picked.
        </p>
        <h3>Normalized Cross-Correlation</h3>
        <p>
          Normalized Cross-Correlation (NCC) compares the direction of the two mean-normalized image vectors:
        </p>
        <div className="proj-equation" role="math" aria-label="NCC of u and v equals the dot product of their vectors with their means subtracted from them divided by the product of their norms">
          <span>NCC(u, v) = </span>
          <span className="fraction">
            <span className="numerator">(u − μ<sub>u</sub>) · (v − μ<sub>v</sub>)</span>
            <span className="denominator">‖u − μ<sub>u</sub>‖<sub>2</sub> ‖v − μ<sub>v</sub>‖<sub>2</sub></span>
          </span>
        </div>
        <p>
          A larger NCC score means the images are more strongly correlated, so I select the displacement with the largest score.
        </p>
        <p>
          In doing this, I also found that removing the edges of the images before vectorizing them made it better. The images have these thick black bars on the outside that overly impact the result from our metrics while not being relevant parts of the photo. Below are the results using the L2-Norm on the left and the NCC metric on the right for our naive approach.
        </p>
        <Gallery images={singleScaleImages} mode="single" />
      </section>

      <section className="proj-section">
        <h2>Part 2 &middot; Multi-Scale Alignment on Larger Images</h2>
        <p>
          The above approach of simply sliding our images across each other was cool and all, but not efficient for the larger images in this dataset. The approach here is to use an image-pyramid, which I understand best as a recursive algorithm that uses the above version as its backbone.
        </p>
        <p>
          At each level of the pyramid, I scale both images by a factor of 0.5, repeatedly reducing their height and width until the smaller dimension is less than 400 pixels. Once the images are small enough, I perform the single-scale search over [-15, 15] for both x and y. As I return to each higher-resolution level, I double the displacement from the previous level and check a small range of [-2, 2] around that estimate. This is faster because the wide search happens on a much smaller image, while each larger level only needs a small local refinement.
        </p>
        <p>
          We continue this all the way up until our normal scale image, where we have a small set of options for our shift that we check through, and then finally we follow the same process as before to stack our images to get our final RGB images. 
        </p>
        <p>
          Below you can see our full image gallery, using our multi-scale technique, split up between L2-Norm and NCC implementations for our distance metric. Each displacement is written as (x, y), and both the green and red channels are aligned to the blue channel.
        </p>
        <Gallery images={providedImages} mode="multi" />
      </section>

      <section className="proj-section">
        <h2>Custom Images</h2>
        <p>
          Here are the colorized images that I chose from the gallery, mostly because I thought the images were pretty and wanted to see if I could colorize them myself!
        </p>
        <p className="source-note">
          Source images: {" "}
          <a
            href="https://www.loc.gov/collections/prokudin-gorskii/"
            target="_blank"
            rel="noreferrer"
          >
            Library of Congress Prokudin-Gorskii Collection
          </a>
          .
        </p>
        <Gallery images={customImages} mode="multi" />
      </section>

      <section className="proj-section">
        <h2>Alignment Failure &middot; Emir</h2>
        <p className="writing-placeholder">
          The Emir image is the only one I could not get to reasonably align. I found that the best way to get alignment is to decrease the amount of layers for our pyramid, which leads to a less efficient algorithm. This was due to significant disalignment of their RGB values.
        </p>
        <ImageComparison image={emirImage} mode="multi" />
      </section>

      <footer className="proj-footer">
        <Link to="/" className="back-link">
          <FaArrowLeft /> Back to projects
        </Link>
      </footer>
    </article>
  );
};

export default Proj1;
