$(function() {
  
  var html = $('html');
  // Detections
  if (!("ontouchstart" in window)) {
    html.addClass("noTouch");
  }
  if ("ontouchstart" in window) {
    html.addClass("isTouch");
  }
  if ("ontouchstart" in window) {
    html.addClass("isTouch");
  }
  if (document.documentMode || /Edge/.test(navigator.userAgent)) {
    if (navigator.appVersion.indexOf("Trident") === -1) {
      html.addClass("isEDGE");
    } else {
      html.addClass("isIE isIE11");
    }
  }
  if (navigator.appVersion.indexOf("MSIE") !== -1) {
    html.addClass("isIE");
  }
  if (
    navigator.userAgent.indexOf("Safari") != -1 &&
    navigator.userAgent.indexOf("Chrome") == -1
  ) {
    html.addClass("isSafari");
  }

  // On Screen

  $.fn.isOnScreen = function() {
    var elementTop = $(this).offset().top,
      elementBottom = elementTop + $(this).outerHeight(),
      viewportTop = $(window).scrollTop(),
      viewportBottom = viewportTop + $(window).height();
    return elementBottom > viewportTop && elementTop < viewportBottom;
  };

  function detection() {
    for (var i = 0; i < items.length; i++) {
      var el = $(items[i]);
	  var Repeat_is=items[i].getAttribute("data-detect-repeat");
      if (el.isOnScreen()) {
        el.addClass("in-view");
      } else {
		  if(Repeat_is!="N"){
			el.removeClass("in-view");
		  }
      }
    }
  }

  var items = document.querySelectorAll(
    "*[data-animate-in], *[data-detect-viewport], *[data-detect-repeat] , *[data-animate-mobile-size] , *[data-animate-mobile-in-delay]"
  ),
    waiting = false,
    w = $(window);

  w.on("resize scroll", function() {
    if (waiting) {
      return;
    }
    waiting = true;
    detection();

    setTimeout(function() {
      waiting = false;
    }, 100);
  });

  $(document).ready(function() {
    setTimeout(function() {
      detection();
    }, 500);

    for (var i = 0; i < items.length; i++) {
      var d = 0,
      el = $(items[i]);
	  var ViewSize=document.body.clientWidth;
	  if (items[i].getAttribute("data-animate-mobile-size") && ViewSize<= items[i].getAttribute("data-animate-mobile-size")) { 
	  	  if (items[i].getAttribute("data-animate-mobile-in-delay")) {
			d = items[i].getAttribute("data-animate-mobile-in-delay") / 1000 + "s";
		  } else{
		  	  if(items[i].getAttribute("data-animate-in-delay")){
				  d = items[i].getAttribute("data-animate-in-delay") / 1000 + "s";
			  }else{ 
			  	d = 0;
			  }
		  }
	  }else{
	  	  if (items[i].getAttribute("data-animate-in-delay")) {
			d = items[i].getAttribute("data-animate-in-delay") / 1000 + "s";
		  } else {
			d = 0;
		  }
	  }
	  
      el.css("transition-delay", d);
    }
  });
});
