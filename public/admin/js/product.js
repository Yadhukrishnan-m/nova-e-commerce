


document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('productForm'); 

    form.addEventListener('submit', function(event) {
        let valid = true;
       
        // Clear all previous error messages
        document.getElementById('nameError').textContent = '';
        document.getElementById('descriptionError').textContent = '';
        document.getElementById('mrpError').textContent = '';
        document.getElementById('offerPriceError').textContent = '';
        document.getElementById('stockError').textContent = '';
        // document.getElementById('imageError').textContent = '';  

        // Get form values
        const name = document.getElementById('productName').value.trim();
        const mrp = document.getElementById('mrp').value.trim();
        const offerPrice = document.getElementById('offerPrice').value.trim();
        const stock = document.getElementById('stock').value.trim();
        // const files = document.getElementById('productImages').files;

        // Validate product name
        if (!/^[A-Za-z]/.test(name)) {
            document.getElementById('nameError').textContent = 'Product name must start with a letter.';
            valid = false;
        }

        // Validate MRP 
        if (!/^[+]?([0-9]*[.])?[0-9]+$/.test(mrp)) {
            document.getElementById('mrpError').textContent = 'MRP must be a positive number .';
            valid = false;
        }

        // Validate Offer Price 
        if (!/^[+]?([0-9]*[.])?[0-9]+$/.test(offerPrice)) {
            document.getElementById('offerPriceError').textContent = 'Offer price must be a positive number.';
            valid = false;
        }

        // Validate Stock 
        if (!/^[0-9]\d*$/.test(stock)) {
            document.getElementById('stockError').textContent = 'Stock must be a positive integer.';
            valid = false;
        }

       

        // If the form is valid, allow it to submit; otherwise, prevent submission
      
            if (!valid) {
                event.preventDefault();
            }
  

    });
});
