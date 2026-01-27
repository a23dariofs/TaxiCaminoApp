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

// Funcionalidades JavaScript para la gestión de presupuestos
document.addEventListener('DOMContentLoaded', function() {
    
    // Botón crear nuevo presupuesto
    const createBudgetBtn = document.getElementById('createBudgetBtn');
    if (createBudgetBtn) {
        createBudgetBtn.addEventListener('click', function() {
            console.log('Crear nuevo presupuesto');
            alert('Funcionalidad para crear nuevo presupuesto');
        });
    }
    
    // Botones de editar
    const editButtons = document.querySelectorAll('button[aria-label="Editar"]');
    editButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const clientName = row.querySelector('td:first-child').textContent;
            console.log('Editar presupuesto de:', clientName);
            alert(`Editar presupuesto de: ${clientName}`);
        });
    });
    
    // Botones de eliminar
    const deleteButtons = document.querySelectorAll('button[aria-label="Eliminar"]');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const clientName = row.querySelector('td:first-child').textContent;
            
            if (confirm(`¿Estás seguro de que deseas eliminar el presupuesto de ${clientName}?`)) {
                row.remove();
                console.log('Presupuesto eliminado:', clientName);
            }
        });
    });
    
    // Botones de enviar presupuesto
    const sendButtons = document.querySelectorAll('button[aria-label="Enviar presupuesto"]');
    sendButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const clientName = row.querySelector('td:first-child').textContent;
            const statusCell = row.querySelector('td:nth-child(7)');
            
            if (confirm(`¿Enviar presupuesto a ${clientName}?`)) {
                // Actualizar el estado a enviado
                statusCell.innerHTML = '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">Enviado</span>';
                console.log('Presupuesto enviado a:', clientName);
                alert(`Presupuesto enviado a ${clientName}`);
            }
        });
    });
    
    // Botones de convertir en reserva
    const convertButtons = document.querySelectorAll('button[aria-label="Convertir en Reserva"]');
    convertButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const clientName = row.querySelector('td:first-child').textContent;
            const statusCell = row.querySelector('td:nth-child(7)');
            
            if (confirm(`¿Convertir el presupuesto de ${clientName} en una reserva?`)) {
                // Actualizar el estado a aceptado
                statusCell.innerHTML = '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">Aceptado</span>';
                console.log('Presupuesto convertido en reserva:', clientName);
                alert(`El presupuesto de ${clientName} se ha convertido en una reserva`);
            }
        });
    });
    
    console.log('Taxicamino - Sistema de gestión de presupuestos cargado correctamente');
});