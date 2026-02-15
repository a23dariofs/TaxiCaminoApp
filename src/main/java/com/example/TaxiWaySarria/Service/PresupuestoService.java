package com.example.TaxiWaySarria.Service;

import com.example.TaxiWaySarria.Model.*;
import com.example.TaxiWaySarria.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.internet.MimeMessage;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PresupuestoService {

    private final PresupuestoRepository presupuestoRepository;
    private final PresupuestoDetalleRepository presupuestoDetalleRepository;
    private final ReservaRepository reservaRepository;
    private final FacturaRepository facturaRepository;
    private final LineaFacturaRepository lineaFacturaRepository;

    @Autowired
    private JavaMailSender mailSender;

    public PresupuestoService(PresupuestoRepository presupuestoRepository,
                              PresupuestoDetalleRepository presupuestoDetalleRepository,
                              ReservaRepository reservaRepository,
                              FacturaRepository facturaRepository,
                              LineaFacturaRepository lineaFacturaRepository) {
        this.presupuestoRepository = presupuestoRepository;
        this.presupuestoDetalleRepository = presupuestoDetalleRepository;
        this.reservaRepository = reservaRepository;
        this.facturaRepository = facturaRepository;
        this.lineaFacturaRepository = lineaFacturaRepository;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MÉTODOS CRUD BÁSICOS
    // ═══════════════════════════════════════════════════════════════════════════

    public List<Presupuesto> findAll() {
        return presupuestoRepository.findAll();
    }

    public Optional<Presupuesto> findById(Long id) {
        return presupuestoRepository.findById(id);
    }

    public Presupuesto save(Presupuesto presupuesto) {
        return presupuestoRepository.save(presupuesto);
    }

    public void deleteById(Long id) {
        presupuestoRepository.deleteById(id);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ACEPTAR PRESUPUESTO
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public boolean aceptarPresupuesto(String token) {
        Optional<Presupuesto> presupuestoOpt = presupuestoRepository.findByTokenAceptacion(token);

        if (presupuestoOpt.isEmpty()) {
            return false;
        }

        Presupuesto presupuesto = presupuestoOpt.get();

        if ("ACEPTADO".equalsIgnoreCase(presupuesto.getEstado()) ||
                "Aceptado".equalsIgnoreCase(presupuesto.getEstado())) {
            throw new RuntimeException("Este presupuesto ya ha sido aceptado previamente");
        }

        try {
            presupuesto.setEstado("Aceptado");
            presupuestoRepository.save(presupuesto);

            Reserva reserva = new Reserva();
            reserva.setCliente(presupuesto.getCliente());
            reserva.setPresupuesto(presupuesto);
            reserva.setFechaReserva(presupuesto.getFechaViaje() != null ? presupuesto.getFechaViaje() : LocalDate.now());
            reserva.setEstado("Confirmada");
            reserva.setRepartidoresAsignados(new ArrayList<>());
            reservaRepository.save(reserva);

            Factura factura = new Factura();
            factura.setCliente(presupuesto.getCliente());
            factura.setFechaEmision(LocalDate.now());
            factura.setImporteTotal(presupuesto.getPrecioTotal());
            factura.setEstado("PENDIENTE");
            factura.setMetodoPago("Pendiente de pago");

            String conceptoBase = String.format("Servicio de transporte: %s → %s",
                    presupuesto.getOrigen() != null ? presupuesto.getOrigen() : "Origen",
                    presupuesto.getDestino() != null ? presupuesto.getDestino() : "Destino");
            factura.setConcepto(conceptoBase);

            facturaRepository.save(factura);

            List<PresupuestoDetalle> detalles = presupuestoDetalleRepository.findByPresupuestoId(presupuesto.getId());

            if (detalles != null && !detalles.isEmpty()) {
                for (PresupuestoDetalle detalle : detalles) {
                    String conceptoLinea = String.format("Parada %d: %s",
                            detalle.getOrden(),
                            detalle.getAlbergue().getNombre());

                    Double importeLinea = presupuesto.getPrecioTotal() / detalles.size();

                    LineaFactura linea = new LineaFactura(conceptoLinea, importeLinea, factura);
                    lineaFacturaRepository.save(linea);
                }
            } else {
                LineaFactura linea = new LineaFactura(conceptoBase, presupuesto.getPrecioTotal(), factura);
                lineaFacturaRepository.save(linea);
            }

            System.out.println("✅ Presupuesto aceptado: Reserva=" + reserva.getId() + ", Factura=" + factura.getId());

            return true;

        } catch (Exception e) {
            System.err.println("❌ Error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al procesar la aceptación: " + e.getMessage());
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ✨ ENVIAR EMAIL HTML BONITO
    // ═══════════════════════════════════════════════════════════════════════════

    public void enviarPorEmail(Long presupuestoId) {
        Presupuesto presupuesto = findById(presupuestoId)
                .orElseThrow(() -> new RuntimeException("Presupuesto no encontrado"));

        Cliente cliente = presupuesto.getCliente();

        // Generar token único
        String token = UUID.randomUUID().toString();
        presupuesto.setTokenAceptacion(token);
        presupuesto.setEstado("Enviado");
        save(presupuesto);

        // Obtener detalles de albergues
        List<PresupuestoDetalle> detalles = presupuestoDetalleRepository.findByPresupuestoId(presupuestoId);

        // Formatear fecha
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String fechaFormateada = presupuesto.getFechaViaje() != null ?
                presupuesto.getFechaViaje().format(formatter) : "Por confirmar";

        // Construir HTML del email
        String htmlContent = construirEmailHTML(
                cliente.getNombre(),
                presupuesto.getOrigen(),
                presupuesto.getDestino(),
                fechaFormateada,
                presupuesto.getPrecioTotal(),
                detalles,
                token
        );

        try {
            // Enviar email HTML
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(cliente.getEmail());
            helper.setSubject("🚕 Tu presupuesto para el Camino de Santiago");
            helper.setText(htmlContent, true); // true = es HTML
            helper.setFrom("noreply@taxicamino.com");

            mailSender.send(message);

            System.out.println("📧 Email HTML enviado a: " + cliente.getEmail());

        } catch (Exception e) {
            System.err.println("❌ Error enviando email: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al enviar el email: " + e.getMessage());
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎨 CONSTRUIR HTML DEL EMAIL
    // ═══════════════════════════════════════════════════════════════════════════

    private String construirEmailHTML(String nombreCliente, String origen, String destino,
                                      String fecha, Double precioTotal,
                                      List<PresupuestoDetalle> detalles, String token) {

        // Construir lista de albergues si existen
        StringBuilder alberguesHTML = new StringBuilder();
        if (detalles != null && !detalles.isEmpty()) {
            alberguesHTML.append("<div style=\"margin:20px 0;padding:20px;background:#f8f9fa;border-radius:8px;\">");
            alberguesHTML.append("<h3 style=\"margin:0 0 15px 0;color:#1773cf;font-size:16px;font-weight:600;\">📍 Tu Ruta Detallada:</h3>");

            for (PresupuestoDetalle detalle : detalles) {
                alberguesHTML.append(String.format(
                        "<div style=\"padding:10px 0;border-bottom:1px solid #e5e7eb;\">" +
                                "<span style=\"display:inline-block;width:30px;height:30px;background:#1773cf;color:white;border-radius:50%%;text-align:center;line-height:30px;font-weight:bold;margin-right:10px;\">%d</span>" +
                                "<strong>%s</strong><br>" +
                                "<span style=\"color:#6b7280;font-size:14px;margin-left:40px;\">%s, %s</span>" +
                                "</div>",
                        detalle.getOrden(),
                        detalle.getAlbergue().getNombre(),
                        detalle.getAlbergue().getCiudad(),
                        detalle.getAlbergue().getProvincia()
                ));
            }

            alberguesHTML.append("</div>");
        }

        // URL de aceptación
        String urlAceptar = "http://localhost:8080/api/presupuestos/aceptar?token=" + token;

        // Template HTML completo
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#f3f4f6;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
                    <tr>
                        <td align="center">
                            <!-- Container principal -->
                            <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden;">
                                
                                <!-- Header azul -->
                                <tr>
                                    <td style="background:linear-gradient(135deg, #1773cf 0%%, #125aa8 100%%);padding:40px 30px;text-align:center;">
                                        <h1 style="margin:0;color:white;font-size:28px;font-weight:700;">🚕 Taxicamino</h1>
                                        <p style="margin:10px 0 0 0;color:rgba(255,255,255,0.9);font-size:16px;">Tu transporte de confianza por el Camino</p>
                                    </td>
                                </tr>
                                
                                <!-- Contenido -->
                                <tr>
                                    <td style="padding:40px 30px;">
                                        <h2 style="margin:0 0 20px 0;color:#111827;font-size:24px;font-weight:700;">Hola %s,</h2>
                                        <p style="margin:0 0 20px 0;color:#4b5563;font-size:16px;line-height:1.6;">
                                            Te enviamos el presupuesto para tu viaje por el <strong>Camino de Santiago</strong>. 
                                            Hemos preparado todo para que tu experiencia sea inolvidable.
                                        </p>
                                        
                                        <!-- Detalles del viaje -->
                                        <table width="100%%" style="margin:20px 0;border:2px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                                            <tr style="background:#f9fafb;">
                                                <td style="padding:15px;border-bottom:1px solid #e5e7eb;">
                                                    <strong style="color:#6b7280;font-size:12px;text-transform:uppercase;">Origen</strong><br>
                                                    <span style="color:#111827;font-size:18px;font-weight:600;">📍 %s</span>
                                                </td>
                                            </tr>
                                            <tr style="background:#f9fafb;">
                                                <td style="padding:15px;border-bottom:1px solid #e5e7eb;">
                                                    <strong style="color:#6b7280;font-size:12px;text-transform:uppercase;">Destino</strong><br>
                                                    <span style="color:#111827;font-size:18px;font-weight:600;">🎯 %s</span>
                                                </td>
                                            </tr>
                                            <tr style="background:#f9fafb;">
                                                <td style="padding:15px;border-bottom:1px solid #e5e7eb;">
                                                    <strong style="color:#6b7280;font-size:12px;text-transform:uppercase;">Fecha</strong><br>
                                                    <span style="color:#111827;font-size:18px;font-weight:600;">📅 %s</span>
                                                </td>
                                            </tr>
                                            <tr style="background:#dcfce7;">
                                                <td style="padding:20px;">
                                                    <strong style="color:#166534;font-size:14px;text-transform:uppercase;">Precio Total</strong><br>
                                                    <span style="color:#166534;font-size:32px;font-weight:800;">%.2f €</span>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Albergues (si existen) -->
                                        %s
                                        
                                        <!-- Botón de aceptar -->
                                        <table width="100%%" style="margin:30px 0;">
                                            <tr>
                                                <td align="center">
                                                    <a href="%s" style="display:inline-block;padding:18px 40px;background:#1773cf;color:white;text-decoration:none;border-radius:8px;font-size:18px;font-weight:700;box-shadow:0 4px 6px rgba(23,115,207,0.3);">
                                                        ✅ Aceptar Presupuesto
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Información adicional -->
                                        <div style="margin:30px 0;padding:20px;background:#eff6ff;border-left:4px solid #1773cf;border-radius:4px;">
                                            <p style="margin:0 0 10px 0;color:#1e40af;font-weight:600;font-size:14px;">ℹ️ Al aceptar este presupuesto:</p>
                                            <ul style="margin:0;padding-left:20px;color:#1e40af;font-size:14px;line-height:1.8;">
                                                <li>Se creará automáticamente tu reserva</li>
                                                <li>Recibirás una factura pendiente de pago</li>
                                                <li>Podrás realizar el pago de forma segura</li>
                                                <li>Una vez pagado, asignaremos tu conductor</li>
                                            </ul>
                                        </div>
                                        
                                        <p style="margin:20px 0 0 0;color:#6b7280;font-size:14px;line-height:1.6;">
                                            Si tienes alguna duda, no dudes en contactarnos.<br>
                                            ¡Buen Camino! 🥾⛪
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background:#f9fafb;padding:30px;text-align:center;border-top:1px solid #e5e7eb;">
                                        <p style="margin:0 0 5px 0;color:#6b7280;font-size:14px;font-weight:600;">Taxicamino</p>
                                        <p style="margin:0;color:#9ca3af;font-size:12px;">
                                            Tu transporte de confianza por el Camino de Santiago<br>
                                            📧 info@taxicamino.com | 📞 +34 982 123 456
                                        </p>
                                    </td>
                                </tr>
                                
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """,
                nombreCliente,
                origen != null ? origen : "Por confirmar",
                destino != null ? destino : "Por confirmar",
                fecha,
                precioTotal != null ? precioTotal : 0.0,
                alberguesHTML.toString(),
                urlAceptar
        );
    }
}