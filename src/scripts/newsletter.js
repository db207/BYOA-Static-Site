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
            
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: emailInput.value
                })
            });

            if (!response.ok) {
                throw new Error('Subscription failed');
            }
            
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