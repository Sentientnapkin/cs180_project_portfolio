import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import "./Proj.css";
import "./Proj4.css";

const asset = (name) => `${import.meta.env.BASE_URL}proj4/${name}`;

function Figure({ file, caption, className = "" }) {
  return (
    <figure className={`proj4-figure ${className}`}>
      <a
        href={asset(file)}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open full image: ${caption}`}
      >
        <img src={asset(file)} alt={caption} loading="lazy" />
      </a>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export default function Proj4() {
  return (
    <article className="proj proj4">
      <Link to="/" className="back-link">
        <FaArrowLeft /> Back to projects
      </Link>

      <header className="proj-header">
        <p className="proj-eyebrow">CS 180 · Project 4 · Part A</p>
        <h1>Image Warping &amp; Mosaicing</h1>

        {/* Introduction write-up */}
        <p>
          This project is created to do some cool image warping and morphing, specifically looking at combining images to make them into one larger panorama using math!
        </p>
      </header>

      <nav className="proj4-toc" aria-label="Project 4 sections">
        <a href="#a1">A.1 · Photographs</a>
        <a href="#a2">A.2 · Homographies</a>
        <a href="#a3">A.3 · Rectification</a>
        <a href="#a4">A.4 · Mosaics</a>
      </nav>

      {/* A.1 — Source photographs */}
      <section id="a1" className="proj-section">
        <h2>A.1 · Shoot the Pictures</h2>

        <p>
          My inspiration for the photos I took were to use images and videos from sports stadiums/arenas I've been to! I took some videos I took where I stood in one place and rotated my phone, cut out frames, and then tried to turn it into a panorama for this project! Note for homographies to work, it had to approximate zero movement in the phone, just a rotation - if I had moved the phone in taking these pictures our results would not have worked as well.
        </p>

        <div>
          <h3>Memorial</h3>
          <div className="proj4-sources">
            <Figure
              file="sources/memorial_left.jpg"
              caption="memorial left"
            />
            <Figure
              file="sources/memorial_right.jpg"
              caption="memorial right"
            />
          </div>
        </div>

        <div>
          <h3>Chile</h3>
          <div className="proj4-sources">
            <Figure
              file="sources/chile-1.jpg"
              caption="chile · 1"
            />
            <Figure
              file="sources/chile-2.jpg"
              caption="chile · 2"
            />
          </div>
        </div>
      </section>

      {/* A.2 — Correspondences */}
      <section id="a2" className="proj-section">
        <h2>A.2 · Recover Homographies</h2>

        <p>
          A homography translates lines to lines from one image to another. For this case, we wanted to solve for H, which is the matrix corresponding between our two image coordinates. We can create this by flattening h and turning it into a matrix equation of the form Ax = b as seen below. Note that we can only recover the transformation up to a scale, and so we arbitrarily decide the bottom right of the matrix should be 1 and use that to get values for the rest of the matrix.
        </p>

        {/* Homogeneous coordinates: equality holds up to a nonzero scale λ. */}
        <h3>Homography relation</h3>
        <div className="proj4-math">
          <math display="block" aria-label="x prime is proportional to H times x">
            <mrow>
              <msup><mi mathvariant="bold">x</mi><mo>′</mo></msup>
              <mo>∼</mo>
              <mi>H</mi><mi mathvariant="bold">x</mi>
              <mo>,</mo><mspace width="1em" />
              <mi>λ</mi><msup><mi mathvariant="bold">x</mi><mo>′</mo></msup>
              <mo>=</mo><mi>H</mi><mi mathvariant="bold">x</mi>
            </mrow>
          </math>
        </div>
        <pre className="proj4-linear-system">
          <code>{`    ┌ x′ ┐   ┌ h₁₁ h₁₂ h₁₃ ┐ ┌ x ┐
  λ │ y′ │ = │ h₂₁ h₂₂ h₂₃ │ │ y │
    └ 1  ┘   └ h₃₁ h₃₂  1  ┘ └ 1 ┘

  λ = h₃₁x + h₃₂y + 1`}</code>
        </pre>

        {/* h is the unknown parameter vector in the general Ax = b form. */}
        <h3>Linear system · A h = b</h3>
        <p>
          Here h is the unknown vector (the x in Ax = b), with h₃₃ fixed to 1.
          Each correspondence (xᵢ, yᵢ) → (xᵢ′, yᵢ′) contributes two rows:
        </p>
        <pre className="proj4-linear-system">
          <code>{`                 A                                    b
┌                                         ┐       ┌     ┐
│ x₁ y₁ 1  0  0 0  −x₁′x₁  −x₁′y₁      │       │ x₁′ │
│  0  0 0 x₁ y₁ 1  −y₁′x₁  −y₁′y₁      │       │ y₁′ │
│  ⋮  ⋮ ⋮  ⋮  ⋮ ⋮      ⋮        ⋮         │ h  =  │  ⋮  │
│ xₙ yₙ 1  0  0 0  −xₙ′xₙ  −xₙ′yₙ      │       │ xₙ′ │
│  0  0 0 xₙ yₙ 1  −yₙ′xₙ  −yₙ′yₙ      │       │ yₙ′ │
└                                         ┘       └     ┘

h = [ h₁₁ h₁₂ h₁₃ h₂₁ h₂₂ h₂₃ h₃₁ h₃₂ ]ᵀ
A has 2n rows and 8 columns; b has 2n entries.`}</code>
        </pre>

        <p>
          Note that we have an overdetermined system here so we need to use least squares to solve this.
        </p>

      

        {/* Interpolation uses row r and column c, as in the Python code. */}
        <h3>Interpolation at the inverse-warped source point</h3>
        <p>
          Let (r, c) be the source coordinates obtained by applying the inverse
          homography to an output pixel. Here r is the row and c is the column.
        </p>

        <h4>Nearest neighbor</h4>
        <pre className="proj4-linear-system">
          <code>{`Îₙₙ(r, c) = I[round(r), round(c)]`}</code>
        </pre>

      
        <p>
          These weights apply to each color channel. Both warpers return zero
          for source coordinates outside the image.
        </p>

        <figure className="proj4-interpolation-diagram">
          <img
            src={asset("bilinear-interpolation-wikipedia.svg")}
            alt="Bilinear interpolation diagram showing four sample points, intermediate linear interpolations, and the point to estimate."
            loading="lazy"
          />
          <figcaption>
            Bilinear interpolation illustration by{" "}
            <a
              href="https://commons.wikimedia.org/wiki/File:BilinearInterpolationV2.svg"
              target="_blank"
              rel="noreferrer"
            >
              Swienegel
            </a>
            , based on Bocsika’s original diagram. From{" "}
            <a
              href="https://en.wikipedia.org/wiki/Bilinear_interpolation"
              target="_blank"
              rel="noreferrer"
            >
              Wikipedia: Bilinear interpolation
            </a>
            . Licensed under{" "}
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              target="_blank"
              rel="noreferrer"
            >
              CC BY-SA 4.0
            </a>
            ; image unchanged.
          </figcaption>
        </figure>

        <section className="proj4-example">
          <h3>Oracle Arena</h3>
          <Figure
            file="oracle_left_oracle_right_correspondences.png"
            caption="Oracle Arena correspondences"
          />

          <p>
            Eight correspondences were used to fit this homography by least
            squares. Source: <code>oracle_left</code>; destination:{" "}
            <code>oracle_right</code>. 
          </p>
          <pre className="proj4-linear-system" aria-label="Recovered homography for Oracle Arena">
            <code>{`[      2.58623573       0.2679474     -2001.64901 ]
[     0.200515138      2.25467713     -1272.17127 ]
[  0.000817174368  0.000287938999               1 ]`}</code>
          </pre>
        </section>

        <section className="proj4-example">
          <h3>Chile</h3>
          <Figure
            file="chile-1_chile-2_correspondences.png"
            caption="Chile correspondences"
          />

          <p>
            Eight correspondences were used to fit this homography by least
            squares. Source: <code>chile-1</code>; destination:{" "}
            <code>chile-2</code>. 
          </p>
          <pre className="proj4-linear-system" aria-label="Recovered homography for Chile">
            <code>{`[     0.520021794   -0.0552651623      447.077638 ]
[   -0.0941529125     0.865527742     -23.3681882 ]
[ -0.000485022113 -7.97004025e-05               1 ]`}</code>
          </pre>
        </section>

        <section className="proj4-example">
          <h3>Memorial Stadium</h3>
          <Figure
            file="memorial_left_memorial_right_correspondences.png"
            caption="Memorial Stadium correspondences"
          />

          <p>
            Eight correspondences were used to fit this homography by least
            squares. Source: <code>memorial_left</code>; destination:{" "}
            <code>memorial_right</code>. 
          </p>
          <pre className="proj4-linear-system" aria-label="Recovered homography for Memorial Stadium">
            <code>{`[      2.87651445    -0.351058905     -730.919814 ]
[     0.927288128      1.74796666     -418.462821 ]
[   0.00206539004 -0.000540700957               1 ]`}</code>
          </pre>
        </section>
      </section>

      {/* A.3 — Rectification and interpolation */}
      <section id="a3" className="proj-section">
        <h2>A.3 · Warp &amp; Rectify</h2>

        <p>
          For this process we perform reverse image warping. We take our destination image, perform the inverse transformation H^-1, and then and then calculate where the coordinates of the destination transformation plane would be in the original image. 
          This allows us to perform a warp that outputs our destination image in the frame of our original image. I then updated the function to take into account the size of the output image, which will be useful for the mosaics later when we have a large image plane we are working with.
        </p>

        <p>
          For each target, the code snaps the chosen destination coordinates to
          their minimum or maximum x and y values to make an exact rectangle.
          These proportions were chosen for the output rather than measured
          from the physical object, so the result demonstrates rectification
          without establishing its true physical aspect ratio.
        </p>

        {/* Brick Building write-up */}
        <section className="proj4-example">
          <h3>Brick Building</h3>

          <p>
            I rectified the narrow window in the brick facade. The four numbered source corners below
            map to the same numbers on the destination rectangle. 
          </p>
          <Figure
            file="brick_building_selected_corners.png"
            caption="Brick Building · selected source corners and destination rectangle"
          />
          <details className="proj4-corner-coordinates">
            <summary>Corner coordinates · source (x, y) → destination (x, y)</summary>
            <pre className="proj4-linear-system">
              <code>{`1: (724, 640) → (557, 415)
2: (720, 728) → (557, 664)
3: (759, 628) → (723, 415)
4: (756, 720) → (723, 664)`}</code>
            </pre>
          </details>

          <div className="proj4-three">
            <Figure
              file="sources/brick_building.jpg"
              caption="Original photograph"
            />
            <Figure
              file="brick_building_rectified_nn.jpg"
              caption="Nearest neighbor"
            />
            <Figure
              file="brick_building_rectified_bilinear.jpg"
              caption="Bilinear"
            />
          </div>

          <p>
            Here we use reverse image warping to perform rectification, where we take something we know is a rectangle and output it as one using reverse image warping. You can see examples here that I have created. 
          </p>
        </section>

        {/* Giants Sunset write-up */}
        <section className="proj4-example">
          <h3>Giants Sunset</h3>

          <p>
            I rectified the scoreboard display for a Giants game. I love Jung Hoo Lee. The four numbered source corners below
            map to the same numbers on the destination rectangle.
          </p>
          <Figure
            file="giants_sunset_selected_corners.png"
            caption="Giants Sunset · selected source corners and destination rectangle"
          />
          <details className="proj4-corner-coordinates">
            <summary>Corner coordinates · source (x, y) → destination (x, y)</summary>
            <pre className="proj4-linear-system">
              <code>{`1: (743, 1096) → (478, 1001)
2: (1048, 1096) → (892, 1001)
3: (744, 1320) → (478, 1335)
4: (1055, 1279) → (892, 1335)`}</code>
            </pre>
          </details>

          <div className="proj4-three">
            <Figure
              file="sources/giants_sunset.jpg"
              caption="Original photograph"
            />
            <Figure
              file="giants_sunset_rectified_nn.jpg"
              caption="Nearest neighbor"
            />
            <Figure
              file="giants_sunset_rectified_bilinear.jpg"
              caption="Bilinear"
            />
          </div>
        </section>

        {/* Window Sunset write-up */}
        <section className="proj4-example">
          <h3>Window Sunset</h3>

          <p>
            I rectified the left window pane. The four numbered source corners below
            map to the same numbers on the destination rectangle. 
          </p>
          <Figure
            file="window_sunset_selected_corners.png"
            caption="Window Sunset · selected source corners and destination rectangle"
          />
          <details className="proj4-corner-coordinates">
            <summary>Corner coordinates · source (x, y) → destination (x, y)</summary>
            <pre className="proj4-linear-system">
              <code>{`1: (244, 267) → (178, 245)
2: (349, 247) → (419, 245)
3: (250, 466) → (178, 563)
4: (350, 460) → (419, 563)`}</code>
            </pre>
          </details>

          <div className="proj4-three">
            <Figure
              file="sources/window_sunset.jpg"
              caption="Original photograph"
            />
            <Figure
              file="window_sunset_rectified_nn.jpg"
              caption="Nearest neighbor"
            />
            <Figure
              file="window_sunset_rectified_bilinear.jpg"
              caption="Bilinear"
            />
          </div>
        </section>

        <h3>Speed comparison</h3>
        <p>
          Nearest neighbor is faster because it samples a single pixel. Bilinear
          is slower because it blends four neighboring pixels, but it generally
          produces smoother edges.
        </p>

        <h3>Matching close-ups · enlarged 4×</h3>
        <p>
          Each pair below uses exactly the same crop in the two saved warped
          images. Both crops are enlarged by repeating pixels, so the display
          does not add extra smoothing.
        </p>

        <div className="proj4-comparison-grid">
          <Figure
            file="giants_sunset_nn_comparison.png"
            caption="Scoreboard text · nearest neighbor · 140 × 100 pixel crop"
          />
          <Figure
            file="giants_sunset_bilinear_comparison.png"
            caption="Scoreboard text · bilinear · same crop"
          />
        </div>
        <p>
          In the scoreboard crop, nearest neighbor leaves stepped, uneven edges. Bilinear
          makes those same edges smoother, but the lettering also looks softer.
        </p>

        <div className="proj4-comparison-grid">
          <Figure
            file="brick_building_nn_comparison.png"
            caption="Window frame · nearest neighbor · 120 × 120 pixel crop"
          />
          <Figure
            file="brick_building_bilinear_comparison.png"
            caption="Window frame · bilinear · same crop"
          />
        </div>
        <p>
          The window frame has more abrupt pixel steps with nearest neighbor.
          Bilinear smooths the frame edges and the flat pane regions,
          at the cost of some sharpness. 
        </p>
      </section>

      {/* A.4 — Blended mosaics */}
      <section id="a4" className="proj-section">
        <h2>A.4 · Blend Images into Mosaics</h2>

        <p>
          We then use this to perform image blending. The general process is, we calculate the homographies between neighboring images. Then we concatenate those about a central image coordinate system so that they all lay on the same plane. Then we create one large mosaic, and fit them to their locations using the calculated the homographies onto the mosaic. As we fit them, we also calculate their weight, defined as the distance from the center of the image - meaning that image points farther away from the center of the image will have less of an impact on the output image than would image points closer to the center of a neighboring image.
        </p>

        {/* Hᵢ maps image i to image i+1; k is the reference image index. */}
        <h3>Register images on the reference canvas</h3>
        <pre className="proj4-linear-system">
          <code>{`Gᵢ = Hₖ₋₁ ··· Hᵢ                  if i < k
Gₖ = identity
Gᵢ = Hₖ⁻¹ Hₖ₊₁⁻¹ ··· Hᵢ₋₁⁻¹       if i > k

qᵢ = Gᵢ⁻¹ [pᵣ, p꜀, 1]ᵀ
(rᵢ, cᵢ) = (qᵢ,₁ / qᵢ,₃, qᵢ,₂ / qᵢ,₃)`}</code>
        </pre>
        <p>
          Hᵢ maps image i to image i+1, and Gᵢ maps image i into the middle
          reference image k (using zero-based indices). The output coordinate
          (pᵣ, p꜀) includes the canvas origin offset.
        </p>

        <h3>Weights</h3>
        <pre className="proj4-linear-system">
          <code>{`aᵢ = max((heightᵢ − 1) / 2, 1)
bᵢ = max((widthᵢ  − 1) / 2, 1)

wᵢ(r, c) = max(0, min(
    r / aᵢ, (heightᵢ − 1 − r) / aᵢ,
    c / bᵢ, (widthᵢ  − 1 − c) / bᵢ
))

wᵢ⁺(r, c) = max(wᵢ(r, c), 10⁻⁸)`}</code>
        </pre>

        <h3>Warp the colors and weights, then normalize</h3>
        <pre className="proj4-linear-system">
          <code>{`Ĩᵢ(p) = bilinear(Iᵢ, rᵢ, cᵢ)
ŵᵢ(p) = bilinear(wᵢ⁺, rᵢ, cᵢ)

          Σᵢ ŵᵢ(p) Ĩᵢ(p)
M(p) = ───────────────────   when Σᵢ ŵᵢ(p) > 0
              Σᵢ ŵᵢ(p)

M(p) = 0                    otherwise`}</code>
        </pre>
        <p>
          The weights decrease toward each source image’s edges. Colors and
          weights are inverse-warped separately using bilinear interpolation.
          Samples outside an image contribute zero weight.
        </p>

        {/* Memorial mosaic write-up */}
        <section className="proj4-example">
          <h3>Memorial</h3>

          <div className="proj4-sources">
            <Figure
              file="sources/memorial_left.jpg"
              caption="memorial left"
            />
            <Figure
              file="sources/memorial_right.jpg"
              caption="memorial right"
            />
          </div>

          <Figure
            file="Memorial_Mosaic.jpg"
            caption="Memorial · blended mosaic"
            className="proj4-mosaic"
          />

          <p>
            The left side of the image is visible stretched in this one. Small camera translation also probably left some ghosting in the image - the black regions are places where nothing was recovered. 
          </p>
        </section>

        {/* Chile mosaic write-up */}
        <section className="proj4-example">
          <h3>Chile</h3>

          <div className="proj4-sources">
            <Figure
              file="sources/chile-1.jpg"
              caption="chile · 1"
            />
            <Figure
              file="sources/chile-2.jpg"
              caption="chile · 2"
            />
          </div>

          <Figure
            file="Chile_Mosaic.jpg"
            caption="Chile · blended mosaic"
            className="proj4-mosaic"
          />

          <p>
            The goal area, field markings, and distant seating align relatively
            well. Some nearby spectators and raised arms in the foreground look
            blurred or doubled across the overlap. 
          </p>
        </section>

        {/* Salesforce mosaic write-up */}
        <section className="proj4-example">
          <h3>Salesforce</h3>

          <div className="proj4-sources">
            <Figure
              file="sources/salesforce-1.jpg"
              caption="salesforce · 1"
            />
            <Figure
              file="sources/salesforce-2.jpg"
              caption="salesforce · 2"
            />
            <Figure
              file="sources/salesforce-3.jpg"
              caption="salesforce · 3"
            />
            <Figure
              file="sources/salesforce-4.jpg"
              caption="salesforce · 4"
            />
            <Figure
              file="sources/salesforce-5.jpg"
              caption="salesforce · 5"
            />
          </div>

          <Figure
            file="Salesforce_Mosaic.jpg"
            caption="Salesforce · blended mosaic"
            className="proj4-mosaic"
          />

          <p>
            The skyline extends across the five views, with the distant buildings
            providing useful alignment structure. 
          </p>

          <p>
           Note this isnt a sports stadium I just wanted to put this mosaic together.
          </p>
        </section>

        {/* Giants mosaic — source images 1 and 2 */}
        <section className="proj4-example">
          <h3>Giants</h3>

          <div className="proj4-sources">
            <Figure
              file="sources/giants-1.jpg"
              caption="giants · 1"
            />
            <Figure
              file="sources/giants-2.jpg"
              caption="giants · 2"
            />
          </div>

          <Figure
            file="Giants_Mosaic.jpg"
            caption="Giants · images 1–2 · blended mosaic"
            className="proj4-mosaic"
          />

          <p>
            Interestingly the weighting we use causes the cap to dissapear when furhter from the rightmost image.
          </p>
        </section>

        {/* Chase Center mosaic */}
        <section className="proj4-example">
          <h3>Chase Center</h3>

          <div className="proj4-sources">
            <Figure
              file="sources/chase-1.jpg"
              caption="chase · 1"
            />
            <Figure
              file="sources/chase-2.jpg"
              caption="chase · 2"
            />
            <Figure
              file="sources/chase-3.jpg"
              caption="chase · 3"
            />
          </div>

          <Figure
            file="Chase_Mosaic.jpg"
            caption="Chase Center · blended mosaic"
            className="proj4-mosaic"
          />

          <p>
            This has the most ghosting, and its interesting to see it in this example.
          </p>
        </section>
      </section>
    </article>
  );
}
