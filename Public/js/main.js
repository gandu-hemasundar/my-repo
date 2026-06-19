document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('bookingForm');
    const messageDiv = document.getElementById('message');
    const availabilityList = document.getElementById('availabilityList');

    // Set minimum date to today
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);

    // Load availability
    loadAvailability();

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            room: document.getElementById('room').value,
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            purpose: document.getElementById('purpose').value
        };

        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('✅ Room booked successfully!', 'success');
                form.reset();
                loadAvailability();
                loadAdminBookings(); // Update admin if open
            } else {
                showMessage(`❌ ${data.error || 'Booking failed'}`, 'error');
            }
        } catch (error) {
            showMessage('❌ Network error. Please try again.', 'error');
            console.error('Error:', error);
        }
    });

    // Load availability
    async function loadAvailability() {
        try {
            const response = await fetch('/api/bookings');
            const bookings = await response.json();
            
            if (!response.ok) {
                throw new Error('Failed to load availability');
            }

            const rooms = ['Conference Room A', 'Conference Room B', 'Meeting Room', 'Board Room'];
            const today = new Date().toISOString().split('T')[0];
            
            // Group bookings by room
            const roomBookings = {};
            rooms.forEach(room => {
                roomBookings[room] = bookings.filter(b => 
                    b.room === room && b.date >= today
                );
            });

            if (rooms.length === 0) {
                availabilityList.innerHTML = '<p>No rooms available</p>';
                return;
            }

            let html = '<div class="availability-grid">';
            rooms.forEach(room => {
                const bookingsForRoom = roomBookings[room] || [];
                const isBooked = bookingsForRoom.length > 0;
                const nextBooking = bookingsForRoom[0];
                
                html += `
                    <div class="availability-item ${isBooked ? 'booked' : ''}">
                        <h4>${room}</h4>
                        ${isBooked ? `
                            <p>📅 Booked: ${nextBooking.date}</p>
                            <p>⏰ ${nextBooking.time}</p>
                        ` : `
                            <p>✅ Available</p>
                            <p style="font-size: 12px; color: #999;">Click to book</p>
                        `}
                    </div>
                `;
            });
            html += '</div>';
            availabilityList.innerHTML = html;

        } catch (error) {
            availabilityList.innerHTML = '<p class="error">Failed to load availability</p>';
            console.error('Error:', error);
        }
    }

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }

    // Load admin bookings if on admin page
    if (window.location.pathname.includes('/admin')) {
        loadAdminBookings();
    }

    // Expose loadAdminBookings for admin page
    window.loadAdminBookings = async function() {
        // This will be defined in admin.js
    };
});
