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

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    private String tokenAceptacion;

    @OneToMany(mappedBy = "presupuesto", cascade = CascadeType.ALL)
    private List<PresupuestoDetalle> detalles;

    public Presupuesto() {
    }

    public Presupuesto(Double precioTotal, String estado, LocalDate fechaCreacion, Cliente cliente, List<PresupuestoDetalle> detalles, String tokenAceptacion) {
        this.precioTotal = precioTotal;
        this.estado = estado;
        this.fechaCreacion = fechaCreacion;
        this.cliente = cliente;
        this.detalles = detalles;
        this.tokenAceptacion = tokenAceptacion;
    }

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

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public List<PresupuestoDetalle> getDetalles() {
        return detalles;
    }

    public String getTokenAceptacion() {
        return tokenAceptacion;
    }

    public void setTokenAceptacion(String tokenAceptacion) {
        this.tokenAceptacion = tokenAceptacion;
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
                ", cliente=" + cliente +
                ", detalles=" + detalles +
                '}';
    }
}
