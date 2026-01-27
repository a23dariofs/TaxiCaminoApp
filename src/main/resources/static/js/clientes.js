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

// Funcionalidades JavaScript para la gestión de clientes
document.addEventListener('DOMContentLoaded', function() {
    
    // Búsqueda de clientes
    const searchInput = document.getElementById('searchInput');
    const clientsTableBody = document.getElementById('clientsTableBody');
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = clientsTableBody.getElementsByTagName('tr');
            
            Array.from(rows).forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
    
    // Botón añadir nuevo cliente
    const addClientBtn = document.getElementById('addClientBtn');
    if (addClientBtn) {
        addClientBtn.addEventListener('click', function() {
            console.log('Añadir nuevo cliente');
            // Aquí puedes agregar la lógica para abrir un modal o formulario
            alert('Funcionalidad para añadir nuevo cliente');
        });
    }
    
    // Botones de editar
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const clientName = row.querySelector('td:first-child').textContent;
            console.log('Editar cliente:', clientName);
            alert(`Editar cliente: ${clientName}`);
        });
    });
    
    // Botones de eliminar
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const clientName = row.querySelector('td:first-child').textContent;
            
            if (confirm(`¿Estás seguro de que deseas eliminar al cliente ${clientName}?`)) {
                row.remove();
                console.log('Cliente eliminado:', clientName);
            }
        });
    });
    
    console.log('Taxicamino - Sistema de gestión de clientes cargado correctamente');
});