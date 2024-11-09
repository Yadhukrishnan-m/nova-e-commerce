function validateForm(){
    let valid=true;

        const emailRegex = /^[A-Za-z0-9._]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
        const email=document.getElementById('email').value;
        if(!emailRegex.test(email)){
            document.getElementById("emailMessage").textContent = "Invalid email format.";
            valid = false;
        }else{
            document.getElementById("emailMessage").textContent = "";
        }

      

        return valid;
}