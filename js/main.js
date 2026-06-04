try {
	sessionStorage.setItem("colorbowlLogoIntroSeen", "1");
} catch (error) {}

//Check to see if the window is top if not then display button
$(window).scroll(function(){
	if ($(this).scrollTop() >200 ){
		$('#to_top').fadeIn();
	} else {
		$('#to_top').fadeOut();
	}
});

//Click event to scroll to top
$('.to_top').click(function(){
	$('html, body').animate({'scrollTop':0}, 1500, 'easeInOutExpo');
	return false;
});


//
$(".list_before.account li:empty").hide();

// img加alt
$(document).ready(function(){$("img").each(function(){let t=$(this).attr("alt");var a=companyData;t&&""!==t.trim()||$(this).attr("alt",a)})});

// 浮動
$(document).ready(function () {
  
  let ww = $(window).width();

  if (ww < 768) {
    fixLinksClick();
  } else {
    fixLinksClick();
    fixLinksHover();
  }

  function fixLinksClick() {
    $('.linksBtn').click(function() {
      var $infoLinks = $(this).siblings('.info_fix_links');
      if ($infoLinks.hasClass('linkBox_Open')) {
        hideMenu($(this))
      } else {
        var $infoLinks = $(this).siblings('.info_fix_links');
        $infoLinks.show().addClass('linkBox_Open');
      }
    });
  }
  
  function fixLinksHover() {
    $('.info_fix').hover(
      function() {
        var $infoLinks = $(this).children('.info_fix_links');
        $infoLinks.show().addClass('linkBox_Open');
      },
      function() {
        hideMenu($(this).children('.linksBtn'))
      }
    );
  }
  
  function hideMenu(element) {
    element.siblings('.info_fix_links').hide().removeClass('linkBox_Open');
  }

})

document.documentElement.lang = "zh-hant";


// 產品和影片menu
$(document).ready(function(){
  function toggleDisplayBasedOnWidth() {
    let ww = $(window).width();
    
    if (ww < 769) {
      
      $('a.pd_menu_toggle, a.vd_menu_toggle').off('click').on('click', function(event){
        event.preventDefault();
        let ulElement = $(this).parent('h5').next('ul');
        $(this).parent('h5').toggleClass('openNext');
        ulElement.slideToggle().toggleClass('opMenu');
        
        if (ulElement.css('display') === 'block') {
          ulElement.css({
            'display': 'grid',
          });
        }
      });
    } else {
      // 大於等於 769px 時的設定
      $('.product-layer-two, .video-layer-two').show().removeAttr('style');
      $('h5').removeClass('openNext');
      $('ul.opMenu').removeAttr('style').removeClass('opMenu');
    }
  }

  toggleDisplayBasedOnWidth();

  let resizeTimeout;
  $(window).resize(function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(toggleDisplayBasedOnWidth, 300);
  });
})

// anchor fix
$(document).ready(function() {
  var scrollOffset = $('.main_header_area').height();
  
  $(window).on('scroll', function() {
    var scrollTop = $(window).scrollTop();

    $('.edit *[id]').each(function() {
      var anchorTop = $(this).offset().top - scrollOffset;
      var anchorBottom = anchorTop + $(this).next().outerHeight();

      if (scrollTop >= anchorTop && scrollTop < anchorBottom) {
        var currentId = $(this).attr('id');
        
        $('.anchorList a').removeClass('active');
        
        $('.anchorList a[href="#' + currentId + '"]').addClass('active');
      }
    });
  });

  $('.anchorList a').on('click', function(e) {
    var targetIdName = $(this).attr('href').split('#')[1];
    var targetId = `#${targetIdName}`;
    var targetOffset = $(targetId).offset().top - scrollOffset - 20;
    
    if ($(window).scrollTop() !== targetOffset) {
      $('html, body').animate({
        scrollTop: targetOffset
      }, 600);
    }
  });
  
  if (window.location.hash) {
    var targetIdName = window.location.hash.split('#')[1];
    var targetId = `#${targetIdName}`;
    var targetOffset = $(targetId).offset().top - scrollOffset - 20;
    
    $('html, body').animate({
      scrollTop: targetOffset
    }, 600);
  }
	const sendShopForm = document.getElementById("send_shop_form");
   if(sendShopForm){
	  document.getElementById("send_shop_form").addEventListener("click", function() {
		  event.preventDefault();
		  const proNumElements = document.querySelectorAll("[id^='pro_num_']");
		  let send_ok = true;
		  proNumElements.forEach(element => {
			if (element.value === "0" || element.value === "") {
				send_ok=false;
			}
		  });
		  if(!send_ok){
			  alert("很抱歉，商品數量不能為0或空，請檢查下訂之商品數量，若無庫存請將商品移除");
			  return false;
		  }else{
			  window.location="shop_form.php";
			  return false;
		  }
	  });
   }
});


//# sourceURL=main.js
