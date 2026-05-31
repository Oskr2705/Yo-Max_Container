$(document).ready(function() {
    let dataTable;
    let editVentaModal;

    const API_BASE = '/ventas_web/api';
    const ENDPOINTS = {
        list: `${API_BASE}/listar`,
        process: (id) => `${API_BASE}/procesar/${id}`,
        delete: (id) => `${API_BASE}/eliminar/${id}`,
    };

    initializeDataTable();
    editVentaModal = new bootstrap.Modal(document.getElementById('editVentaModal'));
    setupEventListeners();

    function initializeDataTable() {
        if (dataTable) dataTable.destroy();
        dataTable = $('#tablaVentasWeb').DataTable({
            responsive: true,
            processing: true,
            ajax: { url: ENDPOINTS.list, dataSrc: 'data' },
            columns: [
                { data: 'id' },
                { data: 'nombreCliente' },
                { data: 'numeroDocumentoCliente' },
                { data: 'fechaPedido', render: data => new Date(data).toLocaleString('es-PE') },
                { data: 'total', render: data => `S/ ${parseFloat(data).toFixed(2)}` },
                {
                    data: null, orderable: false, searchable: false,
                    render: (data, type, row) => `
                        <button class="btn btn-sm btn-success action-process" data-id="${row.id}" title="Procesar Venta"><i class="bi bi-check-lg"></i></button>
                        <button class="btn btn-sm btn-info action-edit" data-id="${row.id}" title="Editar Venta"><i class="bi bi-pencil-fill"></i></button>
                        <button class="btn btn-sm btn-danger action-delete" data-id="${row.id}" title="Eliminar Venta"><i class="bi bi-trash-fill"></i></button>
                    `
                }
            ],
            language: { url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json" },
            order: [[0, 'desc']]
        });
    }

    function setupEventListeners() {
        $('#tablaVentasWeb tbody').on('click', '.action-process', handleProcesar);
        $('#tablaVentasWeb tbody').on('click', '.action-edit', handleEdit);
        $('#tablaVentasWeb tbody').on('click', '.action-delete', handleDelete);

        // Escuchar mensajes desde el iframe de edición para recargar la tabla
        window.addEventListener('message', function(event) {
            if (event.data === 'ventaActualizada') {
                editVentaModal.hide();
                dataTable.ajax.reload();
                showNotification('Venta web actualizada con éxito.', 'success');
            }
        });
    }

    function handleEdit() {
        const ventaId = $(this).data('id');
        const iframe = $('#editVentaIframe');
        iframe.attr('src', `/ventas_web/modificar/${ventaId}`);
        editVentaModal.show();
    }

    function handleProcesar() {
        const ventaId = $(this).data('id');
        Swal.fire({
            title: '¿Estás seguro?',
            text: "La venta será procesada y el stock de los productos será actualizado. Esta acción no se puede revertir.",
            icon: 'info',
            showCancelButton: true, confirmButtonColor: '#3085d6', cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, procesar', cancelButtonText: 'Cancelar'
        }).then(result => {
            if (result.isConfirmed) {
                $.ajax({
                    url: ENDPOINTS.process(ventaId), type: 'POST',
                    success: function(response) {
                        showNotification(response.message, response.success ? 'success' : 'error');
                        if (response.success) dataTable.ajax.reload();
                    },
                    error: (xhr) => showNotification(xhr.responseJSON?.message || 'Error al procesar la venta.', 'error')
                });
            }
        });
    }

    function handleDelete() {
        const ventaId = $(this).data('id');
        Swal.fire({
            title: '¿Estás seguro de eliminar esta venta web?',
            text: "Esta acción eliminará el registro permanentemente de la base de datos. No se podrá recuperar.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminarla',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (result.isConfirmed) {
                $.ajax({
                    url: ENDPOINTS.delete(ventaId),
                    type: 'DELETE',
                    success: function(response) {
                        showNotification(response.message, response.success ? 'success' : 'error');
                        if (response.success) {
                            dataTable.ajax.reload();
                        }
                    },
                    error: (xhr) => showNotification(xhr.responseJSON?.message || 'Error al eliminar la venta web.', 'error')
                });
            }
        });
    }

    function showNotification(message, type = 'success') {
        const toastContainer = document.getElementById('notification-container');
        if (!toastContainer) return;

        const toastClass = type === 'success' ? 'text-bg-success' : 'text-bg-danger';
        const toastElement = document.createElement('div');
        toastElement.className = `toast align-items-center ${toastClass} border-0`;
        toastElement.setAttribute('role', 'alert');
        toastElement.setAttribute('aria-live', 'assertive');
        toastElement.setAttribute('aria-atomic', 'true');

        toastElement.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>`;

        toastContainer.appendChild(toastElement);

        const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
        toast.show();

        // Eliminar el toast del DOM después de que se oculte
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
});
