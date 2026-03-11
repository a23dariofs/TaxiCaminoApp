package com.example.TaxiWaySarria.Service;

import com.example.TaxiWaySarria.Model.*;
import com.example.TaxiWaySarria.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class FacturaService {

    private final FacturaRepository facturaRepository;
    private final ClienteRepository clienteRepository;

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private AgenciaRepository agenciaRepository;

    public FacturaService(FacturaRepository facturaRepository, ClienteRepository clienteRepository) {
        this.facturaRepository = facturaRepository;
        this.clienteRepository = clienteRepository;
    }

    public List<Factura> listarTodas() {
        return facturaRepository.findAll();
    }

    public Factura buscarPorId(Long id) {
        return facturaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Factura no encontrada con id: " + id));
    }

    public Factura crear(Long clienteId, Factura factura) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado con id: " + clienteId));

        factura.setCliente(cliente);
        factura.setFechaEmision(LocalDate.now());

        // ✅ ASOCIAR AGENCIA SI SE PROPORCIONÓ
        if (factura.getAgenciaId() != null) {
            Agencia agencia = agenciaRepository.findById(factura.getAgenciaId())
                    .orElse(null);
            if (agencia != null) {
                factura.setAgencia(agencia);
                System.out.println("✅ Agencia asignada a factura: " + agencia.getNombre());
            } else {
                System.out.println("⚠️ Agencia con ID " + factura.getAgenciaId() + " no encontrada");
            }
        }

        Factura saved = facturaRepository.save(factura);
        System.out.println("✅ Factura guardada - ID: " + saved.getId() +
                " | Agencia: " + (saved.getAgencia() != null ? saved.getAgencia().getNombre() : "Sin agencia"));

        return saved;
    }

    public Factura actualizar(Long id, Factura facturaActualizada) {
        Factura factura = buscarPorId(id);

        if (facturaActualizada.getFechaEmision() != null) {
            factura.setFechaEmision(facturaActualizada.getFechaEmision());
        }
        if (facturaActualizada.getFechaPago() != null) {
            factura.setFechaPago(facturaActualizada.getFechaPago());
        }
        if (facturaActualizada.getImporteTotal() != null) {
            factura.setImporteTotal(facturaActualizada.getImporteTotal());
        }
        if (facturaActualizada.getEstado() != null) {
            factura.setEstado(facturaActualizada.getEstado());
        }
        if (facturaActualizada.getMetodoPago() != null) {
            factura.setMetodoPago(facturaActualizada.getMetodoPago());
        }
        if (facturaActualizada.getConcepto() != null) {
            factura.setConcepto(facturaActualizada.getConcepto());
        }

        // ✅ AÑADIR: Actualizar tipoServicio
        if (facturaActualizada.getTipoServicio() != null) {
            factura.setTipoServicio(facturaActualizada.getTipoServicio());
        }

        // ✅ ACTUALIZAR AGENCIA
        if (facturaActualizada.getAgenciaId() != null) {
            Agencia agencia = agenciaRepository.findById(facturaActualizada.getAgenciaId())
                    .orElse(null);
            factura.setAgencia(agencia);
            System.out.println("✅ Agencia actualizada: " + (agencia != null ? agencia.getNombre() : "Sin agencia"));
        }

        return facturaRepository.save(factura);
    }

    public void eliminar(Long id) {
        facturaRepository.deleteById(id);
    }

    public List<Factura> listarPorCliente(Long clienteId) {
        return facturaRepository.findByClienteId(clienteId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GENERAR FACTURA PDF POR AGENCIA (Método antiguo - mantener por compatibilidad)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Genera un PDF de factura para una agencia en un periodo de tiempo
     */
    public byte[] generarFacturaPDFAgencia(Long agenciaId, LocalDate fechaInicio, LocalDate fechaFin, List<Long> reservasIds) throws Exception {

        // 1. Obtener agencia
        Agencia agencia = agenciaRepository.findById(agenciaId)
                .orElseThrow(() -> new RuntimeException("Agencia no encontrada"));

        // 2. Obtener reservas
        List<Reserva> reservas = reservaRepository.findAllById(reservasIds);

        if (reservas.isEmpty()) {
            throw new RuntimeException("No se encontraron reservas");
        }

        // 3. Generar PDF
        return generarPDFFactura(agencia, reservas, fechaInicio, fechaFin);
    }

    private byte[] generarPDFFactura(Agencia agencia, List<Reserva> reservas, LocalDate fechaInicio, LocalDate fechaFin) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 40, 40, 40, 40);
        PdfWriter.getInstance(document, baos);
        document.open();

        // Fuentes
        Font fontTituloGrande = new Font(Font.FontFamily.HELVETICA, 24, Font.BOLD, new BaseColor(23, 115, 207));
        Font fontNormal = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL);
        Font fontBold = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD);
        Font fontSmall = new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL);

        // Título
        Paragraph titulo = new Paragraph("FACTURA", fontTituloGrande);
        titulo.setAlignment(Element.ALIGN_CENTER);
        titulo.setSpacingAfter(20);
        document.add(titulo);

        // Tabla info básica
        PdfPTable tablaInfo = new PdfPTable(2);
        tablaInfo.setWidthPercentage(100);
        tablaInfo.setWidths(new float[]{1, 1});

        // Datos del cliente (agencia)
        PdfPCell celdaIzq = new PdfPCell();
        celdaIzq.setBorder(Rectangle.NO_BORDER);
        celdaIzq.addElement(new Paragraph("*NOMBRE Y APELLIDOS*", fontSmall));
        celdaIzq.addElement(new Paragraph(agencia.getNombre(), fontBold));
        celdaIzq.addElement(new Paragraph("*DNI*", fontSmall));
        celdaIzq.addElement(new Paragraph("*DIRECCIÓN*", fontSmall));
        celdaIzq.addElement(new Paragraph(agencia.getDireccion() != null ? agencia.getDireccion() : "", fontNormal));
        celdaIzq.addElement(new Paragraph("TELEFONO:", fontSmall));
        celdaIzq.addElement(new Paragraph(agencia.getTelefono() != null ? agencia.getTelefono() : "", fontNormal));
        celdaIzq.addElement(new Paragraph("CORREO:", fontSmall));
        celdaIzq.addElement(new Paragraph(agencia.getEmail() != null ? agencia.getEmail() : "", fontNormal));
        tablaInfo.addCell(celdaIzq);

        // Datos de la factura
        PdfPCell celdaDer = new PdfPCell();
        celdaDer.setBorder(Rectangle.NO_BORDER);
        celdaDer.setHorizontalAlignment(Element.ALIGN_RIGHT);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String numFactura = "TC-" + String.format("%04d", agencia.getId());

        celdaDer.addElement(new Paragraph("FECHA: " + LocalDate.now().format(formatter), fontNormal));
        celdaDer.addElement(new Paragraph("Nº FACTURA: " + numFactura, fontBold));
        celdaDer.addElement(new Paragraph("ID CLIENTE: " + agencia.getId(), fontNormal));
        tablaInfo.addCell(celdaDer);

        document.add(tablaInfo);
        document.add(new Paragraph(" "));

        // FACTURAR A
        PdfPTable tablaFacturarA = new PdfPTable(1);
        tablaFacturarA.setWidthPercentage(100);

        PdfPCell celdaFacturarA = new PdfPCell();
        celdaFacturarA.setBackgroundColor(new BaseColor(23, 115, 207));
        celdaFacturarA.setPadding(5);
        celdaFacturarA.addElement(new Paragraph("FACTURAR A:", new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BaseColor.WHITE)));
        tablaFacturarA.addCell(celdaFacturarA);

        document.add(tablaFacturarA);

        // Datos emisor
        PdfPTable tablaEmisor = new PdfPTable(1);
        tablaEmisor.setWidthPercentage(100);

        PdfPCell celdaEmisor = new PdfPCell();
        celdaEmisor.setBorder(Rectangle.BOX);
        celdaEmisor.setPadding(8);
        celdaEmisor.addElement(new Paragraph("CLIENTE DE PRUEBA", fontBold));
        celdaEmisor.addElement(new Paragraph("11111111A", fontNormal));
        celdaEmisor.addElement(new Paragraph("LUGAR DE PRUEBA", fontNormal));
        celdaEmisor.addElement(new Paragraph("PROVINCIA DE PRUEBA", fontNormal));
        celdaEmisor.addElement(new Paragraph("666666666", fontNormal));
        tablaEmisor.addCell(celdaEmisor);

        document.add(tablaEmisor);
        document.add(new Paragraph(" "));

        // Tabla servicios
        PdfPTable tablaServicios = new PdfPTable(2);
        tablaServicios.setWidthPercentage(100);
        tablaServicios.setWidths(new float[]{4, 1});

        // Headers
        PdfPCell headerDesc = new PdfPCell(new Phrase("DESCRIPCIÓN", new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BaseColor.WHITE)));
        headerDesc.setBackgroundColor(new BaseColor(23, 115, 207));
        headerDesc.setHorizontalAlignment(Element.ALIGN_CENTER);
        headerDesc.setPadding(8);
        tablaServicios.addCell(headerDesc);

        PdfPCell headerImporte = new PdfPCell(new Phrase("IMPORTE", new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BaseColor.WHITE)));
        headerImporte.setBackgroundColor(new BaseColor(23, 115, 207));
        headerImporte.setHorizontalAlignment(Element.ALIGN_CENTER);
        headerImporte.setPadding(8);
        tablaServicios.addCell(headerImporte);

        // Filas
        double subtotal = 0.0;

        for (Reserva reserva : reservas) {
            String descripcion = "Servicio de transporte de equipaje - ";

            if (reserva.getEtapas() != null && !reserva.getEtapas().isEmpty()) {
                EtapaCamino primera = reserva.getEtapas().get(0);
                EtapaCamino ultima = reserva.getEtapas().get(reserva.getEtapas().size() - 1);

                descripcion +=
                        (primera.getAlojamientoSalida() != null ? primera.getAlojamientoSalida() : "—") +
                                " → " +
                                (ultima.getAlojamientoDestino() != null ? ultima.getAlojamientoDestino() : "—");
            } else {
                descripcion += "— → —";
            }

            descripcion += " (" + (reserva.getFechaCreacion() != null ?
                    reserva.getFechaCreacion().toLocalDate().format(formatter) : "") + ")";

            double importe = reserva.getPrecioTotal() != null ? reserva.getPrecioTotal().doubleValue() : 0.0;
            subtotal += importe;

            PdfPCell celdaDesc = new PdfPCell(new Phrase(descripcion, fontNormal));
            celdaDesc.setPadding(8);
            celdaDesc.setBorder(Rectangle.LEFT | Rectangle.RIGHT);
            tablaServicios.addCell(celdaDesc);

            PdfPCell celdaImporte = new PdfPCell(new Phrase(String.format("%.2f €", importe), fontNormal));
            celdaImporte.setPadding(8);
            celdaImporte.setHorizontalAlignment(Element.ALIGN_RIGHT);
            celdaImporte.setBorder(Rectangle.LEFT | Rectangle.RIGHT);
            tablaServicios.addCell(celdaImporte);
        }

        // Espacio vacío
        PdfPCell celdaVacia = new PdfPCell(new Phrase("", fontNormal));
        celdaVacia.setMinimumHeight(150);
        celdaVacia.setBorder(Rectangle.LEFT | Rectangle.RIGHT | Rectangle.BOTTOM);
        tablaServicios.addCell(celdaVacia);

        PdfPCell celdaVacia2 = new PdfPCell(new Phrase("", fontNormal));
        celdaVacia2.setMinimumHeight(150);
        celdaVacia2.setBorder(Rectangle.LEFT | Rectangle.RIGHT | Rectangle.BOTTOM);
        tablaServicios.addCell(celdaVacia2);

        document.add(tablaServicios);
        document.add(new Paragraph(" "));

        // Totales
        PdfPTable tablaFinal = new PdfPTable(2);
        tablaFinal.setWidthPercentage(100);
        tablaFinal.setWidths(new float[]{1, 1});

        // Comentarios
        PdfPCell celdaComentarios = new PdfPCell();
        celdaComentarios.setBorder(Rectangle.BOX);
        celdaComentarios.setPadding(8);
        celdaComentarios.addElement(new Paragraph("OTROS COMENTARIOS", fontBold));
        celdaComentarios.addElement(new Paragraph(" "));
        celdaComentarios.addElement(new Paragraph("Nº DE CUENTA:", fontBold));
        tablaFinal.addCell(celdaComentarios);

        // Totales
        PdfPCell celdaTotales = new PdfPCell();
        celdaTotales.setBorder(Rectangle.BOX);
        celdaTotales.setPadding(8);

        double iva = subtotal * 0.10;
        double total = subtotal + iva;

        PdfPTable tablaTotales = new PdfPTable(2);
        tablaTotales.setWidthPercentage(100);
        tablaTotales.setWidths(new float[]{1, 1});

        addTotalRow(tablaTotales, "SUBTOTAL", String.format("%.2f €", subtotal), fontNormal, new BaseColor(144, 238, 144));
        addTotalRow(tablaTotales, "IVA", "10,00%", fontNormal, BaseColor.WHITE);
        addTotalRow(tablaTotales, "IMPUESTOS", String.format("%.2f €", iva), fontNormal, new BaseColor(173, 216, 230));
        addTotalRow(tablaTotales, "TOTAL", String.format("%.2f €", total), fontBold, new BaseColor(144, 238, 144));

        celdaTotales.addElement(tablaTotales);
        tablaFinal.addCell(celdaTotales);

        document.add(tablaFinal);

        // Texto final
        document.add(new Paragraph(" "));
        Paragraph textoFinal = new Paragraph("Realice el ingreso a nombre de:\n*NOMBRE Y APELLIDOS*", fontNormal);
        textoFinal.setAlignment(Element.ALIGN_CENTER);
        document.add(textoFinal);

        document.add(new Paragraph(" "));
        Paragraph contacto = new Paragraph("Si tiene cualquier duda sobre la factura, contacte conmigo en:\n*Nº DE TELEFONO*, *CORREO ELECTRONICO*", fontSmall);
        contacto.setAlignment(Element.ALIGN_CENTER);
        document.add(contacto);

        document.close();
        return baos.toByteArray();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ✅ NUEVO: GENERAR FACTURA PDF CON IVA DINÁMICO (10% o 21%)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Genera una factura PDF consolidada para una agencia con IVA dinámico
     * según el tipo de servicio (Viaje Taxi = 10%, Viaje mochilas = 21%)
     */
    public byte[] generarFacturaAgenciaPDF(Map<String, Object> facturaData) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 40, 40, 40, 40);
        PdfWriter.getInstance(document, baos);
        document.open();

        // Fuentes
        Font fontTituloGrande = new Font(Font.FontFamily.HELVETICA, 24, Font.BOLD, new BaseColor(23, 115, 207));
        Font fontTitulo = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD);
        Font fontNormal = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL);
        Font fontBold = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD);
        Font fontSmall = new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL);

        // Extraer datos
        @SuppressWarnings("unchecked")
        Map<String, String> agencia = (Map<String, String>) facturaData.get("agencia");
        String numeroFactura = (String) facturaData.get("numeroFactura");
        String fechaEmision = (String) facturaData.get("fechaEmision");
        String fechaInicio = (String) facturaData.get("fechaInicio");
        String fechaFin = (String) facturaData.get("fechaFin");
        String tipoServicio = (String) facturaData.get("tipoServicio"); // ✅ NUEVO

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> pagos = (List<Map<String, Object>>) facturaData.get("pagos");

        String subtotalStr = (String) facturaData.get("subtotal");
        String ivaStr = (String) facturaData.get("iva");
        String totalStr = (String) facturaData.get("total");

        // ✅ NUEVO: Obtener porcentaje de IVA (10 o 21)
        Object porcentajeIVAObj = facturaData.get("porcentajeIVA");
        double porcentajeIVA = porcentajeIVAObj != null ? ((Number) porcentajeIVAObj).doubleValue() : 21.0;

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        LocalDate fechaEmisionDate = LocalDate.parse(fechaEmision);

        // ═══════════════════════════════════════════════════════════════════════
        // CABECERA: FACTURA
        // ═══════════════════════════════════════════════════════════════════════
        Paragraph titulo = new Paragraph("FACTURA", fontTituloGrande);
        titulo.setAlignment(Element.ALIGN_CENTER);
        titulo.setSpacingAfter(20);
        document.add(titulo);

        // Tabla de información básica
        PdfPTable tablaInfo = new PdfPTable(2);
        tablaInfo.setWidthPercentage(100);
        tablaInfo.setWidths(new float[]{1, 1});

        // Columna izquierda: Datos del cliente (agencia)
        PdfPCell celdaIzq = new PdfPCell();
        celdaIzq.setBorder(Rectangle.NO_BORDER);
        celdaIzq.addElement(new Paragraph("CLIENTE", fontSmall));
        celdaIzq.addElement(new Paragraph(agencia.get("nombre"), fontBold));
        celdaIzq.addElement(new Paragraph("CIF/NIF", fontSmall));
        celdaIzq.addElement(new Paragraph(agencia.get("cif"), fontNormal));
        celdaIzq.addElement(new Paragraph("DIRECCIÓN", fontSmall));
        celdaIzq.addElement(new Paragraph(agencia.get("direccion"), fontNormal));
        celdaIzq.addElement(new Paragraph("TELÉFONO:", fontSmall));
        celdaIzq.addElement(new Paragraph(agencia.get("telefono"), fontNormal));
        celdaIzq.addElement(new Paragraph("CORREO:", fontSmall));
        celdaIzq.addElement(new Paragraph(agencia.get("email"), fontNormal));
        tablaInfo.addCell(celdaIzq);

        // Columna derecha: Datos de la factura
        PdfPCell celdaDer = new PdfPCell();
        celdaDer.setBorder(Rectangle.NO_BORDER);
        celdaDer.setHorizontalAlignment(Element.ALIGN_RIGHT);
        celdaDer.addElement(new Paragraph("FECHA: " + fechaEmisionDate.format(formatter), fontNormal));
        celdaDer.addElement(new Paragraph("Nº FACTURA: " + numeroFactura, fontBold));
        celdaDer.addElement(new Paragraph("PERIODO: " + fechaInicio + " / " + fechaFin, fontSmall));
        // ✅ AÑADIR: Tipo de servicio
        celdaDer.addElement(new Paragraph("TIPO: " + tipoServicio + " (IVA " + String.format("%.0f", porcentajeIVA) + "%)", fontSmall));
        tablaInfo.addCell(celdaDer);

        document.add(tablaInfo);
        document.add(new Paragraph(" "));

        // ═══════════════════════════════════════════════════════════════════════
        // FACTURAR A (cuadro azul)
        // ═══════════════════════════════════════════════════════════════════════
        PdfPTable tablaFacturarA = new PdfPTable(1);
        tablaFacturarA.setWidthPercentage(100);

        PdfPCell celdaFacturarA = new PdfPCell();
        celdaFacturarA.setBackgroundColor(new BaseColor(23, 115, 207));
        celdaFacturarA.setPadding(5);
        celdaFacturarA.addElement(new Paragraph("FACTURAR A:", new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BaseColor.WHITE)));
        tablaFacturarA.addCell(celdaFacturarA);

        document.add(tablaFacturarA);

        // Datos del emisor (TaxiCamino)
        PdfPTable tablaEmisor = new PdfPTable(1);
        tablaEmisor.setWidthPercentage(100);

        PdfPCell celdaEmisor = new PdfPCell();
        celdaEmisor.setBorder(Rectangle.BOX);
        celdaEmisor.setPadding(8);
        celdaEmisor.addElement(new Paragraph("TAXICAMINO LUGO", fontBold));
        celdaEmisor.addElement(new Paragraph("B12345678", fontNormal));
        celdaEmisor.addElement(new Paragraph("Calle Principal, 123", fontNormal));
        celdaEmisor.addElement(new Paragraph("27001 Lugo", fontNormal));
        celdaEmisor.addElement(new Paragraph("Tel: 982 123 456", fontNormal));
        tablaEmisor.addCell(celdaEmisor);

        document.add(tablaEmisor);
        document.add(new Paragraph(" "));

        // ═══════════════════════════════════════════════════════════════════════
        // TABLA DE PAGOS
        // ═══════════════════════════════════════════════════════════════════════
        PdfPTable tablaServicios = new PdfPTable(4);
        tablaServicios.setWidthPercentage(100);
        tablaServicios.setWidths(new float[]{1.5f, 3f, 1.5f, 1.5f});

        // Headers
        String[] headers = {"FECHA", "CONCEPTO", "CLIENTE", "IMPORTE"};
        for (String header : headers) {
            PdfPCell headerCell = new PdfPCell(new Phrase(header, new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BaseColor.WHITE)));
            headerCell.setBackgroundColor(new BaseColor(23, 115, 207));
            headerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            headerCell.setPadding(8);
            tablaServicios.addCell(headerCell);
        }

        // Filas de pagos
        for (Map<String, Object> pago : pagos) {
            String fecha = pago.get("fecha") != null ? LocalDate.parse(pago.get("fecha").toString()).format(formatter) : "—";
            String concepto = (String) pago.get("concepto");
            String cliente = (String) pago.get("cliente");
            double importe = ((Number) pago.get("importe")).doubleValue();

            PdfPCell celdaFecha = new PdfPCell(new Phrase(fecha, fontSmall));
            celdaFecha.setPadding(6);
            celdaFecha.setBorder(Rectangle.LEFT | Rectangle.RIGHT);
            tablaServicios.addCell(celdaFecha);

            PdfPCell celdaConcepto = new PdfPCell(new Phrase(concepto, fontSmall));
            celdaConcepto.setPadding(6);
            celdaConcepto.setBorder(Rectangle.LEFT | Rectangle.RIGHT);
            tablaServicios.addCell(celdaConcepto);

            PdfPCell celdaCliente = new PdfPCell(new Phrase(cliente, fontSmall));
            celdaCliente.setPadding(6);
            celdaCliente.setBorder(Rectangle.LEFT | Rectangle.RIGHT);
            tablaServicios.addCell(celdaCliente);

            PdfPCell celdaImporte = new PdfPCell(new Phrase(String.format("%.2f €", importe), fontSmall));
            celdaImporte.setPadding(6);
            celdaImporte.setHorizontalAlignment(Element.ALIGN_RIGHT);
            celdaImporte.setBorder(Rectangle.LEFT | Rectangle.RIGHT);
            tablaServicios.addCell(celdaImporte);
        }

        // Espacio vacío
        for (int i = 0; i < 4; i++) {
            PdfPCell celdaVacia = new PdfPCell(new Phrase("", fontNormal));
            celdaVacia.setMinimumHeight(50);
            celdaVacia.setBorder(Rectangle.LEFT | Rectangle.RIGHT | Rectangle.BOTTOM);
            tablaServicios.addCell(celdaVacia);
        }

        document.add(tablaServicios);
        document.add(new Paragraph(" "));

        // ═══════════════════════════════════════════════════════════════════════
        // SECCIÓN DE TOTALES
        // ═══════════════════════════════════════════════════════════════════════
        PdfPTable tablaFinal = new PdfPTable(2);
        tablaFinal.setWidthPercentage(100);
        tablaFinal.setWidths(new float[]{1, 1});

        // Columna izquierda: Observaciones
        PdfPCell celdaComentarios = new PdfPCell();
        celdaComentarios.setBorder(Rectangle.BOX);
        celdaComentarios.setPadding(8);
        celdaComentarios.addElement(new Paragraph("OBSERVACIONES", fontBold));
        celdaComentarios.addElement(new Paragraph(" "));
        celdaComentarios.addElement(new Paragraph("Factura correspondiente a los servicios", fontSmall));
        celdaComentarios.addElement(new Paragraph("prestados del " + fechaInicio + " al " + fechaFin, fontSmall));
        celdaComentarios.addElement(new Paragraph(" "));
        celdaComentarios.addElement(new Paragraph("FORMA DE PAGO:", fontBold));
        celdaComentarios.addElement(new Paragraph("Transferencia bancaria", fontSmall));
        celdaComentarios.addElement(new Paragraph("IBAN: ES12 3456 7890 1234 5678 9012", fontSmall));
        tablaFinal.addCell(celdaComentarios);

        // Columna derecha: Totales
        PdfPCell celdaTotales = new PdfPCell();
        celdaTotales.setBorder(Rectangle.BOX);
        celdaTotales.setPadding(8);

        PdfPTable tablaTotales = new PdfPTable(2);
        tablaTotales.setWidthPercentage(100);
        tablaTotales.setWidths(new float[]{1, 1});

        addTotalRow(tablaTotales, "SUBTOTAL", subtotalStr + " €", fontNormal, new BaseColor(144, 238, 144));
        // ✅ Mostrar IVA con el porcentaje correcto (10% o 21%)
        addTotalRow(tablaTotales, "IVA (" + String.format("%.0f", porcentajeIVA) + "%)", ivaStr + " €", fontNormal, new BaseColor(173, 216, 230));
        addTotalRow(tablaTotales, "TOTAL", totalStr + " €", fontBold, new BaseColor(144, 238, 144));

        celdaTotales.addElement(tablaTotales);
        tablaFinal.addCell(celdaTotales);

        document.add(tablaFinal);

        // Texto final
        document.add(new Paragraph(" "));
        Paragraph textoFinal = new Paragraph("Gracias por confiar en nuestros servicios", new Font(Font.FontFamily.HELVETICA, 9, Font.ITALIC, BaseColor.GRAY));
        textoFinal.setAlignment(Element.ALIGN_CENTER);
        document.add(textoFinal);

        document.add(new Paragraph(" "));
        Paragraph contacto = new Paragraph("Para cualquier consulta: info@taxicamino.com | Tel: 982 123 456", fontSmall);
        contacto.setAlignment(Element.ALIGN_CENTER);
        document.add(contacto);

        document.close();
        return baos.toByteArray();
    }

    private void addTotalRow(PdfPTable tabla, String concepto, String valor, Font font, BaseColor bgColor) {
        PdfPCell celdaConcepto = new PdfPCell(new Phrase(concepto, font));
        celdaConcepto.setBackgroundColor(bgColor);
        celdaConcepto.setPadding(5);
        celdaConcepto.setBorder(Rectangle.BOX);
        tabla.addCell(celdaConcepto);

        PdfPCell celdaValor = new PdfPCell(new Phrase(valor, font));
        celdaValor.setBackgroundColor(bgColor);
        celdaValor.setPadding(5);
        celdaValor.setHorizontalAlignment(Element.ALIGN_RIGHT);
        celdaValor.setBorder(Rectangle.BOX);
        tabla.addCell(celdaValor);
    }
}