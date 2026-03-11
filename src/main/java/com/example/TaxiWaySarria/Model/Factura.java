package com.example.TaxiWaySarria.Model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "facturas")
public class Factura {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate fechaEmision;
    private LocalDate fechaPago;
    private Double importeTotal;
    private String estado;        // PENDIENTE, PAGADO, FALLIDO
    private String metodoPago;    // Tarjeta, Efectivo, Transferencia, Bizum
    private String concepto;
    private String tipoServicio;  // ✅ AÑADIDO: Viaje mochilas, Viaje Taxi

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    // ✅ AÑADIR: Relación con Agencia
    @ManyToOne
    @JoinColumn(name = "agencia_id")
    @JsonIgnoreProperties({"facturas", "reservas"})
    private Agencia agencia;

    // ✅ AÑADIR: Campo auxiliar para recibir el ID desde el frontend
    @Transient
    private Long agenciaId;

    @OneToMany(mappedBy = "factura", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<LineaFactura> lineas;

    public Factura() {
    }

    public Factura(LocalDate fechaEmision, LocalDate fechaPago, Double importeTotal,
                   String estado, String metodoPago, String concepto,
                   Cliente cliente, List<LineaFactura> lineas) {
        this.fechaEmision = fechaEmision;
        this.fechaPago = fechaPago;
        this.importeTotal = importeTotal;
        this.estado = estado;
        this.metodoPago = metodoPago;
        this.concepto = concepto;
        this.cliente = cliente;
        this.lineas = lineas;
    }

    // ─── GETTERS Y SETTERS ───────────────────────────────────────────────────

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getFechaEmision() {
        return fechaEmision;
    }

    public void setFechaEmision(LocalDate fechaEmision) {
        this.fechaEmision = fechaEmision;
    }

    public LocalDate getFechaPago() {
        return fechaPago;
    }

    public void setFechaPago(LocalDate fechaPago) {
        this.fechaPago = fechaPago;
    }

    public Double getImporteTotal() {
        return importeTotal;
    }

    public void setImporteTotal(Double importeTotal) {
        this.importeTotal = importeTotal;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(String metodoPago) {
        this.metodoPago = metodoPago;
    }

    public String getConcepto() {
        return concepto;
    }

    public void setConcepto(String concepto) {
        this.concepto = concepto;
    }

    // ✅ NUEVOS: Getters y Setters para tipoServicio
    public String getTipoServicio() {
        return tipoServicio;
    }

    public void setTipoServicio(String tipoServicio) {
        this.tipoServicio = tipoServicio;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    // ✅ NUEVOS: Getters y Setters para Agencia
    public Agencia getAgencia() {
        return agencia;
    }

    public void setAgencia(Agencia agencia) {
        this.agencia = agencia;
    }

    public Long getAgenciaId() {
        return agenciaId;
    }

    public void setAgenciaId(Long agenciaId) {
        this.agenciaId = agenciaId;
    }

    public List<LineaFactura> getLineas() {
        return lineas;
    }

    public void setLineas(List<LineaFactura> lineas) {
        this.lineas = lineas;
    }

    @Override
    public String toString() {
        return "Factura{" +
                "id=" + id +
                ", fechaEmision=" + fechaEmision +
                ", fechaPago=" + fechaPago +
                ", importeTotal=" + importeTotal +
                ", estado='" + estado + '\'' +
                ", metodoPago='" + metodoPago + '\'' +
                ", concepto='" + concepto + '\'' +
                ", cliente=" + cliente +
                ", agencia=" + (agencia != null ? agencia.getNombre() : "null") +
                '}';
    }
}