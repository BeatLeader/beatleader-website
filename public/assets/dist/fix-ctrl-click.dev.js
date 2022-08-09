"use strict";

!function () {
  var ctrlPressState = false;
  window.addEventListener("keydown", function (e) {
    if (e.key === "Control") ctrlPressState = true;
  });
  window.addEventListener("keyup", function (e) {
    if (e.key === "Control") ctrlPressState = false;
  });

  function openInBackground(url) {
    var a = document.createElement("a");
    a.href = url;
    var evt = document.createEvent("MouseEvents");
    evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, true, false, false, false, 0, null);
    a.dispatchEvent(evt);
  }

  window.addEventListener("load", function () {
    window.history.pushState = function () {
      var _window$history;

      if (ctrlPressState) openInBackground(arguments.length <= 2 ? undefined : arguments[2]); else (_window$history = window.history).replaceState.apply(_window$history, arguments);
    };
  });
}();