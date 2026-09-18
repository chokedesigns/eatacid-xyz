import '../../shared/public-first-paint.js';
import '../../shared/beacon-setup.js';

const images = document.querySelectorAll('.utility-card-image');

images.forEach((image) => {
  const card = image.closest('.utility-card');
  const spinner = card?.querySelector('.loading-spinner-holder');

  if (!spinner) return;

  const finishLoading = (loaded) => {
    spinner.style.display = 'none';

    if (loaded) image.style.opacity = '1';
  };

  image.addEventListener('load', () => finishLoading(true), { once: true });
  image.addEventListener('error', () => finishLoading(false), { once: true });

  if (image.complete) finishLoading(image.naturalWidth > 0);
});
