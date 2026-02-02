package com.example.TaxiWaySarria.Model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "presupuestos")
public class Presupuesto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double precioTotal;
    private String estado; // PENDIENTE, ENVIADO, ACEPTADO, RECHAZADO
    private LocalDate fechaCreacion;
    private LocalDate fechaViaje;
    private String origen;
    private String destino;
    private Integer kilometrosEstimados;
    private String observaciones;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    private String tokenAceptacion;

    @OneToMany(mappedBy = "presupuesto", cascade = CascadeType.ALL)
    private List<PresupuestoDetalle> detalles;

    // Constructores
    public Presupuesto() {
    }

    public Presupuesto(Double precioTotal, String estado, LocalDate fechaCreacion,
                       LocalDate fechaViaje, String origen, String destino,
                       Integer kilometrosEstimados, String observaciones,
                       Cliente cliente, String tokenAceptacion, List<PresupuestoDetalle> detalles) {
        this.precioTotal = precioTotal;
        this.estado = estado;
        this.fechaCreacion = fechaCreacion;
        this.fechaViaje = fechaViaje;
        this.origen = origen;
        this.destino = destino;
        this.kilometrosEstimados = kilometrosEstimados;
        this.observaciones = observaciones;
        this.cliente = cliente;
        this.tokenAceptacion = tokenAceptacion;
        this.detalles = detalles;
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Double getPrecioTotal() {
        return precioTotal;
    }

    public void setPrecioTotal(Double precioTotal) {
        this.precioTotal = precioTotal;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public LocalDate getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDate fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public LocalDate getFechaViaje() {
        return fechaViaje;
    }

    public void setFechaViaje(LocalDate fechaViaje) {
        this.fechaViaje = fechaViaje;
    }

    public String getOrigen() {
        return origen;
    }

    public void setOrigen(String origen) {
        this.origen = origen;
    }

    public String getDestino() {
        return destino;
    }

    public void setDestino(String destino) {
        this.destino = destino;
    }

    public Integer getKilometrosEstimados() {
        return kilometrosEstimados;
    }

    public void setKilometrosEstimados(Integer kilometrosEstimados) {
        this.kilometrosEstimados = kilometrosEstimados;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public String getTokenAceptacion() {
        return tokenAceptacion;
    }

    public void setTokenAceptacion(String tokenAceptacion) {
        this.tokenAceptacion = tokenAceptacion;
    }

    public List<PresupuestoDetalle> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<PresupuestoDetalle> detalles) {
        this.detalles = detalles;
    }

    @Override
    public String toString() {
        return "Presupuesto{" +
                "id=" + id +
                ", precioTotal=" + precioTotal +
                ", estado='" + estado + '\'' +
                ", fechaCreacion=" + fechaCreacion +
                ", fechaViaje=" + fechaViaje +
                ", origen='" + origen + '\'' +
                ", destino='" + destino + '\'' +
                ", kilometrosEstimados=" + kilometrosEstimados +
                ", observaciones='" + observaciones + '\'' +
                ", cliente=" + cliente +
                ", tokenAceptacion='" + tokenAceptacion + '\'' +
                '}';
    }
}