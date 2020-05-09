if (location.protocol === "http:") {
  location.replace(window.location.href.replace("http:", "https:"));
}