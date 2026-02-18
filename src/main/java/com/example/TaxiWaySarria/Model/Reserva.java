package com.example.TaxiWaySarria.Model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reservas")
public class Reserva {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate fechaReserva;
    private String estado; // PENDIENTE, PAGADA, CONFIRMADA, CANCELADA

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "agencia_id")
    private Agencia agencia;


    @OneToMany(mappedBy = "reserva", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<EtapaCamino> etapas = new ArrayList<>();

    private Double precioTotal;

    private LocalDate fechaCreacion;

    @OneToOne
    @JoinColumn(name = "presupuesto_id")
    private Presupuesto presupuesto;

    @ManyToMany
    @JoinTable(
            name = "reserva_repartidores",
            joinColumns = @JoinColumn(name = "reserva_id"),
            inverseJoinColumns = @JoinColumn(name = "repartidor_id")
    )
    private List<Repartidor> repartidoresAsignados;

    private String observaciones;


    public Reserva() {
    }

    public Reserva(LocalDate fechaReserva, String estado, Cliente cliente, Presupuesto presupuesto, List<Repartidor> repartidoresAsignados) {
        this.fechaReserva = fechaReserva;
        this.estado = estado;
        this.cliente = cliente;
        this.presupuesto = presupuesto;
        this.repartidoresAsignados = repartidoresAsignados;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getFechaReserva() {
        return fechaReserva;
    }

    public void setFechaReserva(LocalDate fechaReserva) {
        this.fechaReserva = fechaReserva;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public Presupuesto getPresupuesto() {
        return presupuesto;
    }

    public void setPresupuesto(Presupuesto presupuesto) {
        this.presupuesto = presupuesto;
    }

    public List<Repartidor> getRepartidoresAsignados() {
        return repartidoresAsignados;
    }

    public void setRepartidoresAsignados(List<Repartidor> repartidoresAsignados) {
        this.repartidoresAsignados = repartidoresAsignados;
    }

    public Agencia getAgencia() {
        return agencia;
    }

    public void setAgencia(Agencia agencia) {
        this.agencia = agencia;
    }


    public List<EtapaCamino> getEtapas() {
        return etapas;
    }

    public void setEtapas(List<EtapaCamino> etapas) {
        this.etapas = etapas;
    }

    public Double getPrecioTotal() {
        return precioTotal;
    }

    public void setPrecioTotal(Double precioTotal) {
        this.precioTotal = precioTotal;
    }

    public LocalDate getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDate fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    @Override
    public String toString() {
        return "Reserva{" +
                "id=" + id +
                ", fechaReserva=" + fechaReserva +
                ", estado='" + estado + '\'' +
                ", cliente=" + cliente +
                ", agencia=" + agencia +
                ", etapas=" + etapas +
                ", precioTotal=" + precioTotal +
                ", fechaCreacion=" + fechaCreacion +
                ", presupuesto=" + presupuesto +
                ", repartidoresAsignados=" + repartidoresAsignados +
                ", observaciones='" + observaciones + '\'' +
                '}';
    }

}

