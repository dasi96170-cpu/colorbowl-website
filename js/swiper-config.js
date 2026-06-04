document.addEventListener('DOMContentLoaded', function() {
    // 1. 偵測頁面中是否存在我們產生的 entranceEditSwiper 結構
    const swiperContainers = document.querySelectorAll('.entranceEditSwiper');

    // 2. 如果有找到輪播圖，才執行後續的 CSS 注入與 JS 初始化
    if (swiperContainers.length > 0) {
        
        // ==========================================
        // 階段 A：動態寫入專屬 CSS (確保排版不破壞)
        // ==========================================
        const customCss = document.createElement('style');
        customCss.type = 'text/css';
        customCss.textContent = `
            .entranceEditSwiper{
                --swiper-theme-color:#666666;
                ---swiper-navigation-color:#FFFFFF;
                --swiper-navigation-size: 2em;
            }
            .entranceEditSwiper .swiper-pagination{
                position:relative;
                left:0;
                top:0;
                bottom:unset;
            }
            .entranceEditSwiper .swiper-button-next:after, 
            .entranceEditSwiper .swiper-button-prev:after{
                color:var(---swiper-navigation-color);
                text-shadow:1px 1px 2px rgba(0,0,0,.6);
            }
            .entranceEditSwiper .swiper-slide {
                height: auto;
                max-height:230px;
                display: flex;
                justify-content: center;
                align-items: stretch;
            }
            .entranceEditSwiper .swiper-slide img {
                display: block;
                // width: 100%;
                // height: 100%;
                // object-fit: cover;
            }
        `;
        // 將 style 標籤塞入 <head> 之中
        document.head.appendChild(customCss);


        // ==========================================
        // 階段 B：初始化 Swiper 實例
        // ==========================================
        swiperContainers.forEach(function(container) {
            // 針對當前這個迴圈內的容器進行初始化，確保多組輪播圖互不干擾
            new Swiper(container, {
                slidesPerView: 1,
                spaceBetween: 0,
                loop: true, 
                autoplay: {
                    delay: 3000,
                    disableOnInteraction: false,
                },
                navigation: {
                    // 只在當前的 container 裡面找按鈕
                    nextEl: container.querySelector('.swiper-button-next'),
                    prevEl: container.querySelector('.swiper-button-prev'),
                },
                pagination: {
                    // 只在當前的 container 裡面找圓點
                    el: container.querySelector('.swiper-pagination'),
                    clickable: true,
                },
                breakpoints: {
                    451: {
                        slidesPerView: 2,
                        spaceBetween: 10,
                    },
                    1201: {
                        slidesPerView: 3,
                        spaceBetween: 15,
                    },
                },
            });
        });
    }
});