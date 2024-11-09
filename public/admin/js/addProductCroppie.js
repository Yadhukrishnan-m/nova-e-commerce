





document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('productForm');
    const upload = document.querySelector("#productImages");
    const imgContainer = document.querySelector('#croppieContainer');
    let croppieInstances = []; // To store Croppie instances

    // Handle file upload and create Croppie instances
    upload.addEventListener('change', function (e) {
        const files = e.target.files;
        imgContainer.innerHTML = ''; // Clear the container
        croppieInstances = []; // Clear previous instances

        Array.from(files).forEach((file, index) => {
            const reader = new FileReader();
            const croppieDiv = document.createElement('div');
            croppieDiv.id = `croppieInstance_${index}`;
            imgContainer.appendChild(croppieDiv); // Create a container for each image

            reader.onload = function (event) {
                const croppieInstance = new Croppie(croppieDiv, {
                    viewport: { width: 400, height: 550, type: 'square' },
                    boundary: { width:450, height: 600 },
                    enableResize: true
                });
                croppieInstance.bind({
                    url: event.target.result
                });
                croppieInstances.push({ instance: croppieInstance, file }); // Store Croppie instance and file
            };
            reader.readAsDataURL(file);
        });
    });

    // Form validation and image cropping
    form.addEventListener('submit', function (event) {
        let valid = true;

        // Clear all previous error messages
        document.getElementById('nameError').textContent = '';
        document.getElementById('descriptionError').textContent = '';
        document.getElementById('mrpError').textContent = '';
        document.getElementById('offerPriceError').textContent = '';
        document.getElementById('stockError').textContent = '';
        document.getElementById('imageError').textContent = '';
        document.getElementById('descriptionError').textContent = '';


        // Get form values
        const name = document.getElementById('productName').value.trim();
        const mrp = document.getElementById('mrp').value.trim();
        const offerPrice = document.getElementById('offerPrice').value.trim();
        // const stock = document.getElementById('stock').value.trim();
        const files = document.getElementById('productImages').files;
        const stockS = document.getElementById('stock_s').value.trim();
        const stockM = document.getElementById('stock_m').value.trim();
        const stockL = document.getElementById('stock_l').value.trim();
        const stockXL = document.getElementById('stock_xl').value.trim();
        const stockXXL = document.getElementById('stock_xxl').value.trim();

        // Validate product name
        if (!/^[A-Za-z]/.test(name)) {
            document.getElementById('nameError').textContent = 'Product name must start with a letter.';
            valid = false;
        }

        // if (!/^[A-Za-z]/.test(description)) {
        //     document.getElementById('descriptionError').textContent = 'description name must start with a letter.';
        //     valid = false;
        // }

        // Validate MRP 
        if (!/^[+]?([0-9]*[.])?[0-9]+$/.test(mrp)) {
            document.getElementById('mrpError').textContent = 'MRP must be a positive number.';
            valid = false;
        }

        // Validate Offer Price 
        if (!/^(100|[1-9]?\d)(\.\d{1,2})?$/.test(offerPrice)) {
            document.getElementById('offerPriceError').textContent = 'persentage must be a positive number between 0 and 100.';
            valid = false;
        }

        // Validate Stock 
        // if (!/^[0-9]\d*$/.test(stock)) {
        //     document.getElementById('stockError').textContent = 'Stock must be a positive integer.';
        //     valid = false;
        // }

       // Validate Stock for each size (S, M, L, XL, XXL)
        if (!/^[0-9]\d*$/.test(stockS)) {
            document.getElementById('stockError').textContent = 'Stock for size S must be a positive integer.';
            valid = false;
        }
        if (!/^[0-9]\d*$/.test(stockM)) {
            document.getElementById('stockError').textContent = 'Stock for size M must be a positive integer.';
            valid = false;
        }
        if (!/^[0-9]\d*$/.test(stockL)) {
            document.getElementById('stockError').textContent = 'Stock for size L must be a positive integer.';
            valid = false;
        }
        if (!/^[0-9]\d*$/.test(stockXL)) {
            document.getElementById('stockError').textContent = 'Stock for size XL must be a positive integer.';
            valid = false;
        }
        if (!/^[0-9]\d*$/.test(stockXXL)) {
            document.getElementById('stockError').textContent = 'Stock for size XXL must be a positive integer.';
            valid = false;
        }

        // Validate image files
        const allowedExtensions = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (files.length < 3) {
            document.getElementById('imageError').textContent = 'Please upload at least three images.';
            valid = false;
        } else {
            for (let i = 0; i < files.length; i++) {
                if (!allowedExtensions.includes(files[i].type)) {
                    document.getElementById('imageError').textContent = 'Only image files (jpg, png, jpeg, webp) are allowed.';
                    valid = false;
                    break;
                }
            }
        }

        // If the form is valid, handle image cropping and submission
        if (valid) {
            event.preventDefault(); // Prevent the form from submitting immediately

            let croppedImagesData = [];
            const promises = croppieInstances.map((croppie, index) => {
                return croppie.instance.result('blob').then(function (croppedBlob) {
                    croppedImagesData.push(croppedBlob); // Store the cropped image blob
                });
            });

            Promise.all(promises).then(() => {
                // Replace input files with cropped images
                const dataTransfer = new DataTransfer(); // Creates a new input file list

                croppedImagesData.forEach((croppedBlob, index) => {
                    const file = new File([croppedBlob], `croppedImage_${index}.png`, {
                        type: croppedBlob.type
                    });
                    dataTransfer.items.add(file); // Add cropped image as a file
                });

                upload.files = dataTransfer.files; // Replace the input file list with cropped images

                // Submit the form after replacing images in the input
                form.submit();
            });
        } else {
            event.preventDefault(); // Prevent form submission if invalid
        }
    });
});





