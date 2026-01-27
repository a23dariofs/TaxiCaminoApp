// Configuración de Tailwind CSS
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#1773cf",
            }
        },
    },
}

// Funcionalidades JavaScript para la gestión de pagos
document.addEventListener('DOMContentLoaded', function() {
    
    // Botón añadir pago manualmente
    const addPaymentBtn = document.getElementById('addPaymentBtn');
    if (addPaymentBtn) {
        addPaymentBtn.addEventListener('click', function() {
            console.log('Añadir pago manualmente');
            alert('Funcionalidad para añadir pago manualmente');
        });
    }
    
    // Botones de marcar como pagada
    const markPaidButtons = document.querySelectorAll('.mark-paid-btn');
    markPaidButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const clientName = row.querySelector('td:first-child').textContent;
            
            if (confirm(`¿Confirmar que el pago de ${clientName} ha sido completado?`)) {
                // Actualizar el estado a pagado
                const statusCell = row.querySelector('td:nth-child(6)');
                statusCell.innerHTML = '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">Pagado</span>';
                
                // Actualizar botón a estado pagada
                const actionCell = row.querySelector('td:last-child');
                actionCell.innerHTML = '<button class="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium cursor-not-allowed" disabled><span class="material-symbols-outlined text-base">check_circle</span>Pagada</button>';
                
                // Agregar fecha de pago (fecha actual)
                const dateCell = row.querySelector('td:nth-child(3)');
                const today = new Date();
                const dateString = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
                if (dateCell.textContent === '-') {
                    dateCell.textContent = dateString;
                }
                
                console.log('Pago marcado como completado:', clientName);
            }
        });
    });
    
    // Botones de descarga
    const downloadButtons = document.querySelectorAll('button[class*="download"]');
    downloadButtons.forEach(btn => {
        if (btn.textContent.includes('Descargar')) {
            btn.addEventListener('click', function() {
                const buttonText = this.textContent.trim();
                console.log('Descargando:', buttonText);
                alert(`Preparando descarga: ${buttonText}`);
            });
        }
    });
    
    // Filtro por cliente
    const clientFilter = document.querySelector('input[placeholder*="cliente"]');
    if (clientFilter) {
        clientFilter.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const clientName = row.querySelector('td:first-child').textContent.toLowerCase();
                row.style.display = clientName.includes(searchTerm) ? '' : 'none';
            });
        });
    }
    
    // Selector de mes para estadísticas
    const monthSelector = document.querySelector('select[class*="py-2"]');
    if (monthSelector) {
        monthSelector.addEventListener('change', function() {
            console.log('Mes seleccionado:', this.value);
            // Aquí puedes agregar lógica para actualizar las estadísticas según el mes
        });
    }
    
    console.log('Taxicamino - Sistema de gestión de pagos cargado correctamente');
});
