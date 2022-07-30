!(function () {
    let ctrlPressState = false;
    window.addEventListener("keydown", (e) => {
        if (e.key === "Control") ctrlPressState = true
    })

    window.addEventListener("keyup", (e) => {
        if (e.key === "Control") ctrlPressState = false
    })

    function openInBackground(url) {
        const a = document.createElement("a");
        a.href = url;
        const evt = document.createEvent("MouseEvents");
        evt.initMouseEvent(
            "click",
            true,
            true,
            window,
            0,
            0,
            0,
            0,
            0,
            true,
            false,
            false,
            false,
            0,
            null
        );
        a.dispatchEvent(evt);
    }
    
    window.addEventListener("load",()=>{
        window.history.oldPushState = window.history.pushState;
        window.history.pushState = (...args) => {
            if (ctrlPressState) openInBackground(args[2])
            else window.history.oldPushState(...args)
        }
    })
})()