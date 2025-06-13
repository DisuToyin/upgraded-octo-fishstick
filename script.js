
document.addEventListener("DOMContentLoaded", async function () {
    console.log("test...")
    const rayyanInstance = new RayyanJS.RayyanJsClient();
        rayyanInstance.initialize().then((response) => {
        console.log({response})
        const outputElement = document.getElementById("jsonOutput");
        outputElement.textContent = JSON.stringify(response, null, 2);
    });

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginBtn = document.getElementById("loginBtn");
    const responseBox = document.getElementById("loginResponseBox");

    function toggleButtonState() {
        const emailFilled = emailInput.value.trim() !== "";
        const passwordFilled = passwordInput.value.trim() !== "";
        loginBtn.disabled = !(emailFilled && passwordFilled);
    }

    emailInput.addEventListener("input", toggleButtonState);
    passwordInput.addEventListener("input", toggleButtonState);

    window.handleLogin = function (event) {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        const dummyJson = {
        email: email,
        password: password,
        };

        responseBox.innerText = JSON.stringify(dummyJson, null, 2);
        responseBox.classList.remove("hidden");
    };

});


