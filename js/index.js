
window.FuiszPlayerLayout = function(player) {
  this.initialize = function() {
    console.log("**The video is initialized**");
  }
};

$(function() {
    var GilletteMobileCards = function(player) {
      var CLICK,
          INDIC_Y_THRESH,
          ACTIVE = 'active';

      var $cont =           $('#template_container'),
          $splash =         $cont.find('.splash-screen'),
          $cardsLayer =     $cont.find('.cards-layer'),
          $cardsScrim =     $cont.find('.cards-scrim'),
          $indicsLayer =    $cont.find('.indicators-layer'),
          $navLeft =        $cont.find('.nav-left'),
          $navRight =       $cont.find('.nav-right'),
          $subvideo =       $cont.find('#subvideo'),
          $statusBar =      $cont.find('.status-bar');

      var fbEvents,
          indicEvents,
          numCards;

      this.init = function() {
        // required stub
        console.log("The player is mobile?", player.isMobile());
        CLICK = player.isMobile() ? 'touchstart' : 'click';
        numCards = $cardsLayer.find('.card').length;
        createLayer();
      };
      function createLayer() {
      $splash.on(CLICK, function() {
        console.log("REMOVE SPLASH SCREEN");
        $splash.removeClass('show-splash');
        player.play();
      });
      // Player Events
      player.on('playerReady', function(data) {
        console.log("the player is ready");
        INDIC_Y_THRESH = $splash.height() - 80; // player controls - half indic size

        fbEvents = getFacebookAnalytics();

        // time should be descending
        var hasItemCues = player.getMetadata().ui_attributes.has_item_cues === 'true';
        indicEvents = hasItemCues ? [
          {
            time: 24,
            x: 22.8,
            y: 39.2
          },
          {
            time: 17,
            x: 56.4,
            y: 54.4
          },
          {
            time: 4,
            x: 71.7,
            y: 45.5
          },
          {
            time: 4,
            x: 29.38,
            y: 45.5
          },
        ] : [];

        $splash.on(CLICK, function() {
          console.log("REMOVE SPLASH SCREEN");
          $splash.removeClass('show-splash');
          player.play();
        });

        $cardsScrim.on(CLICK, handleCardCloseClick);

        $cardsLayer.swipe({
          swipe: function(event, direction, distance, duration, fingerCount) {
            if(direction === 'left') {
              // not a mistake. think about the left/right swipe and the direction of the nav arrow buttons.
              cardNavRight();
            } else if(direction === 'right') {
              cardNavLeft();
            }
          }
        });
        $cardsLayer.find('.card .btn-close').on(CLICK, handleCardCloseClick);
        $cardsLayer.find('.card-cta').on(CLICK, handleCardCtaClick);
        $cardsLayer.find('.card-image').on(CLICK, handleCardCtaClick);

        $("#subvideo").on(CLICK, function(){
          console.log($("#subvideo"));
          var subvideo=$(this)[0];
          if (subvideo.paused) {
            subvideo.play();
          }
          else {
            subvideo.pause();
          }
        });

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
        //statusBar.showTextHover();
        //statusBar.show();
      });

      player.on('videoClicked', function(data) {
        if(!isModalOpen() && data.currentTime > 0) {
          player.paused ? player.play() : player.pause();
          //statusBar.hide();
        }
      });

      player.on('clickItem', function(data) {
        console.log("the item is clicked");
        player.pause();
        //statusBar.hide();
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

        if(indicEvents && indicEvents.length && data.currentTime >= indicEvents[indicEvents.length-1].time) {
          var evt = indicEvents.pop();
          // convert pct values to pixels
          var info = player.getVideoInfo();
          var w = info.width;
          var h = info.height;
          var x = evt.x/100 * w;
          var y = evt.y/100 * h;
          flashIndicator(x, y);
        }
      });

      player.on('complete', function(data) {
        // reset facebook events so a replay will again trigger progress events
        fbEvents = getFacebookAnalytics();
      });


      function getFacebookAnalytics() {
        // Facebook (client) requested extra events
        var events = [
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
        events.push({
          time: time95,
          event: 'view95percent'
        });
        // make sure array is still sorted on 'time'
        events = _.sortBy(events, 'time').reverse();

        return events;
      }


      function flashIndicator(x, y) {
        var $indic = $($('#gillette_indicator_template').html());
        $indic.offset({
          left: x-16,
          top:  y-16
        });
        $indicsLayer.append($indic);

        _.delay(function() {
          $indic.fadeOut(400);
        }, 2200);
      }

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
        subvideo.pause();
        e.preventDefault();
        e.stopPropagation();
        hideCards();
        player.play();
      }

      function handleNavClick(e) {
        subvideo.pause();
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
        player.track('cardNavRight', {});

        var $curCard = $cardsLayer.find('.card.active');
        var curIndex = $curCard.index('.card');

        var nextIndex = curIndex === numCards-1 ? 0 : curIndex + 1;
        var $nextCard = $cardsLayer.find('.card:eq('+nextIndex+')');

        $curCard.removeClass('active');
        $nextCard.addClass('active');
        playSubVideoIfShown();
      }

      // der
      function cardNavLeft() {
        player.track('cardNavLeft', {});

        var $curCard = $cardsLayer.find('.card.active');
        var curIndex = $curCard.index('.card');

        var nextIndex = curIndex === 0 ? numCards-1 : curIndex - 1;
        var $nextCard = $cardsLayer.find('.card:eq('+nextIndex+')');

        $curCard.removeClass('active');
        $nextCard.addClass('active');
        playSubVideoIfShown();
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

          $indic = $($('#gillette_indicator_template').html());
          x = obj.coordinates[0];
          y = obj.coordinates[1];
          w = obj.coordinates[2];
          h = obj.coordinates[3];

          x += (w/2) - 16;
          y += (h/2) - 16;
          y = y > INDIC_Y_THRESH ? INDIC_Y_THRESH : y;

          $indic.offset({
            left: x,
            top:  y
          });

          $indicsLayer.append($indic);
        }
      }

      function clearIndicators() {
        $indicsLayer.html('');
      }

      function showCard(itemId) {
        $cardsLayer.addClass(ACTIVE);
        $cardsLayer.find('.card').removeClass(ACTIVE);
        setTimeout(function(){
          $cardsLayer.find('.card[data-item-id="'+itemId+'"]').addClass(ACTIVE);
          playSubVideoIfShown();
        },200);
        //statusBar.hide();
      }

      function playSubVideoIfShown(){
        var subvideo = $('.card.active').find('#subvideo');
        if (subvideo.length){
          subvideo[0].play();
        }
        var comparison = $('.card.active').find('#comparison');
        if (comparison.length){
          comparison.addClass('animated-bounce');
        }
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
    }
    };

    var gmc = new GilletteMobileCards(window._fuisz.player);
    gmc.init();
});
