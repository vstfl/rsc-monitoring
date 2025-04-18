document.getElementById("loadingScreen").style.opacity = 1;

// Show the sign-in container immediately
document.querySelector(".sign-in-container").style.opacity = 1;

window.addEventListener("load", function () {
  setTimeout(function () {
    // Hide loading screen immediately when page is loaded
    document.getElementById("loadingScreen").style.display = "none";
    
    // Gradually increase the opacity of UI elements (but not the sign-in container)
    let uiElements = document.querySelectorAll(".ui-container.loadup, .map-container.loadup, .map-styles.loadup");
    let opacity = 0;
    const increment = 0.02; // Adjust the increment value as needed for smoother or faster transitions
    const duration = 500; // Adjust the duration for smoother or faster transitions

    // Function to increase opacity of an element
    function increaseOpacity(element) {
      return new Promise((resolve) => {
        let currentOpacity = 0;
        const intervalId = setInterval(function () {
          currentOpacity += increment;
          element.style.opacity = Math.min(currentOpacity, 1); // Ensure opacity doesn't exceed 1
          if (currentOpacity >= 1) {
            clearInterval(intervalId); // Stop increasing opacity when it reaches 1
            resolve(); // Resolve the Promise
          }
        }, duration * increment);
      });
    }

    // Execute the animation for each element sequentially
    async function animateElements() {
      for (let element of uiElements) {
        await increaseOpacity(element);
      }
    }

    // Start the animation
    animateElements();
  }, 500);
});
