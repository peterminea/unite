function randomColor() {
    return '#' + ('000000' + (Math.random() * 0xFFFFFF << 0).toString(16)).slice(-6)
}

function setBodyBackground() {
    document.body.style.backgroundColor = randomColor();
    setTimeout(setBodyBackground, 2000);
}

setBodyBackground();