package com.example.TaxiWaySarria.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reservas")
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ═══════════════════════════════════════════════════════════════════════════
    // RELACIONES CON @JsonIgnore PARA EVITAR RECURSIÓN INFINITA
    // ═══════════════════════════════════════════════════════════════════════════

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "presupuesto_id")
    @JsonIgnore  // ✅ EVITA: Reserva → Presupuesto → Reserva (infinito)
    private Presupuesto presupuesto;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "reserva_repartidores",
            joinColumns = @JoinColumn(name = "reserva_id"),
            inverseJoinColumns = @JoinColumn(name = "repartidor_id")
    )
    @JsonIgnore  // ✅ EVITA: Reserva → Repartidor → Reserva (infinito)
    private List<Repartidor> repartidoresAsignados = new ArrayList<>();

    @OneToMany(mappedBy = "reserva", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference  // ✅ CORRECTO: Lado "padre" de la relación bidireccional
    private List<EtapaCamino> etapas = new ArrayList<>();

    // ═══════════════════════════════════════════════════════════════════════════
    // RELACIONES SIN @JsonIgnore (ESTAS ESTÁN BIEN)
    // ═══════════════════════════════════════════════════════════════════════════

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "agencia_id")
    private Agencia agencia;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "empresa_id")
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "repartidor_id")
    private Repartidor repartidor;

    // ═══════════════════════════════════════════════════════════════════════════
    // CAMPOS SIMPLES
    // ═══════════════════════════════════════════════════════════════════════════

    @Column(name = "fecha_reserva")
    private LocalDate fechaReserva;

    @Column(name = "estado")
    private String estado;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "precio_total", precision = 10, scale = 2)
    private BigDecimal precioTotal;

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════════

    public Reserva() {
        this.fechaCreacion = LocalDateTime.now();
        this.estado = "Pendiente";
        this.etapas = new ArrayList<>();
        this.repartidoresAsignados = new ArrayList<>();
        this.precioTotal = BigDecimal.ZERO;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GETTERS Y SETTERS
    // ═══════════════════════════════════════════════════════════════════════════

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Presupuesto getPresupuesto() {
        return presupuesto;
    }

    public void setPresupuesto(Presupuesto presupuesto) {
        this.presupuesto = presupuesto;
    }

    public LocalDate getFechaReserva() {
        return fechaReserva;
    }

    public void setFechaReserva(LocalDate fechaReserva) {
        this.fechaReserva = fechaReserva;
    }

    public List<Repartidor> getRepartidoresAsignados() {
        return repartidoresAsignados;
    }

    public void setRepartidoresAsignados(List<Repartidor> repartidoresAsignados) {
        this.repartidoresAsignados = repartidoresAsignados;
    }

    public List<EtapaCamino> getEtapas() {
        return etapas;
    }

    public void setEtapas(List<EtapaCamino> etapas) {
        this.etapas = etapas;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public Agencia getAgencia() {
        return agencia;
    }

    public void setAgencia(Agencia agencia) {
        this.agencia = agencia;
    }

    public Empresa getEmpresa() {
        return empresa;
    }

    public void setEmpresa(Empresa empresa) {
        this.empresa = empresa;
    }

    public Repartidor getRepartidor() {
        return repartidor;
    }

    public void setRepartidor(Repartidor repartidor) {
        this.repartidor = repartidor;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public BigDecimal getPrecioTotal() {
        return precioTotal;
    }

    public void setPrecioTotal(BigDecimal precioTotal) {
        this.precioTotal = precioTotal;
    }
}