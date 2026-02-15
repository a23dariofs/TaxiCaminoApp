package com.example.TaxiWaySarria.Service;

import com.example.TaxiWaySarria.Model.*;
import com.example.TaxiWaySarria.Repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final ClienteRepository clienteRepository;
    private final FacturaRepository facturaRepository;
    private final RutaDiariaRepository rutaDiariaRepository;
    private final RutaDetalleRepository rutaDetalleRepository;
    private final PresupuestoDetalleRepository presupuestoDetalleRepository;
    private final RepartidorRepository repartidorRepository;

    public ReservaService(ReservaRepository reservaRepository,
                          ClienteRepository clienteRepository,
                          FacturaRepository facturaRepository,
                          RutaDiariaRepository rutaDiariaRepository,
                          RutaDetalleRepository rutaDetalleRepository,
                          PresupuestoDetalleRepository presupuestoDetalleRepository,
                          RepartidorRepository repartidorRepository) {
        this.reservaRepository = reservaRepository;
        this.clienteRepository = clienteRepository;
        this.facturaRepository = facturaRepository;
        this.rutaDiariaRepository = rutaDiariaRepository;
        this.rutaDetalleRepository = rutaDetalleRepository;
        this.presupuestoDetalleRepository = presupuestoDetalleRepository;
        this.repartidorRepository = repartidorRepository;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MÉTODOS CRUD BÁSICOS
    // ═══════════════════════════════════════════════════════════════════════════

    public List<Reserva> listarTodas() {
        return reservaRepository.findAll();
    }

    public Optional<Reserva> buscarPorId(Long id) {
        return reservaRepository.findById(id);
    }

    public Reserva crearReserva(Long clienteId, Reserva reserva) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        reserva.setCliente(cliente);
        reserva.setEstado("Pendiente");
        return reservaRepository.save(reserva);
    }

    public Reserva actualizarEstado(Long id, String nuevoEstado) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));
        reserva.setEstado(nuevoEstado);
        return reservaRepository.save(reserva);
    }

    public void eliminar(Long id) {
        reservaRepository.deleteById(id);
    }

    public List<Reserva> buscarPorCliente(Long clienteId) {
        return reservaRepository.findByClienteId(clienteId);
    }

    public List<Reserva> buscarPorEstado(String estado) {
        return reservaRepository.findByEstado(estado);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ✅ CORREGIDO: Asignar repartidor CON validación de pago
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public Reserva asignarRepartidorConValidacionPago(Long reservaId, Long repartidorId) {
        // 1️⃣ Buscar la reserva
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada con ID: " + reservaId));

        // 2️⃣ Buscar el repartidor
        Repartidor repartidor = repartidorRepository.findById(repartidorId)
                .orElseThrow(() -> new RuntimeException("Repartidor no encontrado con ID: " + repartidorId));

        // 3️⃣ ⚠️ VALIDAR QUE EL PAGO ESTÉ COMPLETADO
        boolean pagoCompletado = validarPagoCliente(reserva.getCliente().getId());

        if (!pagoCompletado) {
            throw new RuntimeException(
                    "⚠️ PAGO PENDIENTE: No se puede asignar repartidor hasta que el cliente complete el pago. " +
                            "Por favor, verifica que la factura esté marcada como PAGADO en la sección de Pagos."
            );
        }

        // 4️⃣ Asignar repartidor a la reserva
        if (reserva.getRepartidoresAsignados() == null) {
            reserva.setRepartidoresAsignados(new ArrayList<>());
        }

        // Evitar duplicados
        if (!reserva.getRepartidoresAsignados().contains(repartidor)) {
            reserva.getRepartidoresAsignados().add(repartidor);
        }

        reservaRepository.save(reserva);

        // 5️⃣ AUTO-CREAR RUTA DIARIA con albergues
        crearRutaDiariaConAlbergues(reserva, repartidor);

        System.out.println("✅ Repartidor asignado y RutaDiaria creada para Reserva ID: " + reservaId);

        return reserva;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔍 MÉTODO PRIVADO: Validar que el pago esté completado
    // ═══════════════════════════════════════════════════════════════════════════

    private boolean validarPagoCliente(Long clienteId) {
        // Buscar todas las facturas del cliente
        List<Factura> facturas = facturaRepository.findByClienteId(clienteId);

        if (facturas == null || facturas.isEmpty()) {
            System.out.println("❌ No se encontraron facturas para el cliente ID: " + clienteId);
            return false;
        }

        // Verificar si hay al menos una factura en estado PAGADO
        boolean tienePagoPendiente = facturas.stream()
                .anyMatch(f -> "PAGADO".equalsIgnoreCase(f.getEstado()));

        if (tienePagoPendiente) {
            System.out.println("✅ Pago validado: Cliente tiene factura(s) en estado PAGADO");
            return true;
        }

        // Mostrar el estado de las facturas para debugging
        System.out.println("❌ Pago NO validado. Estados de facturas del cliente " + clienteId + ":");
        for (Factura f : facturas) {
            System.out.println("   - Factura ID " + f.getId() + ": Estado = " + f.getEstado());
        }

        return false;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ✅ CORREGIDO: Auto-crear RutaDiaria SIN usar campos inexistentes
    // Accede a los datos del presupuesto a través de la relación
    // ═══════════════════════════════════════════════════════════════════════════

    private void crearRutaDiariaConAlbergues(Reserva reserva, Repartidor repartidor) {
        try {
            // 1️⃣ Crear RutaDiaria
            // ✅ SOLO campos que EXISTEN: fecha, repartidor, detalles
            RutaDiaria rutaDiaria = new RutaDiaria();
            rutaDiaria.setFecha(reserva.getFechaReserva() != null ? reserva.getFechaReserva() : LocalDate.now());
            rutaDiaria.setRepartidor(repartidor);

            // ℹ️ NOTA: origen, destino, cliente, precio NO existen en RutaDiaria
            // El repartidor puede acceder a esta info en el frontend haciendo:
            // - reserva.presupuesto.origen
            // - reserva.presupuesto.destino
            // - reserva.cliente.nombre
            // - reserva.presupuesto.precioTotal

            rutaDiariaRepository.save(rutaDiaria);

            // 2️⃣ Verificar si la reserva tiene un presupuesto con detalles de albergues
            if (reserva.getPresupuesto() != null) {
                List<PresupuestoDetalle> presupuestoDetalles = presupuestoDetalleRepository
                        .findByPresupuestoId(reserva.getPresupuesto().getId());

                if (presupuestoDetalles != null && !presupuestoDetalles.isEmpty()) {
                    // 3️⃣ Crear RutaDetalle por cada albergue en orden
                    int contador = 0;
                    for (PresupuestoDetalle presupuestoDetalle : presupuestoDetalles) {
                        RutaDetalle rutaDetalle = new RutaDetalle();
                        rutaDetalle.setRutaDiaria(rutaDiaria);
                        rutaDetalle.setAlbergue(presupuestoDetalle.getAlbergue());
                        rutaDetalle.setOrden(presupuestoDetalle.getOrden());
                        rutaDetalleRepository.save(rutaDetalle);
                        contador++;
                    }

                    System.out.println("✅ RutaDiaria ID " + rutaDiaria.getId() + " creada con " + contador + " paradas (albergues)");

                    // Log de las paradas para debugging
                    for (PresupuestoDetalle detalle : presupuestoDetalles) {
                        System.out.println("   Parada " + detalle.getOrden() + ": " +
                                detalle.getAlbergue().getNombre() + " (" +
                                detalle.getAlbergue().getCiudad() + ")");
                    }
                } else {
                    System.out.println("ℹ️ RutaDiaria creada sin paradas específicas (presupuesto sin detalles de albergues)");
                }
            } else {
                System.out.println("ℹ️ RutaDiaria creada sin paradas específicas (reserva sin presupuesto asociado)");
            }

        } catch (Exception e) {
            System.err.println("❌ Error al crear RutaDiaria: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al crear la ruta diaria: " + e.getMessage());
        }
    }
}