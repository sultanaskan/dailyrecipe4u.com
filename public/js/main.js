// src/public/js/main.js
const swiper = new Swiper('.featured-slider', {
  slidesPerView: 1,
  spaceBetween: 30,
  loop: true,
  autoplay: { delay: 3000 },
  pagination: { el: '.swiper-pagination', clickable: true },
});

document.addEventListener('DOMContentLoaded', () => {
    const swiper = new Swiper('.featured-swiper', {
        loop: true,
        autoplay: {
            delay: 4000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        breakpoints: {
            // when window width is >= 320px
            320: { slidesPerView: 1 },
            // when window width is >= 1024px
            1024: { slidesPerView: 2, spaceBetween: 20 }
        }
    });
});