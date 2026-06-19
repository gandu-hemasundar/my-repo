document.addEventListener('DOMContentLoaded', () => {
    const bookingsContainer = document.getElementById('bookingsContainer');
    const refreshBtn = document.getElementById('refreshBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');

    loadAdminBookings();

    refreshBtn.addEventListener('click', loadAdminBookings);

    clearAllBtn.addEventListener('click', async () => {
        if (!confirm('⚠️ Are you sure you want to delete all bookings? This action cannot be undone!')) {
            return;
        }

        try {
            const bookings = await fetchBookings();
            for (const booking of bookings) {
                await fetch(`/api/bookings/${booking.id}`, {
                    method: 'DELETE'
                });
            }
            loadAdminBookings();
            showNotification('All bookings cleared successfully', 'success');
        } catch (error) {
            showNotification('Failed to clear bookings', 'error');
            console.error('Error:', error);
        }
    });

    async function loadAdminBookings() {
        try {
            const bookings = await fetchBookings();
            
            if (bookings.length === 0) {
                bookingsContainer.innerHTML = `
                    <div class="empty-state">
                        <p>📭 No bookings yet</p>
                        <p style="font-size: 14px; color: #999;">Bookings will appear here once created</p>
                    </div>
                `;
                return;
            }

            // Sort by date and time
            bookings.sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return a.time.localeCompare(b.time);
            });

            let html = '';
            bookings.forEach(booking => {
                html += `
                    <div class="booking-card">
                        <div class="booking-info">
                            <h4>${booking.room}</h4>
                            <p><strong>📅 Date:</strong> ${formatDate(booking.date)}</p>
                            <p><strong>⏰ Time:</strong> ${booking.time}</p>
                            <p><strong>👤 Booked by:</strong> ${booking.name}</p>
                            <p><strong>📧 Email:</strong> ${booking.email}</p>
                            <p><strong>📝 Purpose:</strong> ${booking.purpose}</p>
                            <p style="font-size: 12px; color: #999;">
                                Booked: ${new Date(booking.createdAt).toLocaleString()}
                            </p>
                        </div>
                        <div class="booking-actions">
                            <button class="btn-cancel" onclick="cancelBooking('${booking.id}')">
                                Cancel
                            </button>
                        </div>
                    </div>
                `;
            });
            
            bookingsContainer.innerHTML = html;
        } catch (error) {
            bookingsContainer.innerHTML = '<p class="error">Failed to load bookings</p>';
            console.error('Error:', error);
        }
    }

    async function fetchBookings() {
        const response = await fetch('/api/bookings');
        if (!response.ok) {
            throw new Error('Failed to fetch bookings');
        }
        return response.json();
    }

    window.cancelBooking = async function(id) {
        if (!confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        try {
            const response = await fetch(`/api/bookings/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadAdminBookings();
                showNotification('Booking cancelled successfully', 'success');
                // Update availability on main page if open
                if (window.loadAvailability) {
                    window.loadAvailability();
                }
            } else {
                const data = await response.json();
                showNotification(data.error || 'Failed to cancel booking', 'error');
            }
        } catch (error) {
            showNotification('Network error. Please try again.', 'error');
            console.error('Error:', error);
        }
    };

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function showNotification(message, type) {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    // Expose functions to window for inline onclick handlers
    window.loadAdminBookings = loadAdminBookings;
});
