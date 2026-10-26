""" Code for Part A of Project 4 """
import numpy as np
from pathlib import Path
import skimage.io as skio
import skimage as sk
import json
import matplotlib.pyplot as plt


PROJECT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = PROJECT_DIR / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

# Save img function
def save_image(img, imname):
    fname = OUTPUT_DIR / f"{Path(imname).stem}.jpg"
    skio.imsave(fname, sk.img_as_ubyte(np.clip(img, 0, 1)))

def calculate_homography(points1, points2):
    """ Given two point correspondances, calculate H """

    # define number of points were going to use
    num_points = len(points1)

    # Create our A matrix
    A = np.zeros((2 * num_points, 8))

    for i, point_pair in enumerate(zip(points1, points2)):
        point1 = point_pair[0]
        point2 = point_pair[1]

        A[2 * i, 0] = point1[0]
        A[2 * i, 1] = point1[1]
        A[2 * i, 2] = 1

        A[2 * i, 6] = -point1[0] * point2[0]
        A[2 * i, 7] = -point1[1] * point2[0]

        A[2 * i + 1, 3] = point1[0]
        A[2 * i + 1, 4] = point1[1]
        A[2 * i + 1, 5] = 1

        A[2 * i + 1, 6] = -point1[0] * point2[1]
        A[2 * i + 1, 7] = -point1[1] * point2[1]

    h = np.linalg.lstsq(A, points2.reshape((-1, 1)), rcond=None)[0]
    H = np.append(h, 1)

    H = H.reshape((3, 3))

    return H


def nn_interp(img, x, y):

    nearest_x, nearest_y = int(np.round(x)), int(np.round(y))

    if 0 <= nearest_x < img.shape[0] and 0 <= nearest_y < img.shape[1]:
        return img[nearest_x, nearest_y]

    return np.zeros(img.shape[2:])

def bilinear_interp(img, x, y):
    if not (0 <= x <= img.shape[0] - 1 and 0 <= y <= img.shape[1] - 1):
        return np.zeros(img.shape[2:])

    x1, y1 = int(np.floor(x)), int(np.floor(y))
    x2, y2 = min(x1 + 1, img.shape[0] - 1), min(y1 + 1, img.shape[1] - 1)

    dx, dy = x - x1, y - y1
    return ((1 - dx) * (1 - dy) * img[x1, y1]
            + (1 - dx) * dy * img[x1, y2]
            + dx * (1 - dy) * img[x2, y1]
            + dx * dy * img[x2, y2])

    
def revWarpImage(img, H, interp=bilinear_interp, output_shape=None, origin=None):
    """ Inverse warp using (row, column) coordinates, optionally onto a shared canvas. """
    transf = np.linalg.inv(H)

    if output_shape is None:
        new_top_left = H @ np.array([0, 0, 1])
        new_top_left = new_top_left / new_top_left[2]
        new_top_right = H @ np.array([0, img.shape[1] - 1, 1])
        new_top_right = new_top_right / new_top_right[2]
        new_bottom_left = H @ np.array([img.shape[0] - 1, 0, 1])
        new_bottom_left = new_bottom_left / new_bottom_left[2]
        new_bottom_right = H @ np.array([img.shape[0] - 1, img.shape[1] - 1, 1])
        new_bottom_right = new_bottom_right / new_bottom_right[2]

        corners = np.stack([new_top_left, new_top_right, new_bottom_left, new_bottom_right])
        minimum = np.floor(corners[:, :2].min(axis=0)).astype(int)
        maximum = np.ceil(corners[:, :2].max(axis=0)).astype(int)
        output_shape = tuple(maximum - minimum + 1)
    else:
        minimum = np.asarray(origin)

    new_image = np.zeros(tuple(output_shape) + img.shape[2:])

    for new_x in np.arange(new_image.shape[0]):
        for new_y in np.arange(new_image.shape[1]):
            (x_, y_, z_) = transf @ np.array([new_x + minimum[0], new_y + minimum[1], 1])
            if abs(z_) < 1e-12:
                continue
            (img_x, img_y) = x_ / z_, y_/z_

            if img_x >= 0 and img_x <= img.shape[0] - 1 and img_y >= 0 and img_y <= img.shape[1] - 1:
                pixel_val = interp(img, img_x, img_y)

                new_image[new_x, new_y] = pixel_val

    return new_image


def warpImageNearestNeighbor(img, H, output_shape=None, origin=None):
    return revWarpImage(img, H, interp=nn_interp, output_shape=output_shape, origin=origin)


def warpImageBilinear(img, H, output_shape=None, origin=None):
    return revWarpImage(img, H, interp=bilinear_interp, output_shape=output_shape, origin=origin)


def weight_func(img, x, y):
    """ Compute weight of pixel with respect to image center """

    cx = max((img.shape[0] - 1) / 2, 1)
    cy = max((img.shape[1] - 1) / 2, 1)

    return max(0, min(x/cx, (img.shape[0] - x - 1)/cx, y/cy, (img.shape[1] - y - 1)/cy))


def create_mosaic(imgs, homographies, warp_method=warpImageBilinear, output_shape=None, origin=None):
    """ Blend images using i-to-i+1 homographies, optionally on a fixed canvas. """

    center_index = len(imgs) // 2
    final_homographies = []

    for i in range(0, center_index + 1):
        new_H = np.eye(3)
        for i in range(i, center_index):
            new_H = homographies[i] @ new_H

        final_homographies.append(new_H)


    for i in range(center_index + 1, len(imgs)):
        new_H = np.eye(3)
        for i in range(i, center_index, -1):
            new_H = np.linalg.inv(homographies[i - 1]) @ new_H

        final_homographies.append(new_H)


    corners = []
    for i in range(len(imgs)):
        img = imgs[i]
        H_i = final_homographies[i]

        tl = np.array([0, 0, 1])
        tr = np.array([0, img.shape[1] - 1, 1])
        bl = np.array([img.shape[0] - 1, 0, 1])
        br = np.array([img.shape[0] - 1, img.shape[1] - 1, 1])

        transformed_corners = H_i @ np.stack([tl, tr, bl, br]).transpose(1, 0)
        transformed_corners = transformed_corners / transformed_corners[2:3, :]
        corners.append(transformed_corners)

    corners = np.array(corners)

    left_most = np.floor(np.min(corners[:, 1, :]))
    right_most = np.ceil(np.max(corners[:, 1, :]))
    bottom_most = np.floor(np.min(corners[:, 0, :]))
    top_most = np.ceil(np.max(corners[:, 0, :]))

    if output_shape is None:
        canvas_shape = (int(top_most - bottom_most) + 1, int(right_most - left_most) + 1)
        origin = (bottom_most, left_most)
    else:
        canvas_shape = tuple(output_shape)
        if origin is None:
            # Center a fixed canvas on the unwarped reference image.
            origin = tuple((np.array(imgs[center_index].shape[:2]) - canvas_shape) // 2)
    weighted_sum = np.zeros(canvas_shape + (3,))
    weight_sum = np.zeros(canvas_shape)

    for img, H in zip(imgs, final_homographies):
        img = sk.img_as_float(img)
        weights = np.zeros(img.shape[:2])
        for x in range(img.shape[0]):
            for y in range(img.shape[1]):
                weights[x, y] = max(weight_func(img, x, y), 1e-8)

        warped_img = warp_method(img, H, output_shape=canvas_shape, origin=origin)
        warped_weights = warp_method(weights, H, output_shape=canvas_shape, origin=origin)

        weighted_sum += warped_img * warped_weights[..., None]
        weight_sum += warped_weights

    mosaic = np.zeros_like(weighted_sum)
    mask = weight_sum > 0
    mosaic[mask] = weighted_sum[mask] / weight_sum[mask][..., None]

    return mosaic



""" Coding on the images """

# Show correspondences for Oracle Arena, Chile, and Memorial Stadium.
for title, left_name, right_name, extension in [
    ('Oracle Arena', 'oracle_left', 'oracle_right', 'jpg'),
    ('Chile', 'chile-1', 'chile-2', 'png'),
    ('Memorial Stadium', 'memorial_left', 'memorial_right', 'jpeg'),
]:
    with open(PROJECT_DIR / f'Data/correspondances/{left_name}_{right_name}.json', 'r', encoding='utf-8') as file:
        correspondances = json.load(file)

    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    for ax, image_name, points_key in zip(axes, [left_name, right_name], ['im1Points', 'im2Points']):
        image = skio.imread(PROJECT_DIR / f'Data/resized/{image_name}.{extension}')
        points = np.array(correspondances[points_key])
        ax.imshow(image)
        for i, (x, y) in enumerate(points):
            color = plt.get_cmap('tab10')(i % 10)
            ax.scatter(x, y, color=color, edgecolors='black', s=55)
            ax.annotate(str(i + 1), (x, y), xytext=(6, 6), textcoords='offset points',
                        color=color, fontsize=11, bbox=dict(facecolor='black', alpha=0.6, pad=1))
        ax.set_title(image_name)
        ax.axis('off')
    fig.suptitle(f'{title} correspondences')
    fig.tight_layout()
    fig.savefig(OUTPUT_DIR / f'{left_name}_{right_name}_correspondences.png', dpi=150, bbox_inches='tight')
    plt.close(fig)

# Rectification

for rectification_name in ['brick_building', 'giants_sunset', 'window_sunset']:
    rectification_image = sk.img_as_float(skio.imread(PROJECT_DIR / f'Data/{rectification_name}.jpeg'))

    with open(PROJECT_DIR / f'Data/correspondances/{rectification_name}_{rectification_name}.json', 'r', encoding='utf-8') as file:
        rectification_correspondances = json.load(file)

    source_points = np.array(rectification_correspondances["im1Points"], dtype=float)
    target_points = np.array(rectification_correspondances["im2Points"], dtype=float)

    target_points = np.where(target_points < target_points.mean(axis=0),
                             target_points.min(axis=0), target_points.max(axis=0))
    rectification_homography = calculate_homography(source_points[:, ::-1], target_points[:, ::-1])

    margin = 50
    target_minimum = target_points.min(axis=0)[::-1].astype(int)
    target_maximum = target_points.max(axis=0)[::-1].astype(int)
    rectification_origin = target_minimum - margin
    rectification_shape = tuple(target_maximum - target_minimum + 2 * margin + 1)

    for interpolation_name, warp_method in [('nn', warpImageNearestNeighbor), ('bilinear', warpImageBilinear)]:
        rectified_image = warp_method(rectification_image, rectification_homography,
                                      output_shape=rectification_shape, origin=rectification_origin)
        save_image(rectified_image, f'{rectification_name}_rectified_{interpolation_name}')

# Memorial Stadium

im_memorial_left = skio.imread(PROJECT_DIR / 'Data/resized/memorial_left.jpeg', as_gray=False)
im_memorial_right = skio.imread(PROJECT_DIR / 'Data/resized/memorial_right.jpeg', as_gray=False)

with open(PROJECT_DIR / 'Data/correspondances/memorial_left_memorial_right.json', 'r', encoding='utf-8') as file:
    memorial_correspondances = json.load(file)

memorial_homography = calculate_homography(np.array(memorial_correspondances["im1Points"])[:, ::-1], np.array(memorial_correspondances["im2Points"])[:, ::-1])
memorial_mosaic = create_mosaic([im_memorial_left, im_memorial_right], [memorial_homography])

save_image(memorial_mosaic, "Memorial_Mosaic")


# Chase Center

chase_images = [skio.imread(PROJECT_DIR / f'Data/resized/chase-{i}.png', as_gray=False)[..., :3]
                for i in range(1, 4)]
chase_homographies = []

for i in range(1, 3):
    with open(PROJECT_DIR / f'Data/correspondances/chase-{i}_chase-{i + 1}.json', 'r', encoding='utf-8') as file:
        chase_correspondances = json.load(file)

    chase_homographies.append(calculate_homography(
        np.array(chase_correspondances["im1Points"])[:, ::-1],
        np.array(chase_correspondances["im2Points"])[:, ::-1]))

chase_mosaic = create_mosaic(chase_images, chase_homographies)
save_image(chase_mosaic, "Chase_Mosaic")


# Chile Game

chile_images = [skio.imread(PROJECT_DIR / f'Data/resized/chile-{i}.png', as_gray=False)[..., :3]
                for i in range(1, 3)]

with open(PROJECT_DIR / 'Data/correspondances/chile-1_chile-2.json', 'r', encoding='utf-8') as file:
    chile_correspondances = json.load(file)

chile_homography = calculate_homography(
    np.array(chile_correspondances["im1Points"])[:, ::-1],
    np.array(chile_correspondances["im2Points"])[:, ::-1])
chile_mosaic = create_mosaic(chile_images, [chile_homography])
save_image(chile_mosaic, "Chile_Mosaic")


# T-Mobile

tmobile_images = [skio.imread(PROJECT_DIR / f'Data/resized/tmobile-{i}.png', as_gray=False)[..., :3]
                for i in range(1, 5)]
tmobile_homographies = []

for i in range(1, 4):
    with open(PROJECT_DIR / f'Data/correspondances/tmobile-{i}_tmobile-{i + 1}.json', 'r', encoding='utf-8') as file:
        tmobile_correspondances = json.load(file)

    tmobile_homographies.append(calculate_homography(
        np.array(tmobile_correspondances["im1Points"])[:, ::-1],
        np.array(tmobile_correspondances["im2Points"])[:, ::-1]))

tmobile_mosaic = create_mosaic(tmobile_images, tmobile_homographies)
save_image(tmobile_mosaic, "TMobile_Mosaic")


# Giants

giants_images = [skio.imread(PROJECT_DIR / f'Data/resized/giants-{i}.png', as_gray=False)[..., :3]
                for i in range(1, 4)]
giants_homographies = []

for i in range(1, 3):
    with open(PROJECT_DIR / f'Data/correspondances/giants-{i}_giants-{i + 1}.json', 'r', encoding='utf-8') as file:
        giants_correspondances = json.load(file)

    giants_homographies.append(calculate_homography(
        np.array(giants_correspondances["im1Points"])[:, ::-1],
        np.array(giants_correspondances["im2Points"])[:, ::-1]))

giants_mosaic = create_mosaic(giants_images, giants_homographies)
save_image(giants_mosaic, "Giants_Mosaic")


# Oracle

im_oracle_left = skio.imread(PROJECT_DIR / 'Data/resized/oracle_left.jpg', as_gray=False)
im_oracle_right = skio.imread(PROJECT_DIR / 'Data/resized/oracle_right.jpg', as_gray=False)

with open(PROJECT_DIR / 'Data/correspondances/oracle_left_oracle_right.json', 'r', encoding='utf-8') as file:
    oracle_correspondances = json.load(file)

oracle_homography = calculate_homography(
    np.array(oracle_correspondances["im1Points"])[:, ::-1],
    np.array(oracle_correspondances["im2Points"])[:, ::-1])
oracle_mosaic = create_mosaic([im_oracle_left, im_oracle_right], [oracle_homography])
save_image(oracle_mosaic, "Oracle_Mosaic")


# Colombia

colombia_images = [skio.imread(PROJECT_DIR / f'Data/resized/colombia-{i}.png', as_gray=False)[..., :3]
                   for i in range(1, 6)]
colombia_homographies = []

for i in range(1, 5):
    with open(PROJECT_DIR / f'Data/correspondances/colombia-{i}_colombia-{i + 1}.json', 'r', encoding='utf-8') as file:
        colombia_correspondances = json.load(file)

    colombia_homographies.append(calculate_homography(
        np.array(colombia_correspondances["im1Points"])[:, ::-1],
        np.array(colombia_correspondances["im2Points"])[:, ::-1]))

# Limit the canvas while trying the unstable homographies; distant regions are cropped.
colombia_mosaic = create_mosaic(colombia_images, colombia_homographies, output_shape=(1200, 1620))
save_image(colombia_mosaic, "Colombia_Mosaic")


# Salesforce

salesforce_images = [skio.imread(PROJECT_DIR / f'Data/resized/salesforce-{i}.png', as_gray=False)[..., :3]
                   for i in range(1, 6)]
salesforce_homographies = []

for i in range(1, 5):
    with open(PROJECT_DIR / f'Data/correspondances/salesforce-{i}_salesforce-{i + 1}.json', 'r', encoding='utf-8') as file:
        salesforce_correspondances = json.load(file)

    salesforce_homographies.append(calculate_homography(
        np.array(salesforce_correspondances["im1Points"])[:, ::-1],
        np.array(salesforce_correspondances["im2Points"])[:, ::-1]))

salesforce_mosaic = create_mosaic(salesforce_images, salesforce_homographies)
save_image(salesforce_mosaic, "Salesforce_Mosaic")


# USA

usa_images = [skio.imread(PROJECT_DIR / f'Data/resized/usa-{i}.png', as_gray=False)[..., :3]
                   for i in range(1, 7)]
usa_homographies = []

for i in range(1, 6):
    with open(PROJECT_DIR / f'Data/correspondances/usa-{i}_usa-{i + 1}.json', 'r', encoding='utf-8') as file:
        usa_correspondances = json.load(file)

    usa_homographies.append(calculate_homography(
        np.array(usa_correspondances["im1Points"])[:, ::-1],
        np.array(usa_correspondances["im2Points"])[:, ::-1]))

usa_mosaic = create_mosaic(usa_images, usa_homographies)
save_image(usa_mosaic, "USA_Mosaic")

