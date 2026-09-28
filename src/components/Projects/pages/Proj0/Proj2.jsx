import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import "./Proj.css";
import "./Proj2.css";

const asset = (filename) => `${import.meta.env.BASE_URL}proj2/${filename}`;

const stackLevels = [0, 2, 4];

const Figure = ({ src, alt, caption }) => (
  <figure className="result proj2-card">
    <img
      className="proj-image proj-image--contain"
      src={asset(src)}
      alt={alt}
      loading="lazy"
    />
    <figcaption>
      <strong>{caption}</strong>
    </figcaption>
  </figure>
);

const WritingPlaceholder = ({ children }) => (
  <div className="writing-placeholder proj2-writing-placeholder">
    <strong>Write-up placeholder</strong>
    <span>{children}</span>
  </div>
);

const CodeSnippet = ({ title, children }) => (
  <section className="proj2-code-block">
    <h4>{title}</h4>
    <pre>
      <code>{children}</code>
    </pre>
  </section>
);

const fourLoopConvolution = `def convolution_inefficient(img, kernel, padding=same_padding):
    kernel_shape = kernel.shape

    k_y = (kernel_shape[0] - 1) // 2
    k_x = (kernel_shape[1] - 1) // 2

    padded_img, _ = padding(img, kernel_shape)

    output_height = padded_img.shape[0] - kernel_shape[0] + 1
    output_width = padded_img.shape[1] - kernel_shape[1] + 1
    output_image = np.zeros((output_height, output_width))

    for i in range(output_height):
        for j in range(output_width):
            center_i = i + k_y
            center_j = j + k_x

            for u in range(-k_y, k_y + 1):
                for v in range(-k_x, k_x + 1):
                    output_image[i, j] += (
                        kernel[u + k_y, v + k_x]
                        * padded_img[center_i - u, center_j - v]
                    )

    return output_image`;

const twoLoopConvolution = `def convolution(img, kernel, padding=same_padding):
    if img.ndim == 3:
        channels = [
            convolution(img[:, :, c], kernel, padding=padding)
            for c in range(img.shape[2])
        ]
        return np.stack(channels, axis=2)

    kernel = np.flip(kernel, axis=(0, 1))
    kernel_shape = kernel.shape
    kernel_flat = kernel.flatten().reshape(1, -1)
    padded_img, _ = padding(img, kernel_shape)

    output_height = padded_img.shape[0] - kernel_shape[0] + 1
    output_width = padded_img.shape[1] - kernel_shape[1] + 1
    output_image = np.zeros((output_height, output_width))

    for i in range(output_height):
        for j in range(output_width):
            patch = padded_img[
                i:i + kernel_shape[0],
                j:j + kernel_shape[1],
            ]
            output_image[i, j] = (
                kernel_flat @ patch.reshape(-1, 1)
            )[0, 0]

    return output_image`;

const part11ImageCreation = `im_face = skio.imread(
    "Proj2/CS180_fa2026_proj2_data/face.jpg",
    as_gray=True,
)

box_filter = 1 / 81 * np.ones((9, 9))
D_x = np.array([1, 0, -1]).reshape((1, 3))
D_y = D_x.reshape((3, 1))

# Same-padding results
face_box = convolution(im_face, box_filter)
face_dx = convolution(im_face, D_x)
face_dy = convolution(im_face, D_y)

# Full-padding results
face_box_full = convolution(im_face, box_filter, padding=full_padding)
face_dx_full = convolution(im_face, D_x, padding=full_padding)
face_dy_full = convolution(im_face, D_y, padding=full_padding)

save_image(face_box, "face_box")
save_image(face_dx, "face_dx")
save_image(face_dy, "face_dy")
save_image(face_box_full, "face_box_full")
save_image(normalize_for_display(face_dx_full), "face_dx_full")
save_image(normalize_for_display(face_dy_full), "face_dy_full")`;

const Proj2 = () => (
  <article className="proj proj2">
    <Link to="/" className="back-link">
      <FaArrowLeft /> Back to projects
    </Link>

    <header className="proj-header">
      <p className="proj-eyebrow">CS 180 &middot; Project 2</p>
      <h1>Fun with Filters and Frequencies!</h1>
      <p className="proj-subtitle">
        Convolutions, edge detection, frequency-domain image processing, and multiresolution blending.
      </p>
    </header>

    <nav className="proj2-toc" aria-label="Project 2 sections">
      <a href="#part-1-1">1.1 Convolutions</a>
      <a href="#part-1-2">1.2 Finite Differences</a>
      <a href="#part-1-3">1.3 DoG Filters</a>
      <a href="#part-2-1">2.1 Sharpening</a>
      <a href="#part-2-2">2.2 Hybrid Images</a>
      <a href="#part-2-3">2.3 Stacks</a>
      <a href="#part-2-4">2.4 Blending</a>
    </nav>

    <section className="proj-section" id="part-1-1">
      <h2>Part 1.1 &middot; Convolutions from Scratch</h2>
      <p>
        For our four-loop implementation, I followed exactly what was on the slides, which, when going pixel by pixel in our initial image, involved two more summations over the kernel. To turn this into a two for loop implementation for the convolution, I recognized that the summation could be done as some sort of matrix or vector product, so I turned each item into a flat vector and then took their dot product, using numpy so as to speed up the process.
        Convolution has some really nice properties, especially when changed into the fourier domain (it's just multiplication!), but a thing to note is that it flips the kernel when we do our convolution, so we flip the kernel before performing our dot product. 
        For our zero padding, we had two options, same_padding and full_padding - same padding makes it so that our output is the same size as our input for convolution, which, for a k x k kernel, pads with (k - 1)/2. For full padding, we ensure that every pixel on the initial image is covered the same amount of times, padding with k - 1 zeros. For an H x W image and a Kh x Kw kernel, this produces an (H + Kh - 1) x (W + Kw - 1) output. The results of each type are seen below. 
        Since for same padding, which we use for the rest of the project, not every pixel is used equally, our outer pixels have less influence on the image from being used less than any of the other ones.
        Our four for-loop option was the slowest, the two for-loop was pretty fast but not as fast as when I tried to use the built-in scipy.signal.convolve2d.
      </p>

      <div className="proj2-code-grid">
        <CodeSnippet title="Four-loop implementation">
          {fourLoopConvolution}
        </CodeSnippet>
        <CodeSnippet title="Two-loop implementation">
          {twoLoopConvolution}
        </CodeSnippet>
        <CodeSnippet title="Creating the Part 1.1 images">
          {part11ImageCreation}
        </CodeSnippet>
      </div>

      <h3>9×9 Box Filter and Finite Differences</h3>
      <div className="proj2-media-grid">
        <Figure src="face.jpg" alt="Original grayscale portrait" caption="Original image" />
        <Figure src="face_box.jpg" alt="Portrait convolved with a 9 by 9 box filter" caption="9×9 box filter" />
        <Figure src="face_dx_normalized.jpg" alt="Normalized horizontal derivative of the portrait" caption="Finite difference Dx" />
        <Figure src="face_dy_normalized.jpg" alt="Normalized vertical derivative of the portrait" caption="Finite difference Dy" />
      </div>

      <h3>Full Padding Results</h3>
      <div className="proj2-media-grid">
        <Figure src="face_box_full.jpg" alt="Portrait convolved with a 9 by 9 box filter using full padding" caption="9×9 box filter · full padding" />
        <Figure src="face_dx_full.jpg" alt="Normalized horizontal portrait derivative using full padding" caption="Finite difference Dx · full padding" />
        <Figure src="face_dy_full.jpg" alt="Normalized vertical portrait derivative using full padding" caption="Finite difference Dy · full padding" />
      </div>
    </section>

    <section className="proj-section" id="part-1-2">
      <h2>Part 1.2 &middot; Finite Difference Operator</h2>
       <p>
        Our derivative images use the Dx and Dy kernels to calculate the change in pixel intensity (since its a gray scale image) across horizontal and vertical changes.
        Our gradient magnitude is the square root of the square sums of each derivative, giving us strongest output values where we see rates of change in either direction. This works as edge detection!
        When I was finding the best cutoff for the magnitude to create the edge image, I found that as I increased the threshold, I got rid of noise but I would lose some less intense edges, leading to some open spots on the actual output image where there's definitely an edge for the same of suppressing noise. 
      </p>

      <div className="proj2-media-grid">
        <Figure src="cameraman.png" alt="Original cameraman image" caption="Original cameraman" />
        <Figure src="cameraman_dx.jpg" alt="Normalized partial derivative of the cameraman image in x" caption="Cameraman Dx" />
        <Figure src="cameraman_dy.jpg" alt="Normalized partial derivative of the cameraman image in y" caption="Cameraman Dy" />
        <Figure src="cameraman_magnitude.jpg" alt="Gradient magnitude of the cameraman image" caption="Gradient magnitude" />
        <Figure src="binarized_cameraman_magnitude.jpg" alt="Binarized gradient magnitude of the cameraman image" caption="Binarized edges · threshold 0.34" />
      </div>
    </section>

    <section className="proj-section" id="part-1-3">
      <h2>Part 1.3 &middot; Derivative of Gaussian Filters</h2>
      <p>
        For our gaussian, we used the command cv2.getGaussianKernel() to create a 1D kernel, and then taking the outer product with itself to create a true 2D gaussian kernel. 
        I then took the magnitude of the gradients again but this time I smoothed it with the gaussian kernel we had created. This led to our edges being larger (as they were averaged out), but also to us having a lower threshold as our noise was mostly blurred out by the gaussian filter.
        Comparing it with the DoG process, which first takes the image, convolves it with the derivatives of the Gaussian kernel (in the x and y directions), and then taking the magnitude and using that to create our edge image, we see that we get the same result with the same threshold from this different process!
        We see its the same because our initial process is (I * G) * D_x, which is the same as I * (G * D_x) due to convolutions properties of associativity!
      </p>

      <h3>Gaussian Smoothing Followed by Finite Differences</h3>
      <div className="proj2-media-grid">
        <Figure src="cameraman_blurred.jpg" alt="Cameraman image after Gaussian smoothing" caption="Blurred cameraman" />
        <Figure src="cameraman_gauss_magnitude.jpg" alt="Gradient magnitude after Gaussian smoothing" caption="Smoothed gradient magnitude" />
        <Figure src="binarized_cameraman_gauss_magnitude.jpg" alt="Binarized gradient magnitude after Gaussian smoothing" caption="Smoothed binary edges · threshold 0.12" />
      </div>

      <h3>Single-Convolution DoG Results</h3>
      <div className="proj2-media-grid">
        <Figure src="gauss_dx.jpg" alt="Derivative of Gaussian filter in x" caption="DoG filter Dx" />
        <Figure src="gauss_dy.jpg" alt="Derivative of Gaussian filter in y" caption="DoG filter Dy" />
        <Figure src="cameraman_gauss_dx.jpg" alt="Cameraman convolved with the x derivative of Gaussian filter" caption="DoG response Dx" />
        <Figure src="cameraman_gauss_dy.jpg" alt="Cameraman convolved with the y derivative of Gaussian filter" caption="DoG response Dy" />
        <Figure src="cameraman_dog_magnitude.jpg" alt="Gradient magnitude produced by derivative of Gaussian filters" caption="DoG gradient magnitude" />
        <Figure src="binarized_cameraman_gauss_dog_magnitude.jpg" alt="Binarized derivative of Gaussian magnitude" caption="DoG binary edges · threshold 0.12" />
      </div>
    </section>

    <section className="proj-section" id="part-2-1">
      <h2>Part 2.1 &middot; Image Sharpening</h2>
      <p>
        In this section I implemented the unsharp masking technique we learned in class. This mask is created by taking our low pass filter (our gaussian kernel convolution) to create an image with just the lower frequency images, then it deletes them from our initial image to isolate the higher frequencies of the image. This is then added back to the initial image to essentially amplify the higher frequency signals of our initial image.
        We do this in a single convolution by taking advantage of properties of convolution (commutativity and associativity) that allow us to turn the above explanation of an unsharp mask filter into a convolution with the sum of the unit impulse x (1 + alpha) - alpha x gaussian.
        I chose 1 as a low alpha value (as zero means no sharpening, so just a lil higher), then I experimented with some values until I got that numbers ~4/5 for my images were right around medium for sharpness, and as you get closer to 10 for alpha you have a really strong sharpening filter. 
        If we look specifically at the already sharp image of the lizard I used, when I blur it then resharpen it we lose some of the background detail and smaller minute things, as they are lost in the blurring process and become unrecoverable. 
      </p>

      <h3>Taj Mahal</h3>
      <div className="proj2-media-grid">
        <Figure src="taj.jpg" alt="Original Taj Mahal image" caption="Original" />
        <Figure src="im_taj_blurred.jpg" alt="Gaussian-blurred Taj Mahal image" caption="Blurred image" />
        <Figure src="im_taj_hpf.jpg" alt="High-frequency component of the Taj Mahal image" caption="High frequencies" />
        <Figure src="taj_sharp.jpg" alt="Sharpened Taj Mahal image" caption="Sharpened result" />
      </div>

      <h3>Additional Images</h3>
      <div className="proj2-media-grid">
        <Figure src="nba1.jpeg" alt="First original basketball image" caption="NBA image 1 · original" />
        <Figure src="nba1_sharp.jpg" alt="First sharpened basketball image" caption="NBA image 1 · sharpened" />
        <Figure src="nba2.jpeg" alt="Second original basketball image" caption="NBA image 2 · original" />
        <Figure src="nba2_sharp.jpg" alt="Second sharpened basketball image" caption="NBA image 2 · sharpened" />
      </div>

      <h3>Blur Then Resharpen</h3>
      <div className="proj2-media-grid">
        <Figure src="already_sharp.jpg" alt="Original sharp image" caption="Original sharp image" />
        <Figure src="already_sharp_dull.jpg" alt="Artificially blurred image" caption="Blurred" />
        <Figure src="already_sharp_sharp.jpg" alt="Image sharpened after artificial blurring" caption="Resharpened" />
      </div>

      <h3>Varying the Sharpening Amount</h3>
      <div className="proj2-media-grid">
        <Figure src="im_already_sharp_low.jpg" alt="Lightly resharpened lizard image" caption="Low alpha · 1" />
        <Figure src="already_sharp_sharp.jpg" alt="Moderately resharpened lizard image" caption="Medium alpha · 5" />
        <Figure src="im_already_sharp_high.jpg" alt="Strongly resharpened lizard image" caption="High alpha · 10" />
      </div>
    </section>

    <section className="proj-section" id="part-2-2">
      <h2>Part 2.2 &middot; Hybrid Images</h2>
      <p>
        For this section we are creating hybrids of images by overlaying one on top of the other - kind of. 
        We first have to align the images, which we do by selecting two points on each image to align around.
        What we then do is take one image as the lower pass image, and use our gaussian kernel to create a version of the image with only our lower frequencies.
        Then, we grab the higher frequencies of the second image by subtracting the lower frequencies of the second image from itself. 
        For our cutoff frequency choices, I ended up choosing sigma1 = 3 for our high pass filter and sigma2 = 4 for our low pass filter, which was plugged into the function that creates our gaussian kernel. This allowed us to overlay them and create the desired hybrid effect.
        That effect being seen best when you move the image further and closer from your eyes. When images are further you see more of the low frequency parts of the image, while when you look closer you see more of the high frequency parts of the image. Try it yourself with the images below, you'll see I'm not lying!
        When looking at the fourier transforms of each image, we see that low pass filters concentrate around the middle of the image of the FFT, and the high pass filter concentrates around the outside parts of the FFT.
      </p>

      <h3>Favorite Hybrid · Nico + Cookie Monster</h3>
      <div className="proj2-media-grid">
        <Figure src="cookie_monster_aligned.jpg" alt="Aligned Cookie Monster image" caption="Cookie Monster · high frequencies" />
        <Figure src="nico_aligned.jpg" alt="Aligned photograph of Nico" caption="Nico · low frequencies" />
        <Figure src="nico_cookie_hybrid.jpg" alt="Hybrid image combining Nico and Cookie Monster" caption="Final hybrid" />
      </div>

      <h3>Nico + Cookie Monster Frequency Analysis</h3>
      <div className="proj2-media-grid">
        <Figure src="cookie_monster_aligned.jpg" alt="Aligned Cookie Monster input" caption="Aligned Cookie Monster" />
        <Figure src="nico_cookie_cookie_fft.jpg" alt="Fourier transform of aligned Cookie Monster" caption="Cookie Monster FFT" />
        <Figure src="nico_aligned.jpg" alt="Aligned Nico input" caption="Aligned Nico" />
        <Figure src="nico_cookie_nico_fft.jpg" alt="Fourier transform of aligned Nico" caption="Nico FFT" />
        <Figure src="nico_cookie_high.jpg" alt="High-pass filtered Cookie Monster image" caption="Cookie Monster high-pass" />
        <Figure src="nico_cookie_high_fft.jpg" alt="Fourier transform of high-pass Cookie Monster" caption="High-pass FFT" />
        <Figure src="nico_cookie_low.jpg" alt="Low-pass filtered Nico image" caption="Nico low-pass" />
        <Figure src="nico_cookie_low_fft.jpg" alt="Fourier transform of low-pass Nico" caption="Low-pass FFT" />
        <Figure src="nico_cookie_hybrid.jpg" alt="Final Nico and Cookie Monster hybrid" caption="Final hybrid" />
        <Figure src="nico_cookie_hybrid_fft.jpg" alt="Fourier transform of the final Nico and Cookie Monster hybrid" caption="Final hybrid FFT" />
      </div>

      <h3>Hybrid 2 · Derek + Nutmeg</h3>
      <div className="proj2-media-grid">
        <Figure src="DerekPicture.jpg" alt="Original portrait of Derek" caption="Derek input" />
        <Figure src="nutmeg.jpg" alt="Original photograph of Nutmeg the cat" caption="Nutmeg input" />
        <Figure src="given_hybrid.jpg" alt="Hybrid image combining Derek and Nutmeg" caption="Final hybrid" />
      </div>

      <h3>Hybrid 3 · LeBron + Panik</h3>
      <div className="proj2-media-grid">
        <Figure src="lebron_aligned.jpg" alt="Aligned photograph of LeBron James" caption="LeBron input" />
        <Figure src="panik_aligned.jpg" alt="Aligned Panik meme image" caption="Panik input" />
        <Figure src="panik_lebron_hybrid.jpg" alt="Hybrid image combining LeBron and the Panik meme" caption="Final hybrid" />
      </div>
    </section>

    <section className="proj-section" id="part-2-3">
      <h2>Part 2.3 &middot; Gaussian and Laplacian Stacks</h2>
      <p>
        For this portion we want to blend our two images by first defining a line for which we will be blending across. After that we are going to use our Gaussian and Laplacian stacks. To create this, we iteratively start with our base image, take a low pass filter with the gaussian, and then subtract our low pass version of our image from our base image. We repeat this recursively to get our next layers of our Gaussian and Laplacian stacks.
        By simply performing this subtraction we don't create any pyramids, which was used in the initial paper that influenced this question, but you can see the outputs from creating these stacks and then masking them appropriately across our blend line.
      </p>

      <div className="proj2-media-grid proj2-input-grid">
        <Figure src="apple.jpeg" alt="Original apple image" caption="Apple input" />
        <Figure src="orange.jpeg" alt="Original orange image" caption="Orange input" />
      </div>

      <h3>Figure 3.42 Recreation</h3>
      <div className="proj2-stack-table">
        {stackLevels.map((level) => (
          <section className="proj2-stack-level" key={level}>
            <h4>Level {level}</h4>
            <div className="proj2-stack-images">
              <Figure
                src={`fig342_apple_level_${level}.jpg`}
                alt={`Mask-weighted apple Laplacian contribution at level ${level}`}
                caption="Weighted apple"
              />
              <Figure
                src={`fig342_orange_level_${level}.jpg`}
                alt={`Mask-weighted orange Laplacian contribution at level ${level}`}
                caption="Weighted orange"
              />
              <Figure
                src={`fig342_combined_level_${level}.jpg`}
                alt={`Combined apple and orange contribution at level ${level}`}
                caption="Combined contribution"
              />
            </div>
          </section>
        ))}
        <section className="proj2-stack-level">
          <h4>Reconstruction</h4>
          <div className="proj2-stack-images">
            <Figure src="fig342_apple_reconstruction.jpg" alt="Reconstructed weighted apple contribution" caption="Apple reconstruction" />
            <Figure src="fig342_orange_reconstruction.jpg" alt="Reconstructed weighted orange contribution" caption="Orange reconstruction" />
            <Figure src="fig342_final_reconstruction.jpg" alt="Final reconstructed oraple" caption="Final reconstruction" />
          </div>
        </section>
      </div>
    </section>

    <section className="proj-section" id="part-2-4">
      <h2>Part 2.4 &middot; Multiresolution Blending</h2>
      <p>
        Using the same mask stacks from the previous part, we will then perform blending level by level. In the paper by Burt and Adelson we see this equation: LSl(i, j) = GRl(i, j)LAl(i, j) + (1 - GRl(i, j))LBl(i, j) which performs blending at each level. GR refers to the mask filter across the line blurred with the gaussian, and this operation creates a smooth blend along the boundary line, creating the blending effect!
        The effect is seen below on all these images! The mask doesn't even have to be a straight line, due to how the above formula is created, this allows us to have arbitrary masks for our blending!
        Our reconstruction is I_blend = sum of all Laplacian stacks, + our final gaussian blur from the end of the stack which preserves only the necessary pieces of lower frequencies for full reconstruction. 
      </p>

      <h3>The Oraple</h3>
      <div className="proj2-media-grid">
        <Figure src="apple.jpeg" alt="Apple input for multiresolution blending" caption="Apple" />
        <Figure src="orange.jpeg" alt="Orange input for multiresolution blending" caption="Orange" />
        <Figure src="oraple_mask.jpg" alt="Vertical step mask used for the oraple" caption="Vertical mask" />
        <Figure src="oraple.jpg" alt="Apple and orange combined using multiresolution blending" caption="Final oraple" />
      </div>

      <h3>Custom Blend 1 · Wilt + Otto Porter Jr.</h3>
      <div className="proj2-media-grid">
        <Figure src="wilt.jpeg" alt="Wilt Chamberlain input image" caption="Wilt input" />
        <Figure src="opj.jpg" alt="Otto Porter Jr. input image" caption="Otto Porter Jr. input" />
        <Figure src="wilt_opj_mask.jpg" alt="Vertical mask for the Wilt and Otto Porter Jr. blend" caption="Vertical mask" />
        <Figure src="blended_wilt_opj.jpg" alt="Multiresolution blend of Wilt Chamberlain and Otto Porter Jr." caption="Final blend" />
      </div>

      <h3>Custom Blend 2 · Vader + The Creation of Adam</h3>
      <div className="proj2-media-grid">
        <Figure src="vader.jpg" alt="Darth Vader input image" caption="Vader input" />
        <Figure src="creation_of_adam.jpg" alt="The Creation of Adam input image" caption="Creation of Adam input" />
        <Figure src="vader_mask.jpg" alt="Irregular polygon mask surrounding Darth Vader" caption="Irregular mask" />
        <Figure src="blended_vader_adam.jpg" alt="Multiresolution blend placing Darth Vader into The Creation of Adam" caption="Final blend" />
      </div>

    </section>

    <section className="proj-section">
      <h2>Most Important Thing I Learned</h2>
      <p>
        The most important thing I learned from this project is the importance of the gaussian kernel and convolution for any image creation. Because it isolates low pass frequencies which let us isolate high pass frequencies, having the gaussian kernel and allowing us to work in frequency domain/representation lets us perform more image techniques that are the foundation for this entire project.
      </p>
    </section>

    <footer className="proj-footer">
      <Link to="/" className="back-link">
        <FaArrowLeft /> Back to projects
      </Link>
    </footer>
  </article>
);

export default Proj2;
