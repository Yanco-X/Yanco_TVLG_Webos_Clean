// Wallpapers by time of day. Each band has its own photos in wallpapers/ (1920x1080, packaged so the
// TV can start without a network). Inside a band the photos take turns every ROTATE_SECONDS; each
// change crossfades two layers by opacity only, which the TV composites cheaply.
// CONFIG.wallpapers = false turns the feature off and leaves the plain black background.
(function () {
  "use strict";
  var BANDS = [
    // [name, first hour, number of photos]
    ["madrugada", 0, 8],
    ["manana", 5, 8],
    ["mediodia", 11, 8],
    ["tarde", 14, 8],
    ["noche", 18, 8],
  ];
  var ROTATE_SECONDS = 20;
  var layers = [document.getElementById("wallA"), document.getElementById("wallB")];
  var front = 0;
  var shown = null;
  var pending = null;

  if (!layers[0] || !layers[1] || (window.CONFIG && CONFIG.wallpapers === false)) return;

  function pick(now) {
    var hour = now.getHours();
    var band = BANDS[0];
    for (var i = 0; i < BANDS.length; i++) if (hour >= BANDS[i][1]) band = BANDS[i];
    var seconds = ((hour - band[1]) * 60 + now.getMinutes()) * 60 + now.getSeconds();
    var index = Math.floor(seconds / ROTATE_SECONDS) % band[2];
    return { band: band[0], src: "wallpapers/" + band[0] + "-" + (index + 1) + ".jpg" };
  }

  function update() {
    var next = pick(new Date());
    if (next.src === shown || next.src === pending) return;
    pending = next.src;
    // Decode before showing, so the crossfade never reveals a half-loaded photo.
    var img = new Image();
    img.onload = function () {
      if (pending !== next.src) return;
      var back = layers[1 - front];
      back.style.backgroundImage = "url('" + next.src + "')";
      back.style.opacity = "1";
      layers[front].style.opacity = "0";
      front = 1 - front;
      shown = next.src;
      pending = null;
      document.body.setAttribute("data-band", next.band);
    };
    img.onerror = function () {
      if (pending === next.src) pending = null;
    };
    img.src = next.src;
  }

  // The photo is shown as is: no tint from the focused app's ambient glow (see style.css).
  document.body.classList.add("has-wallpaper");
  update();
  // Cheap check (date maths only); the photo itself changes once per ROTATE_SECONDS.
  setInterval(update, 1000);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) update();
  });
})();
