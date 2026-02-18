package com.example.TaxiWaySarria.Service;

import com.example.TaxiWaySarria.DTOs.EtapaCaminoDTO;
import com.example.TaxiWaySarria.DTOs.ReservaDTO;
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
    private final AgenciaRepository agenciaRepository;
    private final AlbergueRepository albergueRepository;
    private final EtapaCaminoRepository etapaCaminoRepository;

    public ReservaService(ReservaRepository reservaRepository,
                          ClienteRepository clienteRepository,
                          FacturaRepository facturaRepository,
                          RutaDiariaRepository rutaDiariaRepository,
                          RutaDetalleRepository rutaDetalleRepository,
                          PresupuestoDetalleRepository presupuestoDetalleRepository,
                          RepartidorRepository repartidorRepository,
                          AgenciaRepository agenciaRepository,
                          AlbergueRepository albergueRepository,
                          EtapaCaminoRepository etapaCaminoRepository) {
        this.reservaRepository = reservaRepository;
        this.clienteRepository = clienteRepository;
        this.facturaRepository = facturaRepository;
        this.rutaDiariaRepository = rutaDiariaRepository;
        this.rutaDetalleRepository = rutaDetalleRepository;
        this.presupuestoDetalleRepository = presupuestoDetalleRepository;
        this.repartidorRepository = repartidorRepository;
        this.agenciaRepository = agenciaRepository;
        this.albergueRepository = albergueRepository;
        this.etapaCaminoRepository = etapaCaminoRepository;
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

    @Transactional
    public Reserva crearReservaCompleta(ReservaDTO reservaDTO) {

        // 1️⃣ BUSCAR O CREAR CLIENTE
        Cliente cliente = buscarOCrearCliente(
                reservaDTO.getClienteEmail(),
                reservaDTO.getClienteTelefono(),
                reservaDTO.getClienteNombre(),
                reservaDTO.getClienteApellidos()
        );

        // 2️⃣ BUSCAR O CREAR AGENCIA (si se proporcionó)
        Agencia agencia = null;
        if (reservaDTO.getAgenciaNombre() != null && !reservaDTO.getAgenciaNombre().trim().isEmpty()) {
            agencia = buscarOCrearAgencia(reservaDTO.getAgenciaNombre().trim());
        }

        // 3. Crear reserva
        Reserva reserva = new Reserva();
        reserva.setCliente(cliente);
        reserva.setAgencia(agencia);
        reserva.setObservaciones(reservaDTO.getObservaciones());
        reserva.setEstado(reservaDTO.getEstado() != null ? reservaDTO.getEstado() : "Pendiente");
        reserva.setFechaCreacion(LocalDate.now());
        reserva.setEtapas(new ArrayList<>());

        // 4. Guardar reserva primero
        reserva = reservaRepository.save(reserva);

        // 5. Crear etapas
        double precioTotal = 0.0;

        if (reservaDTO.getEtapas() != null && !reservaDTO.getEtapas().isEmpty()) {
            for (EtapaCaminoDTO etapaDTO : reservaDTO.getEtapas()) {

                // 🏠 BUSCAR O CREAR ALBERGUES
                Albergue alojamientoSalida = buscarOCrearAlbergue(etapaDTO.getAlojamientoSalidaNombre());
                Albergue alojamientoDestino = buscarOCrearAlbergue(etapaDTO.getAlojamientoDestinoNombre());

                // Crear etapa
                EtapaCamino etapa = new EtapaCamino();
                etapa.setReserva(reserva);
                etapa.setFecha(etapaDTO.getFecha());
                etapa.setAlojamientoSalida(alojamientoSalida);
                etapa.setAlojamientoDestino(alojamientoDestino);
                etapa.setCantidadMochilas(etapaDTO.getCantidadMochilas());
                etapa.setPrecioUnitario(etapaDTO.getPrecioUnitario() != null ? etapaDTO.getPrecioUnitario() : 6.0);
                etapa.setPrecioTotal(etapaDTO.getCantidadMochilas() * etapa.getPrecioUnitario());
                etapa.setComentarios(etapaDTO.getComentarios());
                etapa.setOrden(etapaDTO.getOrden());

                // Guardar etapa
                etapa = etapaCaminoRepository.save(etapa);
                reserva.getEtapas().add(etapa);

                // Sumar al precio total
                precioTotal += etapa.getPrecioTotal();
            }
        }

        // 6. Actualizar precio total
        reserva.setPrecioTotal(precioTotal);
        reserva = reservaRepository.save(reserva);

        System.out.println("✅ Reserva completa creada:");
        System.out.println("   - Cliente: " + cliente.getNombre() + " (ID: " + cliente.getId() + ")");
        if (agencia != null) System.out.println("   - Agencia: " + agencia.getNombre() + " (ID: " + agencia.getId() + ")");
        System.out.println("   - Etapas: " + reserva.getEtapas().size());
        System.out.println("   - Precio total: €" + precioTotal);

        return reserva;
    }

    private Cliente buscarOCrearCliente(String email, String telefono, String nombre, String apellidos) {

        Cliente cliente = null;

        // 1️⃣ Buscar por email (prioridad)
        if (email != null && !email.trim().isEmpty()) {
            cliente = clienteRepository.findByEmail(email.trim()).orElse(null);
            if (cliente != null) {
                System.out.println("✅ Cliente encontrado por email: " + cliente.getNombre() + " (ID: " + cliente.getId() + ")");
                return cliente;
            }
        }

        // 2️⃣ Buscar por teléfono (segunda opción)
        if (telefono != null && !telefono.trim().isEmpty()) {
            cliente = clienteRepository.findByTelefono(telefono.trim()).orElse(null);
            if (cliente != null) {
                System.out.println("✅ Cliente encontrado por teléfono: " + cliente.getNombre() + " (ID: " + cliente.getId() + ")");
                return cliente;
            }
        }

        // 3️⃣ Si no existe, crear nuevo cliente
        if (nombre == null || nombre.trim().isEmpty()) {
            throw new RuntimeException("El nombre del cliente es obligatorio para crear uno nuevo");
        }

        Cliente nuevoCliente = new Cliente();
        nuevoCliente.setNombre(nombre.trim());
        nuevoCliente.setApellidos(apellidos != null ? apellidos.trim() : "");
        nuevoCliente.setTelefono(telefono != null ? telefono.trim() : null);
        nuevoCliente.setEmail(email != null ? email.trim() : null);

        nuevoCliente = clienteRepository.save(nuevoCliente);

        System.out.println("✅ Cliente NUEVO creado: " + nuevoCliente.getNombre() + " " + nuevoCliente.getApellidos() + " (ID: " + nuevoCliente.getId() + ")");

        return nuevoCliente;
    }

    // ═══════════════════════════════════════════════════════════════════════════
// 🔍 BUSCAR O CREAR AGENCIA
// ═══════════════════════════════════════════════════════════════════════════
    private Agencia buscarOCrearAgencia(String nombre) {
        // Buscar por nombre exacto
        Agencia agencia = agenciaRepository.findByNombre(nombre).orElse(null);

        if (agencia != null) {
            System.out.println("✅ Agencia encontrada: " + agencia.getNombre() + " (ID: " + agencia.getId() + ")");
            return agencia;
        }

        // Si no existe, crear nueva
        Agencia nuevaAgencia = new Agencia();
        nuevaAgencia.setNombre(nombre);
        nuevaAgencia = agenciaRepository.save(nuevaAgencia);

        System.out.println("✅ Agencia NUEVA creada: " + nuevaAgencia.getNombre() + " (ID: " + nuevaAgencia.getId() + ")");

        return nuevaAgencia;
    }

    // ═══════════════════════════════════════════════════════════════════════════
// 🏠 BUSCAR O CREAR ALBERGUE
// ═══════════════════════════════════════════════════════════════════════════
    private Albergue buscarOCrearAlbergue(String nombreCompleto) {
        // El nombreCompleto viene como "Nombre Albergue - Ciudad"
        // Intentar extraer nombre y ciudad
        String nombre;
        String ciudad = null;

        if (nombreCompleto.contains(" - ")) {
            String[] partes = nombreCompleto.split(" - ", 2);
            nombre = partes[0].trim();
            ciudad = partes[1].trim();
        } else {
            nombre = nombreCompleto.trim();
        }

        // Buscar por nombre
        Albergue albergue = albergueRepository.findByNombre(nombre).orElse(null);

        if (albergue != null) {
            System.out.println("✅ Albergue encontrado: " + albergue.getNombre() + " (ID: " + albergue.getId() + ")");
            return albergue;
        }

        // Si no existe, crear nuevo
        Albergue nuevoAlbergue = new Albergue();
        nuevoAlbergue.setNombre(nombre);
        nuevoAlbergue.setCiudad(ciudad);
        nuevoAlbergue = albergueRepository.save(nuevoAlbergue);

        System.out.println("✅ Albergue NUEVO creado: " + nuevoAlbergue.getNombre() + " (ID: " + nuevoAlbergue.getId() + ")");

        return nuevoAlbergue;
    }

    // ... Resto de tus métodos (actualizarEstado, eliminar, buscarPorCliente, etc.) ...

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

    @Transactional
    public Reserva asignarRepartidorConValidacionPago(Long reservaId, Long repartidorId) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada con ID: " + reservaId));

        Repartidor repartidor = repartidorRepository.findById(repartidorId)
                .orElseThrow(() -> new RuntimeException("Repartidor no encontrado con ID: " + repartidorId));

        boolean pagoCompletado = validarPagoCliente(reserva.getCliente().getId());

        if (!pagoCompletado) {
            throw new RuntimeException("⚠️ PAGO PENDIENTE: No se puede asignar repartidor.");
        }

        if (reserva.getRepartidoresAsignados() == null) {
            reserva.setRepartidoresAsignados(new ArrayList<>());
        }

        if (!reserva.getRepartidoresAsignados().contains(repartidor)) {
            reserva.getRepartidoresAsignados().add(repartidor);
        }

        reservaRepository.save(reserva);
        crearRutaDiariaConAlbergues(reserva, repartidor);
        return reserva;
    }

    private boolean validarPagoCliente(Long clienteId) {
        List<Factura> facturas = facturaRepository.findByClienteId(clienteId);
        if (facturas == null || facturas.isEmpty()) return false;
        return facturas.stream().anyMatch(f -> "PAGADO".equalsIgnoreCase(f.getEstado()));
    }

    private void crearRutaDiariaConAlbergues(Reserva reserva, Repartidor repartidor) {
        try {
            RutaDiaria rutaDiaria = new RutaDiaria();
            rutaDiaria.setFecha(reserva.getFechaReserva() != null ? reserva.getFechaReserva() : LocalDate.now());
            rutaDiaria.setRepartidor(repartidor);
            rutaDiariaRepository.save(rutaDiaria);

            if (reserva.getPresupuesto() != null) {
                List<PresupuestoDetalle> presupuestoDetalles = presupuestoDetalleRepository
                        .findByPresupuestoId(reserva.getPresupuesto().getId());

                if (presupuestoDetalles != null) {
                    for (PresupuestoDetalle pd : presupuestoDetalles) {
                        RutaDetalle rd = new RutaDetalle();
                        rd.setRutaDiaria(rutaDiaria);
                        rd.setAlbergue(pd.getAlbergue());
                        rd.setOrden(pd.getOrden());
                        rutaDetalleRepository.save(rd);
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Error al crear la ruta diaria: " + e.getMessage());
        }
    }
}