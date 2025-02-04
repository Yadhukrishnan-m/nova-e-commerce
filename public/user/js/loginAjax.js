document.getElementById('loginForm').addEventListener('submit',function(x){
    x.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })  // Send the form data as json data
    })
 .then(response=>response.json())
    .then(data=>{
        if (data.success) {
            console.log('redirect here');
            window.location.href = '/'
        } else {
            document.getElementById("responseMessage").textContent=data.message;
        }
    }).catch(error=>{
        console.log(error);
        document.getElementById('responseMessage').textContent="an error occured please try later"
        
    });

});