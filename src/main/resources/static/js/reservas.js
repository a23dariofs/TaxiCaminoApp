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

// Funcionalidades JavaScript para la gestión de reservas
document.addEventListener('DOMContentLoaded', function() {
    
    // Botón crear nueva reserva
    const createReservationBtn = document.getElementById('createReservationBtn');
    if (createReservationBtn) {
        createReservationBtn.addEventListener('click', function() {
            console.log('Crear nueva reserva');
            alert('Funcionalidad para crear nueva reserva');
        });
    }
    
    // Filtros de tiempo (Esta semana / Este mes)
    const filterButtons = document.querySelectorAll('main button');
    filterButtons.forEach((btn, index) => {
        if (index < 2 && btn.textContent.includes('semana') || btn.textContent.includes('mes')) {
            btn.addEventListener('click', function() {
                // Remover clase activa de todos los botones de filtro
                filterButtons.forEach((b, i) => {
                    if (i < 2) {
                        b.classList.remove('bg-primary', 'text-white');
                        b.classList.add('bg-white', 'text-gray-600', 'border', 'border-gray-200');
                    }
                });
                
                // Agregar clase activa al botón clickeado
                this.classList.remove('bg-white', 'text-gray-600', 'border', 'border-gray-200');
                this.classList.add('bg-primary', 'text-white');
                
                console.log('Filtro seleccionado:', this.textContent.trim());
            });
        }
    });
    
    // Botones de editar
    const editButtons = document.querySelectorAll('button[aria-label="Editar"]');
    editButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const clientName = row.querySelector('td:nth-child(2)').textContent;
            console.log('Editar reserva de:', clientName);
            alert(`Editar reserva de: ${clientName}`);
        });
    });
    
    // Botones de cancelar
    const cancelButtons = document.querySelectorAll('button[aria-label="Cancelar"]');
    cancelButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const clientName = row.querySelector('td:nth-child(2)').textContent;
            
            if (confirm(`¿Estás seguro de que deseas cancelar la reserva de ${clientName}?`)) {
                // Actualizar el estado a cancelado
                const statusCell = row.querySelector('td:nth-child(7)');
                statusCell.innerHTML = '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">Cancelada</span>';
                
                // Tachar el precio
                const priceCell = row.querySelector('td:nth-child(6)');
                priceCell.classList.add('line-through', 'text-gray-400');
                
                // Remover botones de cancelar y ruta
                const actionsCell = row.querySelector('td:last-child div');
                actionsCell.innerHTML = '<button aria-label="Editar" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"><span class="material-symbols-outlined text-base">edit</span></button>';
                
                console.log('Reserva cancelada:', clientName);
            }
        });
    });
    
    // Botones de pasar a ruta diaria
    const routeButtons = document.querySelectorAll('button[aria-label="Pasar a Ruta Diaria"]');
    routeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const clientName = row.querySelector('td:nth-child(2)').textContent;
            console.log('Pasar a Ruta Diaria:', clientName);
            alert(`La reserva de ${clientName} se ha añadido a la Ruta Diaria`);
        });
    });
    
    console.log('Taxicamino - Sistema de gestión de reservas cargado correctamente');
});