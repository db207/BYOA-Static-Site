const FORM_ID = '7561209';

async function submitToConvertKit(email) {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                formId: FORM_ID
            })
        });

        if (!response.ok) {
            throw new Error('Subscription failed');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.newsletter-form');
    const successMessage = form.querySelector('.success-message');
    const errorMessage = form.querySelector('.error-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const emailInput = form.querySelector('input[type="email"]');
        const submitButton = form.querySelector('button');
        
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Subscribing...';
            
            await submitToConvertKit(emailInput.value);
            
            // Show success message
            successMessage.style.display = 'block';
            errorMessage.style.display = 'none';
            emailInput.value = '';
            
            // Hide success message after 3 seconds
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 3000);
        } catch (error) {
            // Show error message
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Subscribe';
        }
    });
}); 