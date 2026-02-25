package com.example.TaxiWaySarria.Service;

import com.example.TaxiWaySarria.DTOs.EtapaCaminoDTO;
import com.example.TaxiWaySarria.DTOs.ReservaDTO;
import com.example.TaxiWaySarria.Model.*;
import com.example.TaxiWaySarria.Repository.*;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import java.io.ByteArrayOutputStream;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private final EmpresaRepository empresaRepository;

    public ReservaService(ReservaRepository reservaRepository,
                          ClienteRepository clienteRepository,
                          FacturaRepository facturaRepository,
                          RutaDiariaRepository rutaDiariaRepository,
                          RutaDetalleRepository rutaDetalleRepository,
                          PresupuestoDetalleRepository presupuestoDetalleRepository,
                          RepartidorRepository repartidorRepository,
                          AgenciaRepository agenciaRepository,
                          AlbergueRepository albergueRepository,
                          EtapaCaminoRepository etapaCaminoRepository,
                          EmpresaRepository empresaRepository) {
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
        this.empresaRepository = empresaRepository;
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

        // 2️⃣ BUSCAR O CREAR AGENCIA
        Agencia agencia = null;
        if (reservaDTO.getAgenciaNombre() != null && !reservaDTO.getAgenciaNombre().trim().isEmpty()) {
            agencia = buscarOCrearAgencia(reservaDTO.getAgenciaNombre().trim());
        }

        // 3️⃣ BUSCAR O CREAR EMPRESA
        Empresa empresa = null;
        if (reservaDTO.getEmpresaNombre() != null && !reservaDTO.getEmpresaNombre().trim().isEmpty()) {
            empresa = buscarOCrearEmpresa(reservaDTO.getEmpresaNombre().trim());
        }

        // 4️⃣ BUSCAR REPARTIDOR (si se proporcionó)
        Repartidor repartidor = null;
        if (reservaDTO.getRepartidorId() != null) {
            repartidor = repartidorRepository.findById(reservaDTO.getRepartidorId()).orElse(null);
        }

        // 5. Crear reserva
        Reserva reserva = new Reserva();
        reserva.setCliente(cliente);
        reserva.setAgencia(agencia);
        reserva.setEmpresa(empresa);
        reserva.setRepartidor(repartidor);
        reserva.setObservaciones(reservaDTO.getObservaciones());
        reserva.setEstado(reservaDTO.getEstado() != null ? reservaDTO.getEstado() : "Pendiente");
        reserva.setFechaCreacion(LocalDateTime.now());
        reserva.setEtapas(new ArrayList<>());

        // 6. Guardar reserva primero
        reserva = reservaRepository.save(reserva);

        // 7. Crear etapas
        double precioTotal = 0.0;

        if (reservaDTO.getEtapas() != null && !reservaDTO.getEtapas().isEmpty()) {
            for (EtapaCaminoDTO etapaDTO : reservaDTO.getEtapas()) {

                Albergue alojamientoSalida = buscarOCrearAlbergue(etapaDTO.getAlojamientoSalidaNombre());
                Albergue alojamientoDestino = buscarOCrearAlbergue(etapaDTO.getAlojamientoDestinoNombre());

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

                etapa = etapaCaminoRepository.save(etapa);
                reserva.getEtapas().add(etapa);

                precioTotal += etapa.getPrecioTotal();
            }
        }

        // 8. Actualizar precio total
        reserva.setPrecioTotal(BigDecimal.valueOf(precioTotal));
        reserva = reservaRepository.save(reserva);

        System.out.println("✅ Reserva completa creada:");
        System.out.println("   - Cliente: " + cliente.getNombre() + " (ID: " + cliente.getId() + ")");
        if (agencia != null) System.out.println("   - Agencia: " + agencia.getNombre());
        if (empresa != null) System.out.println("   - Empresa: " + empresa.getNombre());
        if (repartidor != null) System.out.println("   - Repartidor: " + repartidor.getNombre());
        System.out.println("   - Etapas: " + reserva.getEtapas().size());
        System.out.println("   - Precio total: €" + precioTotal);

        return reserva;
    }

    private Cliente buscarOCrearCliente(String email, String telefono, String nombre, String apellidos) {

        // 1️⃣ Buscar por email
        if (email != null && !email.trim().isEmpty()) {
            List<Cliente> lista = clienteRepository.findAllByEmail(email.trim());

            if (!lista.isEmpty()) {
                return lista.get(0); // devuelve el primero
            }
        }

        // 2️⃣ Buscar por teléfono
        if (telefono != null && !telefono.trim().isEmpty()) {
            List<Cliente> lista = clienteRepository.findAllByTelefono(telefono.trim());

            if (!lista.isEmpty()) {
                return lista.get(0);
            }
        }

        // 3️⃣ Crear cliente nuevo
        if (nombre == null || nombre.trim().isEmpty()) {
            throw new RuntimeException("El nombre del cliente es obligatorio");
        }

        Cliente nuevo = new Cliente();
        nuevo.setNombre(nombre.trim());
        nuevo.setApellidos(apellidos != null ? apellidos.trim() : "");
        nuevo.setTelefono(telefono != null ? telefono.trim() : null);
        nuevo.setEmail(email != null ? email.trim() : null);

        return clienteRepository.save(nuevo);
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
        Albergue albergue = albergueRepository
                .findByNombreAndCiudad(nombre, ciudad)
                .orElse(null);

        if (albergue != null) {
            System.out.println("✅ Albergue encontrado: " + albergue.getNombre() + " (ID: " + albergue.getId() + ")");
            return albergue;
        }

        if (nombreCompleto == null || nombreCompleto.trim().isEmpty()) {
            throw new RuntimeException("El nombre del albergue es obligatorio");
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

    private Empresa buscarOCrearEmpresa(String nombre) {
        Empresa empresa = empresaRepository.findByNombre(nombre).orElse(null);

        if (empresa != null) {
            System.out.println("✅ Empresa encontrada: " + empresa.getNombre() + " (ID: " + empresa.getId() + ")");
            return empresa;
        }

        Empresa nuevaEmpresa = new Empresa();
        nuevaEmpresa.setNombre(nombre);
        nuevaEmpresa = empresaRepository.save(nuevaEmpresa);

        System.out.println("✅ Empresa NUEVA creada: " + nuevaEmpresa.getNombre() + " (ID: " + nuevaEmpresa.getId() + ")");

        return nuevaEmpresa;
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

    @Autowired
    private JavaMailSender mailSender; // Añadir este campo

    /**
     * Genera etiquetas PDF (una por etapa) y las envía por email al cliente
     */
    @Transactional
    public void generarYEnviarEtiquetas(Long reservaId) throws Exception {

        // 1. Obtener reserva con etapas
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        if (reserva.getEtapas() == null || reserva.getEtapas().isEmpty()) {
            throw new RuntimeException("La reserva no tiene etapas");
        }

        if (reserva.getCliente() == null || reserva.getCliente().getEmail() == null) {
            throw new RuntimeException("El cliente no tiene email");
        }

        System.out.println("📋 Generando " + reserva.getEtapas().size() + " etiquetas para reserva #" + reservaId);

        // 2. Generar PDF con etiquetas
        byte[] pdfBytes = generarPDFEtiquetas(reserva);

        // 3. Enviar por email
        enviarEmailConEtiquetas(reserva, pdfBytes);

        System.out.println("✅ Etiquetas enviadas a " + reserva.getCliente().getEmail());
    }

    /**
     * Genera el PDF con las etiquetas usando iText
     */
    private byte[] generarPDFEtiquetas(Reserva reserva) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 10, 10, 10, 10);
        PdfWriter writer = PdfWriter.getInstance(document, baos);
        document.open();

        // Fuentes
        Font fontTitulo = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD);
        Font fontNormal = new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL);
        Font fontSmall = new Font(Font.FontFamily.HELVETICA, 7, Font.NORMAL);
        Font fontBold = new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD);

        int etapaNum = 1;

        for (EtapaCamino etapa : reserva.getEtapas()) {

            // Crear tabla principal (2 columnas: etiqueta izq + lista derecha)
            PdfPTable tablaPrincipal = new PdfPTable(2);
            tablaPrincipal.setWidthPercentage(100);
            tablaPrincipal.setWidths(new float[]{1, 1});

            // ═══════════════════════════════════════════════════════════════════════
            // COLUMNA IZQUIERDA: ETIQUETA DEL CLIENTE
            // ═══════════════════════════════════════════════════════════════════════
            PdfPCell celdaEtiqueta = new PdfPCell();
            celdaEtiqueta.setBorder(Rectangle.BOX);
            celdaEtiqueta.setPadding(8);

            // Logo "TaxiCamino" (simulado con texto amarillo)
            Paragraph logo = new Paragraph("← TaxiCamino", new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD, BaseColor.ORANGE));
            logo.setAlignment(Element.ALIGN_CENTER);
            celdaEtiqueta.addElement(logo);

            celdaEtiqueta.addElement(new Paragraph(" ")); // Espacio

            // Título "Etiqueta Luggage Tag"
            Paragraph titulo = new Paragraph("Etiqueta\nLuggage Tag\nEtiquette Bagage", fontSmall);
            titulo.setAlignment(Element.ALIGN_CENTER);
            celdaEtiqueta.addElement(titulo);

            celdaEtiqueta.addElement(new Paragraph(" ")); // Espacio

            // Nombre del cliente
            Paragraph nombre = new Paragraph(reserva.getCliente().getNombre() + " " +
                    (reserva.getCliente().getApellidos() != null ? reserva.getCliente().getApellidos() : ""),
                    fontBold);
            nombre.setAlignment(Element.ALIGN_CENTER);
            celdaEtiqueta.addElement(nombre);

            celdaEtiqueta.addElement(new Paragraph(" ")); // Espacio

            // Número de reserva
            String codigoReserva = "TALU/" + reserva.getCliente().getNombre().replace(" ", "") + "/RTL/" + reserva.getId();
            Paragraph nReserva = new Paragraph("Nº Reserva / Booking Number / Nº Réservation:\n" + codigoReserva, fontSmall);
            nReserva.setAlignment(Element.ALIGN_CENTER);
            celdaEtiqueta.addElement(nReserva);

            celdaEtiqueta.addElement(new Paragraph(" ")); // Espacio

            // Agencia / Empresa
            String agenciaTexto = "Agencia viajes/ Travel Agency / Agent de voyage";
            if (reserva.getAgencia() != null) {
                agenciaTexto = reserva.getAgencia().getNombre();
            } else if (reserva.getEmpresa() != null) {
                agenciaTexto = reserva.getEmpresa().getNombre();
            } else {
                agenciaTexto = "TAXICAMINO LUGO";
            }
            Paragraph agencia = new Paragraph(agenciaTexto, fontBold);
            agencia.setAlignment(Element.ALIGN_CENTER);
            celdaEtiqueta.addElement(agencia);

            celdaEtiqueta.addElement(new Paragraph(" ")); // Espacio

            // Teléfono
            Paragraph telefono = new Paragraph("Teléfono / Phone / Téléphone\n+34062259908", fontNormal);
            telefono.setAlignment(Element.ALIGN_CENTER);
            celdaEtiqueta.addElement(telefono);

            celdaEtiqueta.addElement(new Paragraph(" ")); // Espacio

            // Código QR (simulado con texto)
            Paragraph qr = new Paragraph("[QR CODE]\n" + codigoReserva, fontSmall);
            qr.setAlignment(Element.ALIGN_CENTER);
            celdaEtiqueta.addElement(qr);

            celdaEtiqueta.addElement(new Paragraph(" ")); // Espacio

            // URL
            Paragraph url = new Paragraph("taxicamino.jacotrans.es", fontSmall);
            url.setAlignment(Element.ALIGN_CENTER);
            celdaEtiqueta.addElement(url);

            tablaPrincipal.addCell(celdaEtiqueta);

            // ═══════════════════════════════════════════════════════════════════════
            // COLUMNA DERECHA: LISTA DE SERVICIOS (TODAS LAS ETAPAS)
            // ═══════════════════════════════════════════════════════════════════════
            PdfPCell celdaLista = new PdfPCell();
            celdaLista.setBorder(Rectangle.BOX);
            celdaLista.setPadding(8);

            // Título "Lista de servicios"
            Paragraph tituloLista = new Paragraph("← TaxiCamino\n\nLista de servicios", fontTitulo);
            tituloLista.setAlignment(Element.ALIGN_CENTER);
            celdaLista.addElement(tituloLista);

            celdaLista.addElement(new Paragraph(" ")); // Espacio

            // Tabla de etapas
            PdfPTable tablaEtapas = new PdfPTable(4);
            tablaEtapas.setWidthPercentage(100);
            tablaEtapas.setWidths(new float[]{2, 1, 3, 3});

            // Headers
            addCeldaHeader(tablaEtapas, "Fecha", fontBold);
            addCeldaHeader(tablaEtapas, "Uds", fontBold);
            addCeldaHeader(tablaEtapas, "Alojamiento", fontBold);
            addCeldaHeader(tablaEtapas, "Destino", fontBold);

            // Filas de etapas
            for (EtapaCamino e : reserva.getEtapas()) {
                addCeldaDato(tablaEtapas, e.getFecha() != null ? e.getFecha().toString() : "", fontSmall);
                addCeldaDato(tablaEtapas, String.valueOf(e.getCantidadMochilas()), fontSmall);
                addCeldaDato(tablaEtapas, e.getAlojamientoSalida() != null ? e.getAlojamientoSalida().getNombre() : "—", fontSmall);
                addCeldaDato(tablaEtapas, e.getAlojamientoDestino() != null ? e.getAlojamientoDestino().getNombre() : "—", fontSmall);
            }

            celdaLista.addElement(tablaEtapas);
            tablaPrincipal.addCell(celdaLista);

            // Añadir tabla al documento
            document.add(tablaPrincipal);

            // Añadir línea de corte (tijeras)
            Paragraph lineaCorte = new Paragraph("✂ -----------------------------------------------------------------------------------------------------------------------", fontSmall);
            lineaCorte.setAlignment(Element.ALIGN_CENTER);
            lineaCorte.setSpacingBefore(10);
            lineaCorte.setSpacingAfter(10);
            document.add(lineaCorte);

            etapaNum++;
        }

        document.close();
        return baos.toByteArray();
    }

    /**
     * Helper para añadir celda de header
     */
    private void addCeldaHeader(PdfPTable tabla, String texto, Font font) {
        PdfPCell celda = new PdfPCell(new Phrase(texto, font));
        celda.setBackgroundColor(BaseColor.LIGHT_GRAY);
        celda.setHorizontalAlignment(Element.ALIGN_CENTER);
        celda.setPadding(3);
        tabla.addCell(celda);
    }

    /**
     * Helper para añadir celda de dato
     */
    private void addCeldaDato(PdfPTable tabla, String texto, Font font) {
        PdfPCell celda = new PdfPCell(new Phrase(texto, font));
        celda.setPadding(3);
        tabla.addCell(celda);
    }

    /**
     * Envía el email con el PDF adjunto
     */
    private void enviarEmailConEtiquetas(Reserva reserva, byte[] pdfBytes) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(reserva.getCliente().getEmail());
        helper.setSubject("🏷️ Etiquetas para tu reserva - TaxiCamino");
        helper.setText(
                "<html><body>" +
                        "<h2>¡Hola " + reserva.getCliente().getNombre() + "!</h2>" +
                        "<p>Adjuntamos las etiquetas para tu equipaje del Camino de Santiago.</p>" +
                        "<p><strong>Reserva #" + reserva.getId() + "</strong></p>" +
                        "<p>📦 Total de etiquetas: <strong>" + reserva.getEtapas().size() + "</strong></p>" +
                        "<p>Por favor, imprime las etiquetas y colócalas en tu equipaje.</p>" +
                        "<br>" +
                        "<p>¡Buen Camino! 🚶‍♂️</p>" +
                        "<p>--<br>TaxiCamino Lugo<br>+34 062 259 908<br>taxicamino.jacotrans.es</p>" +
                        "</body></html>",
                true
        );

        // Adjuntar PDF
        helper.addAttachment("etiquetas_reserva_" + reserva.getId() + ".pdf",
                new ByteArrayResource(pdfBytes));

        mailSender.send(message);
    }
}