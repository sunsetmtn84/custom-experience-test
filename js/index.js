
window.FuiszPlayerLayout = function(player) {
  console.log("the player is ");
  console.log(player);
  this.initialize = function() {
    console.log("in initialize mnethoid");
  }
/*  var CLICK,
      INDIC_Y_THRESH,
      ACTIVE = 'active';

  var $cont =           $('#template_container'),
      $splash =         $cont.find('.splash-screen'),
      $cardsLayer =     $cont.find('.cards-layer'),
      $cardsScrim =     $cont.find('.cards-scrim'),
      $indicsLayer =    $cont.find('.indicators-layer'),
      $navLeft =        $cont.find('.nav-left'),
      $navRight =       $cont.find('.nav-right'),
      $statusBar =      $cont.find('.status-bar');


  var fbEvents,
      numCards,
      styleId;    //hacky way of getting a bunch of walmart and ms surface styles in here quickly

  // things that concern only Surface
  var $msHalo,
      haloEvents,
      statusEvents;

  this.init = function() {
    // required stub
    CLICK = player.isMobile() ? 'touchstart' : 'click';
    styleId = $cont.data('styleId');
    numCards = $cardsLayer.find('.card').length;

    if(styleId == 'surface') {
      $msHalo = $cont.find('.ms-surface-halo');
    }
  };


  // Player Events
  player.on('playerReady', function(data) {
    INDIC_Y_THRESH = $splash.height() - 80; // player controls - half indic size

    // Facebook (client) requested extra events
    fbEvents = [
      {
        time: 30,
        event: 'viewAt30sec'
      },
      {
        time: 15,
        event: 'viewAt15sec'
      },
      {
        time: 3,
        event: 'viewAt3sec'
      }
    ];
    // calculate the final one, view at 95%
    var time95 = player.duration * 0.95;
    fbEvents.push({
      time: time95,
      event: 'view95percent'
    });
    // make sure array is still sorted on 'time'
    fbEvents = _.sortBy(fbEvents, 'time').reverse();

    if(styleId === 'surface') {
      // for MS Surface, times at which to trigger the halo effect
      haloEvents = [
        {
          time: 3.5,
          event: 'animate-out',
        }, {
          time: 1,
          event: 'animate-in'
        }
      ];

      statusEvents = [
        {
          time: 4,
          event: 'hide'
        },
        {
          time: 7,
          event: 'show'
        },
        {
          time: 8.6,
          event: 'hide'
        },
        {
          time: 11,
          event: 'show'
        },
        {
          time: 13.2,
          event: 'hide'
        },
        {
          time: 16.5,
          event: 'show'
        },
        {
          time: 19,
          event: 'hide'
        },
        {
          time: 21,
          event: 'show'
        },
        {
          time: 22,
          event: 'hide'
        },
        {
          time: 23.5,
          event: 'show'
        },
        {
          time: 25,
          event: 'hide'
        }
      ];
      //d'oh, descending.
      statusEvents.reverse();
    }

    $splash.on(CLICK, function() {
      console.log("in splash screen click");
      $splash.removeClass('show-splash');
      player.play();
    });

    $cardsScrim.on(CLICK, handleCardCloseClick);

    $cardsLayer.find('.card .btn-close').on(CLICK, handleCardCloseClick);
    $cardsLayer.find('.card-cta').on(CLICK, handleCardCtaClick);
    $cardsLayer.find('.card-image').on(CLICK, handleCardCtaClick);

    $("#comparison.show-tooltip").on(CLICK, function(){
      $(this).removeClass("show-tooltip");
    });

    $navLeft.on(CLICK, handleNavClick);
    $navRight.on(CLICK, handleNavClick);

    // TODO: figure out the real issue here
    // try to fix VideoJS missing clicks on the video
    var $video = $('.fuisz-player video');
    $video.on(CLICK, function(e) {
      player.trigger('videoClicked', {currentTime: player.getCurrentTime()});
    });
  });

  // Redraw indicators on resize
  player.on('resize',function(data){
    clearIndicators();
    if (player.paused){
      drawIndicators();
    }
  });

  player.on('play', function(data) {
    clearIndicators();
  });

  player.on('pause', function(data) {
    drawIndicators();
  });

  player.on('videoClicked', function(data) {
    if(!isModalOpen() && data.currentTime > 0) {
      player.paused ? player.play() : player.pause();
    }
  });

  player.on('clickItem', function(data) {
    player.pause();
    switch(data.item.attributes.content_type) {
      case 'link':
        player.clickThrough(data.item.attributes.link_out_url, data.item)
      break;
      case 'card':
      default:
        showCard(data.item.item_id);
    }
  });

  player.on('timeupdate', function(data) {
    // special request time events
    //  events are sorted on time so we can just check the last one then pop it if
    //  we've reached that time.
    if(fbEvents && fbEvents.length && data.currentTime >= fbEvents[fbEvents.length-1].time) {
      // dispatch this facebook event ...
      analytics.track(fbEvents.pop().event);
    }

    // VFX for Surface
    if(!isPortrait()) {
      // only give landscape mobile users the nice VFX. portrait video viewers are ridiculous.
      var evt;

      if(haloEvents && haloEvents.length && data.currentTime >= haloEvents[haloEvents.length-1].time) {
        if($msHalo) {
          evt = haloEvents.pop().event;
          $msHalo.addClass(evt);
          //special setup where it'll change color when the halo's swoops in
        }
      }

      if(statusEvents && statusEvents.length && data.currentTime >= statusEvents[statusEvents.length-1].time) {
        evt = statusEvents.pop().event;
        // hide or show
      }
    }
  });

  player.on('complete', function(data) {
  });


  function isPortrait() {
    var info = player.getVideoInfo();
    var w = info.width;
    var h = info.height;
    return (h > w);
  }

  function handleScrimClick() {
    hideCards();
    player.play();
  }

  function handleCardCloseClick(e) {
    e.preventDefault();
    e.stopPropagation();
    hideCards();
    player.play();
  }

  function handleNavClick(e) {
    var $btn = $(e.currentTarget);
    $btn.hasClass('nav-left') ? cardNavLeft(): cardNavRight();
  }

  function handleCardCtaClick(e) {
    var $btn = $(e.currentTarget);
    // TODO: get the item object and send to clickThrough(). Low priority.
    if($btn.data('href')) {
      player.clickThrough($btn.data('href'))
    }
  }

  function cardNavRight() {
    trackInteraction('cardNavRight');

    var $curCard = $cardsLayer.find('.card.active');
    var curIndex = $curCard.index('.card');

    var nextIndex = curIndex === numCards-1 ? 0 : curIndex + 1;
    var $nextCard = $cardsLayer.find('.card:eq('+nextIndex+')');

    $curCard.addClass('stage-left');
    $nextCard.addClass('stage-right');

    _.delay(function() {
      $curCard.removeClass('active');
      $nextCard.addClass('active');
    }, 150);
    _.delay(function() {
      $curCard.removeClass('stage-left');
      $nextCard.removeClass('stage-right');
    }, 350);
  }

  function cardNavLeft() {
    trackInteraction('cardNavLeft');

    var $curCard = $cardsLayer.find('.card.active');
    var curIndex = $curCard.index('.card');

    var nextIndex = curIndex === 0 ? numCards-1 : curIndex - 1;
    var $nextCard = $cardsLayer.find('.card:eq('+nextIndex+')');

    $curCard.addClass('stage-right');
    $nextCard.addClass('stage-left');

    _.delay(function() {
      $curCard.removeClass('active');
      $nextCard.addClass('active');
    }, 150);
    _.delay(function() {
      $curCard.removeClass('stage-right');
      $nextCard.removeClass('stage-left');
    }, 350);
  }


  function drawIndicators() {
    var tags = player.getCurrentAnnotations();
    if(!tags || tags.length < 1) return;

    var $indic,
        len = tags.length,
        i = 0,
        obj,
        x, y, w, h;

    for(i=0; i<len; i++) {
      var obj = tags[i];

      $indic = $($('#'+styleId+'_indicator_template').html());

      x = obj.coordinates[0];
      y = obj.coordinates[1];
      w = obj.coordinates[2];
      h = obj.coordinates[3];

      //centered
      x += (w/2) - 20;
      y += (h/2) - 20;
      y = y > INDIC_Y_THRESH ? INDIC_Y_THRESH : y;

      $indic.offset({
        left: x,
        top:  y
      });

      $indicsLayer.append($indic);
    }

    _.delay(function() {
      $indicsLayer.find('.indicator').addClass(ACTIVE);
    }, 50)
  }

  function clearIndicators() {
    $indicsLayer.html('');
  }

  function showCard(itemId) {
    $cardsLayer.addClass(ACTIVE);
    $cardsLayer.find('.card').removeClass(ACTIVE);


    setTimeout(function(){
      $cardsLayer.find('.card[data-item-id="'+itemId+'"]').addClass(ACTIVE);
    },200);


    _.delay(function() {
      //pulse the next arrow
      $navRight
        .find('.arrow')
        .removeClass('double-pulse')
        .addClass('double-pulse');
    }, 500);
  }

  function isModalOpen() {
    return $cardsLayer.hasClass(ACTIVE);
  }

  function hideCards() {
    $cardsLayer
      .removeClass(ACTIVE)
      .find('.card')
      .removeClass(ACTIVE);
  }

  function trackInteraction(customEventName) {
    player.track('interaction', {
      action: customEventName
    });
  } */
};

/*console.log("In old studio");
console.log("Old studio config object", window.player);

var player = new window.FuiszPlayer(window.player);
var ui = new FuiszPlayerLayout(player);
ui.init();
player.initialize();


window.player = player;*/
