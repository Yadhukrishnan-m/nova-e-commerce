function validateForm() {
    let valid = true;

    // Validate name
    const nameRegex = /^[A-Za-z][A-Za-z\s]*$/;
    const name = document.getElementById("name").value;
    if (!nameRegex.test(name)) {
        document.getElementById("nameMessage").textContent = "Invalid name: Only letters and spaces are allowed, and it must start with a letter.";
        valid = false;
        
    } else {
        document.getElementById("nameMessage").textContent = "";
    }

    // Validate email
    const emailRegex = /^[A-Za-z0-9._]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const email = document.getElementById("email").value;
    if (!emailRegex.test(email)) {
        document.getElementById("emailMessage").textContent = "Invalid email format.";
        valid = false;
    } else {
        document.getElementById("emailMessage").textContent = "";
    }

    // Validate password matching
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{4,}.*$/;

    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!passwordRegex.test(password)) {
        document.getElementById('passwordMessage').textContent = 'Password must be at least 4 characters long and contain both letters and numbers.';
        valid = false;
    } else if (password !== confirmPassword) {
        document.getElementById("passwordMessage").textContent = "Passwords do not match.";
        valid = false;
    } else {
        document.getElementById("passwordMessage").textContent = "";
    }

    // Prevent form submission if validation fails
    return valid;
}
