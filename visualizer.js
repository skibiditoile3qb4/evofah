
function getUserProfile() {
    try {
        const stored = localStorage.getItem('userProfile');
        if (stored) return JSON.parse(stored);
    } catch(e) {}
    return { visualizerEnabled: false };
}

const profile = getUserProfile();
if (!profile.visualizerEnabled) {
    console.log('Visualizer not purchased');
} else {
    (() => {
        "use strict";

    /************************************************************
     *  GLOBAL STATE
     ************************************************************/
    const state = {
        themes: {
            current: "neon-blue"
        },
        crosshair: {
            visible: true,
            size: 6,
            color: "#ffffff",
            borderWidth: 1,
            borderColor: "#000000"
        },
        keyboard: {
            visible: true,
            keys: ["Q", "W", "E", "A", "S", "D", "SPACE"]
        },
        mouse: {
            visible: true
        }
    };
        loadSettings();

        function saveSettings() {
    try {
        localStorage.setItem('visualizerSettings', JSON.stringify(state));
    } catch(e) {
        console.error('Failed to save visualizer settings:', e);
    }
}

function loadSettings() {
    try {
        const saved = localStorage.getItem('visualizerSettings');
        if (saved) {
            const loaded = JSON.parse(saved);
            // Merge saved settings into state
            Object.assign(state.themes, loaded.themes || {});
            Object.assign(state.crosshair, loaded.crosshair || {});
            Object.assign(state.keyboard, loaded.keyboard || {});
            Object.assign(state.mouse, loaded.mouse || {});
            return true;
        }
    } catch(e) {
        console.error('Failed to load visualizer settings:', e);
    }
    return false;
}

    /************************************************************
     *  THEME STYLES
     ************************************************************/
    const themeStyles = document.createElement("style");
    themeStyles.textContent = `
        @keyframes anim-breathing {
            0%, 100% { box-shadow: 0 0 10px #4cc9f0, 0 0 20px #4cc9f022; transform: scale(1); }
            50% { box-shadow: 0 0 25px #4cc9f0, 0 0 50px #4cc9f044; transform: scale(1.02); }
        }
        @keyframes anim-glitch {
            0%, 100% { text-shadow: 0 0 10px #ff00ff; transform: translate(0); }
            10% { text-shadow: -3px 0 #00ffff, 3px 0 #ff00ff; transform: translate(-2px, 1px); }
            20% { transform: translate(2px, -1px); filter: hue-rotate(90deg); }
        }
        @keyframes anim-pulse {
            0%, 100% { box-shadow: 0 0 15px currentColor; }
            50% { box-shadow: 0 0 30px currentColor; }
        }
        @keyframes anim-rainbow {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
        }
        @keyframes anim-wave {
            0% { border-radius: 10px; }
            25% { border-radius: 15px 10px 15px 10px; }
            50% { border-radius: 10px 15px 10px 15px; }
            75% { border-radius: 15px 10px 15px 10px; }
        }
    `;
    document.head.appendChild(themeStyles);

    const themes = {
        "neon-blue": { bg: "rgba(0,20,50,0.9)", fg: "#4cc9f0", glow: "0 0 15px #4cc9f0" },
        "cyber-purple": { bg: "rgba(20,0,40,0.9)", fg: "#c77dff", glow: "0 0 15px #c77dff" },
        "toxic-green": { bg: "rgba(0,40,0,0.9)", fg: "#70ff70", glow: "0 0 15px #70ff70" },
        "blood-red": { bg: "rgba(40,0,0,0.9)", fg: "#ff4d4d", glow: "0 0 15px #ff4d4d" },
        "elegant-gold": { bg: "rgba(20,20,25,0.95)", fg: "#ffd700", glow: "0 0 20px #ffd700" },
        "ocean": { bg: "rgba(0,20,40,0.9)", fg: "#00b4d8", glow: "0 0 20px #00b4d8" },
        "breathing": { bg: "rgba(0,20,50,0.9)", fg: "#4cc9f0", anim: "anim-breathing 4s", animated: true },
        "glitch": { bg: "rgba(10,0,20,0.95)", fg: "#ff00ff", anim: "anim-glitch 2s", animated: true },
        "pulse": { bg: "rgba(20,0,40,0.9)", fg: "#c77dff", anim: "anim-pulse 2s", animated: true },
        "rainbow": { bg: "rgba(15,15,20,0.95)", fg: "#ff6b6b", anim: "anim-rainbow 5s", animated: true },
        "wave": { bg: "rgba(0,20,40,0.9)", fg: "#00b4d8", anim: "anim-wave 4s", animated: true }
    };

    function applyTheme(panel) {
        const t = themes[state.themes.current];
        panel.style.background = t.bg;
        panel.style.color = t.fg;
        panel.style.boxShadow = t.glow || "0 0 15px currentColor";
        
        if (t.animated) {
            panel.style.animation = `${t.anim} infinite ease-in-out`;
        } else {
            panel.style.animation = "";
        }
    }

    /************************************************************
     *  UI HELPERS
     ************************************************************/
    function createPanel(title = "") {
        const panel = document.createElement("div");
        panel.style.position = "fixed";
        panel.style.left = "20px";
        panel.style.top = "20px";
        panel.style.background = "rgba(0,0,0,0.7)";
        panel.style.color = "white";
        panel.style.padding = "15px";
        panel.style.borderRadius = "10px";
        panel.style.backdropFilter = "blur(10px)";
        panel.style.userSelect = "none";
        panel.style.zIndex = "99999999";
        panel.style.minWidth = "250px";
        panel.style.fontFamily = "Arial";
        panel.style.display = "none";

        if (title) {
            const header = document.createElement("h2");
            header.innerText = title;
            header.style.marginTop = "0";
            header.style.fontSize = "18px";
            header.style.cursor = "move";
            panel.appendChild(header);

            let offsetX = 0, offsetY = 0, dragging = false;
            header.addEventListener("mousedown", e => {
                dragging = true;
                offsetX = e.clientX - panel.offsetLeft;
                offsetY = e.clientY - panel.offsetTop;
            });
            document.addEventListener("mousemove", e => {
                if (dragging) {
                    panel.style.left = `${e.clientX - offsetX}px`;
                    panel.style.top = `${e.clientY - offsetY}px`;
                }
            });
            document.addEventListener("mouseup", () => dragging = false);
        }

        document.body.appendChild(panel);
        return panel;
    }

    /************************************************************
     *  MAIN MENU
     ************************************************************/
    const mainMenu = createPanel("Visualizer Settings");

    // Theme selector
    const themeWrap = document.createElement("div");
    themeWrap.style.marginBottom = "15px";
    const themeLabel = document.createElement("div");
    themeLabel.innerText = "Theme:";
    themeLabel.style.marginBottom = "5px";
    themeWrap.appendChild(themeLabel);
    
    const themeSelect = document.createElement("select");
    themeSelect.style.width = "100%";
    themeSelect.style.padding = "5px";
    Object.keys(themes).forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.innerText = name;
        if (name === state.themes.current) option.selected = true;
        themeSelect.appendChild(option);
    });
    themeSelect.addEventListener("change", () => {
    state.themes.current = themeSelect.value;
    updateAllThemes();
    saveSettings();
});

    themeWrap.appendChild(themeSelect);
    mainMenu.appendChild(themeWrap);

    // Divider
    const divider1 = document.createElement("hr");
    divider1.style.border = "none";
    divider1.style.borderTop = "1px solid rgba(255,255,255,0.2)";
    divider1.style.margin = "15px 0";
    mainMenu.appendChild(divider1);

    // Crosshair settings
    const crosshairSection = document.createElement("div");
    crosshairSection.style.marginBottom = "15px";
    
    const crosshairTitle = document.createElement("div");
    crosshairTitle.innerText = "Focus Dot:";
    crosshairTitle.style.fontWeight = "bold";
    crosshairTitle.style.marginBottom = "10px";
    crosshairSection.appendChild(crosshairTitle);

    const crosshairToggle = document.createElement("label");
    const crosshairCheck = document.createElement("input");
    crosshairCheck.type = "checkbox";
    crosshairCheck.checked = state.crosshair.visible;
   crosshairCheck.addEventListener("change", () => {
    state.crosshair.visible = crosshairCheck.checked;
    updateCrosshair();
    saveSettings();
});
    crosshairToggle.appendChild(crosshairCheck);
    crosshairToggle.appendChild(document.createTextNode(" Show Focus Dot"));
    crosshairSection.appendChild(crosshairToggle);
    crosshairSection.appendChild(document.createElement("br"));

    // Size
    const sizeLabel = document.createElement("div");
    sizeLabel.innerText = "Size:";
    sizeLabel.style.marginTop = "10px";
    crosshairSection.appendChild(sizeLabel);
    const sizeSlider = document.createElement("input");
    sizeSlider.type = "range";
    sizeSlider.min = "2";
    sizeSlider.max = "30";
    sizeSlider.value = state.crosshair.size;
    sizeSlider.style.width = "100%";
    const sizeValue = document.createElement("span");
    sizeValue.innerText = " " + state.crosshair.size;
   sizeSlider.addEventListener("input", () => {
    state.crosshair.size = Number(sizeSlider.value);
    sizeValue.innerText = " " + sizeSlider.value;
    updateCrosshair();
    saveSettings();
});
    crosshairSection.appendChild(sizeSlider);
    crosshairSection.appendChild(sizeValue);

    // Color
    const colorLabel = document.createElement("div");
    colorLabel.innerText = "Color:";
    colorLabel.style.marginTop = "10px";
    crosshairSection.appendChild(colorLabel);
    const colorPicker = document.createElement("input");
    colorPicker.type = "color";
    colorPicker.value = state.crosshair.color;
    colorPicker.style.width = "50px";
    colorPicker.style.height = "30px";
colorPicker.addEventListener("input", () => {
    state.crosshair.color = colorPicker.value;
    updateCrosshair();
    saveSettings();
});
    crosshairSection.appendChild(colorPicker);

    // Border width
    const borderLabel = document.createElement("div");
    borderLabel.innerText = "Border Width:";
    borderLabel.style.marginTop = "10px";
    crosshairSection.appendChild(borderLabel);
    const borderSlider = document.createElement("input");
    borderSlider.type = "range";
    borderSlider.min = "0";
    borderSlider.max = "5";
    borderSlider.value = state.crosshair.borderWidth;
    borderSlider.style.width = "100%";
    const borderValue = document.createElement("span");
    borderValue.innerText = " " + state.crosshair.borderWidth;
    borderSlider.addEventListener("input", () => {
    state.crosshair.borderWidth = Number(borderSlider.value);
    borderValue.innerText = " " + borderSlider.value;
    updateCrosshair();
    saveSettings();
});
    crosshairSection.appendChild(borderSlider);
    crosshairSection.appendChild(borderValue);

    // Border color
    const borderColorLabel = document.createElement("div");
    borderColorLabel.innerText = "Border Color:";
    borderColorLabel.style.marginTop = "10px";
    crosshairSection.appendChild(borderColorLabel);
    const borderColorPicker = document.createElement("input");
    borderColorPicker.type = "color";
    borderColorPicker.value = state.crosshair.borderColor;
    borderColorPicker.style.width = "50px";
    borderColorPicker.style.height = "30px";
   borderColorPicker.addEventListener("input", () => {
    state.crosshair.borderColor = borderColorPicker.value;
    updateCrosshair();
    saveSettings();
});
    crosshairSection.appendChild(borderColorPicker);

    mainMenu.appendChild(crosshairSection);

    // Divider
    const divider2 = document.createElement("hr");
    divider2.style.border = "none";
    divider2.style.borderTop = "1px solid rgba(255,255,255,0.2)";
    divider2.style.margin = "15px 0";
    mainMenu.appendChild(divider2);

    // Keyboard settings
    const keyboardSection = document.createElement("div");
    keyboardSection.style.marginBottom = "15px";
    
    const keyboardTitle = document.createElement("div");
    keyboardTitle.innerText = "Keyboard:";
    keyboardTitle.style.fontWeight = "bold";
    keyboardTitle.style.marginBottom = "10px";
    keyboardSection.appendChild(keyboardTitle);

    const keyboardToggle = document.createElement("label");
    const keyboardCheck = document.createElement("input");
    keyboardCheck.type = "checkbox";
    keyboardCheck.checked = state.keyboard.visible;
   keyboardCheck.addEventListener("change", () => {
    state.keyboard.visible = keyboardCheck.checked;
    keyBox.style.display = state.keyboard.visible ? "grid" : "none";
    saveSettings();
});
    keyboardToggle.appendChild(keyboardCheck);
    keyboardToggle.appendChild(document.createTextNode(" Show Keyboard"));
    keyboardSection.appendChild(keyboardToggle);
    keyboardSection.appendChild(document.createElement("br"));

    const keysLabel = document.createElement("div");
    keysLabel.innerText = "Keys (comma separated):";
    keysLabel.style.marginTop = "10px";
    keyboardSection.appendChild(keysLabel);
    
    const keysInput = document.createElement("input");
    keysInput.type = "text";
    keysInput.value = state.keyboard.keys.join(", ");
    keysInput.style.width = "100%";
    keysInput.style.padding = "5px";
    keysInput.style.marginTop = "5px";
    keysInput.addEventListener("change", () => {
    state.keyboard.keys = keysInput.value.split(",").map(k => k.trim().toUpperCase());
    rebuildKeyboard();
    saveSettings();
});
    keyboardSection.appendChild(keysInput);

    mainMenu.appendChild(keyboardSection);

    // Divider
    const divider3 = document.createElement("hr");
    divider3.style.border = "none";
    divider3.style.borderTop = "1px solid rgba(255,255,255,0.2)";
    divider3.style.margin = "15px 0";
    mainMenu.appendChild(divider3);

    // Mouse settings
    const mouseSection = document.createElement("div");
    mouseSection.style.marginBottom = "15px";
    
    const mouseTitle = document.createElement("div");
    mouseTitle.innerText = "Mouse:";
    mouseTitle.style.fontWeight = "bold";
    mouseTitle.style.marginBottom = "10px";
    mouseSection.appendChild(mouseTitle);

    const mouseToggle = document.createElement("label");
    const mouseCheck = document.createElement("input");
    mouseCheck.type = "checkbox";
    mouseCheck.checked = state.mouse.visible;
    mouseCheck.addEventListener("change", () => {
    state.mouse.visible = mouseCheck.checked;
    mouseVisualizer.style.display = state.mouse.visible ? "block" : "none";
    saveSettings();
});;
    mouseToggle.appendChild(mouseCheck);
    mouseToggle.appendChild(document.createTextNode(" Show Mouse"));
    mouseSection.appendChild(mouseToggle);

    mainMenu.appendChild(mouseSection);
    themeSelect.value = state.themes.current;
crosshairCheck.checked = state.crosshair.visible;
sizeSlider.value = state.crosshair.size;
sizeValue.innerText = " " + state.crosshair.size;
colorPicker.value = state.crosshair.color;
borderSlider.value = state.crosshair.borderWidth;
borderValue.innerText = " " + state.crosshair.borderWidth;
borderColorPicker.value = state.crosshair.borderColor;
keyboardCheck.checked = state.keyboard.visible;
keysInput.value = state.keyboard.keys.join(", ");
mouseCheck.checked = state.mouse.visible;


    applyTheme(mainMenu);

    /************************************************************
     *  CROSSHAIR
     ************************************************************/
    const crosshairContainer = document.createElement("div");
    crosshairContainer.style.position = "fixed";
    crosshairContainer.style.top = "50%";
    crosshairContainer.style.left = "50%";
    crosshairContainer.style.transform = "translate(-50%, -50%)";
    crosshairContainer.style.pointerEvents = "none";
    crosshairContainer.style.zIndex = "100000000";
    document.body.appendChild(crosshairContainer);

    function updateCrosshair() {
        crosshairContainer.innerHTML = "";
        if (!state.crosshair.visible) return;

        const dot = document.createElement("div");
        dot.style.width = `${state.crosshair.size}px`;
        dot.style.height = `${state.crosshair.size}px`;
        dot.style.borderRadius = "50%";
        dot.style.background = state.crosshair.color;
        dot.style.border = state.crosshair.borderWidth > 0 
            ? `${state.crosshair.borderWidth}px solid ${state.crosshair.borderColor}` 
            : "none";
        crosshairContainer.appendChild(dot);
    }

    updateCrosshair();

    /************************************************************
     *  MOUSE VISUALIZER
     ************************************************************/
    const mouseVisualizer = document.createElement("div");
    mouseVisualizer.style.position = "fixed";
    mouseVisualizer.style.bottom = "20px";
    mouseVisualizer.style.left = "20px";
    mouseVisualizer.style.padding = "25px";
    mouseVisualizer.style.borderRadius = "20px";
    mouseVisualizer.style.backdropFilter = "blur(15px)";
    mouseVisualizer.style.zIndex = "99999999";
    mouseVisualizer.style.display = "block";
    mouseVisualizer.style.perspective = "500px";
    document.body.appendChild(mouseVisualizer);
    applyTheme(mouseVisualizer);

    const mouseShape = document.createElement("div");
    mouseShape.style.position = "relative";
    mouseShape.style.width = "90px";
    mouseShape.style.height = "120px";
    mouseShape.style.border = "4px solid currentColor";
    mouseShape.style.borderRadius = "40px 40px 18px 18px";
    mouseShape.style.background = "linear-gradient(180deg, rgba(60,60,60,0.6) 0%, rgba(20,20,20,0.8) 100%)";
    mouseShape.style.filter = "drop-shadow(0 8px 25px rgba(0,0,0,0.5))";
    mouseShape.style.transition = "transform 0.15s ease";
    mouseShape.style.transformStyle = "preserve-3d";
    mouseShape.style.boxShadow = "inset 0 -8px 20px rgba(0,0,0,0.4), inset 0 2px 10px rgba(255,255,255,0.1)";

    const divider = document.createElement("div");
    divider.style.position = "absolute";
    divider.style.width = "4px";
    divider.style.height = "70px";
    divider.style.background = "currentColor";
    divider.style.left = "50%";
    divider.style.marginLeft = "-2px";
    divider.style.top = "0";
    divider.style.zIndex = "10";
    divider.style.borderRadius = "0 0 2px 2px";
    divider.style.boxShadow = "0 2px 8px rgba(0,0,0,0.5)";

    const leftSide = document.createElement("div");
    leftSide.style.position = "absolute";
    leftSide.style.width = "calc(50% - 2px)";
    leftSide.style.height = "70px";
    leftSide.style.left = "0";
    leftSide.style.top = "0";
    leftSide.style.borderRadius = "38px 0 0 0";
    leftSide.style.transition = "all 0.08s ease-out";
    leftSide.style.zIndex = "5";
    leftSide.style.background = "linear-gradient(180deg, rgba(80,80,80,0.4) 0%, rgba(40,40,40,0.6) 100%)";
    leftSide.style.boxShadow = "inset 0 2px 8px rgba(255,255,255,0.15), inset 0 -4px 12px rgba(0,0,0,0.3)";
    leftSide.style.transformOrigin = "center bottom";
    leftSide.style.transform = "translateZ(8px) rotateX(-5deg)";

    const rightSide = document.createElement("div");
    rightSide.style.position = "absolute";
    rightSide.style.width = "calc(50% - 2px)";
    rightSide.style.height = "70px";
    rightSide.style.right = "0";
    rightSide.style.top = "0";
    rightSide.style.borderRadius = "0 38px 0 0";
    rightSide.style.transition = "all 0.08s ease-out";
    rightSide.style.zIndex = "5";
    rightSide.style.background = "linear-gradient(180deg, rgba(80,80,80,0.4) 0%, rgba(40,40,40,0.6) 100%)";
    rightSide.style.boxShadow = "inset 0 2px 8px rgba(255,255,255,0.15), inset 0 -4px 12px rgba(0,0,0,0.3)";
    rightSide.style.transformOrigin = "center bottom";
    rightSide.style.transform = "translateZ(8px) rotateX(-5deg)";

    const scrollWheel = document.createElement("div");
    scrollWheel.style.position = "absolute";
    scrollWheel.style.width = "20px";
    scrollWheel.style.height = "35px";
    scrollWheel.style.left = "50%";
    scrollWheel.style.transform = "translateX(-50%) translateZ(12px)";
    scrollWheel.style.top = "15px";
    scrollWheel.style.border = "3px solid currentColor";
    scrollWheel.style.borderRadius = "12px";
    scrollWheel.style.zIndex = "15";
    scrollWheel.style.background = "linear-gradient(180deg, rgba(30,30,30,0.9) 0%, rgba(10,10,10,0.95) 100%)";
    scrollWheel.style.transition = "all 0.1s ease";
    scrollWheel.style.boxShadow = "inset 0 2px 6px rgba(255,255,255,0.1), 0 4px 10px rgba(0,0,0,0.4)";

    const scrollIndicator = document.createElement("div");
    scrollIndicator.style.position = "absolute";
    scrollIndicator.style.width = "8px";
    scrollIndicator.style.height = "12px";
    scrollIndicator.style.background = "currentColor";
    scrollIndicator.style.borderRadius = "4px";
    scrollIndicator.style.left = "50%";
    scrollIndicator.style.top = "50%";
    scrollIndicator.style.transform = "translate(-50%, -50%)";
    scrollIndicator.style.transition = "all 0.15s ease";
    scrollWheel.appendChild(scrollIndicator);

    const leftLabel = document.createElement("div");
    leftLabel.innerText = "L";
    leftLabel.style.position = "absolute";
    leftLabel.style.top = "28px";
    leftLabel.style.left = "25%";
    leftLabel.style.transform = "translateX(-50%) translateZ(10px)";
    leftLabel.style.fontSize = "18px";
    leftLabel.style.fontWeight = "bold";
    leftLabel.style.zIndex = "8";
    leftLabel.style.pointerEvents = "none";
    leftLabel.style.textShadow = "0 0 8px currentColor";
    leftLabel.style.transition = "all 0.08s ease-out";
    leftLabel.style.opacity = "0.9";

    const rightLabel = document.createElement("div");
    rightLabel.innerText = "R";
    rightLabel.style.position = "absolute";
    rightLabel.style.top = "28px";
    rightLabel.style.right = "25%";
    rightLabel.style.transform = "translateX(50%) translateZ(10px)";
    rightLabel.style.fontSize = "18px";
    rightLabel.style.fontWeight = "bold";
    rightLabel.style.zIndex = "8";
    rightLabel.style.pointerEvents = "none";
    rightLabel.style.textShadow = "0 0 8px currentColor";
    rightLabel.style.transition = "all 0.08s ease-out";
    rightLabel.style.opacity = "0.9";

    mouseShape.appendChild(leftSide);
    mouseShape.appendChild(rightSide);
    mouseShape.appendChild(divider);
    mouseShape.appendChild(scrollWheel);
    mouseShape.appendChild(leftLabel);
    mouseShape.appendChild(rightLabel);
    mouseVisualizer.appendChild(mouseShape);

    document.addEventListener("mousedown", e => {
        const t = themes[state.themes.current];
        
        if (e.button === 0) {
            leftSide.style.transform = "translateZ(0px) rotateX(8deg)";
            leftSide.style.background = `linear-gradient(180deg, ${t.fg} 0%, ${t.fg}dd 100%)`;
            leftSide.style.boxShadow = "inset 0 8px 20px rgba(0,0,0,0.6)";
            leftLabel.style.transform = "translateX(-50%) translateZ(2px) scale(0.9)";
        } else if (e.button === 2) {
            rightSide.style.transform = "translateZ(0px) rotateX(8deg)";
            rightSide.style.background = `linear-gradient(180deg, ${t.fg} 0%, ${t.fg}dd 100%)`;
            rightSide.style.boxShadow = "inset 0 8px 20px rgba(0,0,0,0.6)";
            rightLabel.style.transform = "translateX(50%) translateZ(2px) scale(0.9)";
        }
    });

    document.addEventListener("mouseup", e => {
        if (e.button === 0) {
            leftSide.style.transform = "translateZ(8px) rotateX(-5deg)";
            leftSide.style.background = "linear-gradient(180deg, rgba(80,80,80,0.4) 0%, rgba(40,40,40,0.6) 100%)";
            leftSide.style.boxShadow = "inset 0 2px 8px rgba(255,255,255,0.15), inset 0 -4px 12px rgba(0,0,0,0.3)";
            leftLabel.style.transform = "translateX(-50%) translateZ(10px) scale(1)";
        } else if (e.button === 2) {
            rightSide.style.transform = "translateZ(8px) rotateX(-5deg)";
            rightSide.style.background = "linear-gradient(180deg, rgba(80,80,80,0.4) 0%, rgba(40,40,40,0.6) 100%)";
            rightSide.style.boxShadow = "inset 0 2px 8px rgba(255,255,255,0.15), inset 0 -4px 12px rgba(0,0,0,0.3)";
            rightLabel.style.transform = "translateX(50%) translateZ(10px) scale(1)";
        }
    });

    let scrollTimeout;
    document.addEventListener("wheel", e => {
        clearTimeout(scrollTimeout);
        const t = themes[state.themes.current];
        
        scrollWheel.style.transform = "translateX(-50%) translateZ(14px) scale(1.1)";
        scrollWheel.style.boxShadow = `inset 0 2px 6px rgba(255,255,255,0.2), 0 4px 15px ${t.fg}66`;
        scrollIndicator.style.top = e.deltaY < 0 ? "25%" : "75%";
        scrollIndicator.style.boxShadow = `0 0 12px ${t.fg}`;
        
        scrollTimeout = setTimeout(() => {
            scrollWheel.style.transform = "translateX(-50%) translateZ(12px) scale(1)";
            scrollWheel.style.boxShadow = "inset 0 2px 6px rgba(255,255,255,0.1), 0 4px 10px rgba(0,0,0,0.4)";
            scrollIndicator.style.top = "50%";
            scrollIndicator.style.boxShadow = "none";
        }, 180);
    });

    /************************************************************
     *  KEYBOARD VISUALIZER
     ************************************************************/
    const keyBox = document.createElement("div");
    keyBox.style.position = "fixed";
    keyBox.style.bottom = "20px";
    keyBox.style.right = "20px";
    keyBox.style.display = "grid";
    keyBox.style.gap = "12px";
    keyBox.style.padding = "20px";
    keyBox.style.borderRadius = "15px";
    keyBox.style.backdropFilter = "blur(15px)";
    keyBox.style.zIndex = "99999999";
    document.body.appendChild(keyBox);
    applyTheme(keyBox);

    const keyElements = {};

    function makeKey(k) {
        const d = document.createElement("div");
        d.style.display = "flex";
        d.style.alignItems = "center";
        d.style.justifyContent = "center";
        d.style.fontSize = "22px";
        d.style.fontWeight = "bold";
        d.style.borderRadius = "10px";
        d.style.border = "2px solid currentColor";
        d.style.transition = "all 0.15s ease";
        d.style.position = "relative";
        d.style.overflow = "hidden";
        d.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
        d.style.width = "65px";
        d.style.height = "65px";

        const overlay = document.createElement("div");
        overlay.style.position = "absolute";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.right = "0";
        overlay.style.bottom = "0";
        overlay.style.background = "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.2) 100%)";
        overlay.style.pointerEvents = "none";
        d.appendChild(overlay);

        const text = document.createElement("span");
        text.innerText = k === "SPACE" ? "" : k;
        text.style.position = "relative";
        text.style.zIndex = "1";
        d.appendChild(text);

        keyElements[k] = d;
        return d;
    }

    function rebuildKeyboard() {
        keyBox.innerHTML = "";
        Object.keys(keyElements).forEach(k => delete keyElements[k]);

        const keys = state.keyboard.keys;
        
        // Count non-space keys to determine columns
        const nonSpaceKeys = keys.filter(k => k !== "SPACE");
        const cols = Math.min(3, Math.max(1, nonSpaceKeys.length));
        keyBox.style.gridTemplateColumns = `repeat(${cols}, 65px)`;

        keys.forEach((key, i) => {
            const el = makeKey(key);
            
            if (key === "SPACE") {
                el.style.gridColumn = `1 / span ${cols}`;
                el.style.width = "auto";
            }
            
            keyBox.appendChild(el);
        });

        applyTheme(keyBox);
    }

    rebuildKeyboard();
keyBox.style.display = state.keyboard.visible ? "grid" : "none";
mouseVisualizer.style.display = state.mouse.visible ? "block" : "none";
        
    document.addEventListener("keydown", e => {
        const k = e.code.replace("Key", "").replace("Space", "SPACE");
        const el = keyElements[k];
        if (el) {
            const overlay = el.querySelector("div");
            const text = el.querySelector("span");
            
            el.style.background = "currentColor";
            el.style.transform = "scale(0.9) translateY(4px)";
            el.style.boxShadow = "0 1px 5px rgba(0,0,0,0.8), inset 0 0 25px rgba(255,255,255,0.4)";
            
            if (overlay) {
                overlay.style.opacity = "1";
                overlay.style.background = "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(0,0,0,0.2) 100%)";
            }

            if (text) {
                text.style.color = "#000";
                text.style.textShadow = "0 0 10px rgba(255,255,255,0.8)";
            }
            
            const ripple = document.createElement("div");
            ripple.style.position = "absolute";
            ripple.style.width = "100%";
            ripple.style.height = "100%";
            ripple.style.top = "0";
            ripple.style.left = "0";
            ripple.style.borderRadius = "10px";
            ripple.style.background = "radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)";
            ripple.style.animation = "ripple 0.6s ease-out";
            ripple.style.pointerEvents = "none";
            ripple.style.zIndex = "5";
            el.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        }
    });

    document.addEventListener("keyup", e => {
        const k = e.code.replace("Key", "").replace("Space", "SPACE");
        const el = keyElements[k];
        if (el) {
            const overlay = el.querySelector("div");
            const text = el.querySelector("span");
            
            el.style.background = "transparent";
            el.style.transform = "scale(1) translateY(0)";
            el.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
            
            if (overlay) {
                overlay.style.opacity = "0";
            }

            if (text) {
                text.style.color = "currentColor";
                text.style.textShadow = "none";
            }
        }
    });

    const rippleStyle = document.createElement("style");
    rippleStyle.textContent = `
        @keyframes ripple {
            0% { transform: scale(0); opacity: 1; }
            100% { transform: scale(2); opacity: 0; }
        }
    `;
    document.head.appendChild(rippleStyle);

    /************************************************************
     *  UPDATE ALL THEMES
     ************************************************************/
    function updateAllThemes() {
        applyTheme(mainMenu);
        applyTheme(mouseVisualizer);
        applyTheme(keyBox);
    }

    /************************************************************
     *  INFO BUTTON & HOTKEY
     ************************************************************/
    const infoButton = document.createElement("div");
    infoButton.innerText = "i";
    infoButton.style.position = "fixed";
    infoButton.style.top = "20px";
    infoButton.style.right = "20px";
    infoButton.style.width = "30px";
    infoButton.style.height = "30px";
    infoButton.style.borderRadius = "50%";
    infoButton.style.background = "rgba(255,255,255,0.2)";
    infoButton.style.color = "white";
    infoButton.style.display = "flex";
    infoButton.style.alignItems = "center";
    infoButton.style.justifyContent = "center";
    infoButton.style.fontSize = "18px";
    infoButton.style.fontWeight = "bold";
    infoButton.style.cursor = "pointer";
    infoButton.style.zIndex = "100000000";
    infoButton.style.fontFamily = "Arial";
    document.body.appendChild(infoButton);

    const infoTooltip = document.createElement("div");
    infoTooltip.innerHTML = `<b>Press ] to open settings</b>`;
    infoTooltip.style.position = "fixed";
    infoTooltip.style.top = "60px";
    infoTooltip.style.right = "20px";
    infoTooltip.style.padding = "10px 15px";
    infoTooltip.style.borderRadius = "10px";
    infoTooltip.style.background = "rgba(0,0,0,0.9)";
    infoTooltip.style.color = "white";
    infoTooltip.style.fontSize = "14px";
    infoTooltip.style.zIndex = "100000000";
    infoTooltip.style.display = "none";
    infoTooltip.style.fontFamily = "Arial";
    document.body.appendChild(infoTooltip);

    infoButton.addEventListener("mouseenter", () => {
        infoTooltip.style.display = "block";
    });

    infoButton.addEventListener("mouseleave", () => {
        infoTooltip.style.display = "none";
    });

document.addEventListener("keydown", e => {
    if (e.key === "]") {
        mainMenu.style.display =
            mainMenu.style.display === "none" ? "block" : "none";
    }
});

})(); 
} 
