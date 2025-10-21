package com.example.TaxiWaySarria.Model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "rutas_diarias")
public class RutaDiaria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate fecha;
    private String estado; // PLANIFICADA, EN_PROGRESO, COMPLETADA

    @ManyToOne
    @JoinColumn(name = "repartidor_id")
    private Repartidor repartidor;

    @OneToMany(mappedBy = "rutaDiaria", cascade = CascadeType.ALL)
    private List<RutaDetalle> detalles;


    public RutaDiaria() {
    }

    public RutaDiaria(LocalDate fecha, String estado, Repartidor repartidor, List<RutaDetalle> detalles) {
        this.fecha = fecha;
        this.estado = estado;
        this.repartidor = repartidor;
        this.detalles = detalles;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
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

    public List<RutaDetalle> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<RutaDetalle> detalles) {
        this.detalles = detalles;
    }

    @Override
    public String toString() {
        return "RutaDiaria{" +
                "id=" + id +
                ", fecha=" + fecha +
                ", estado='" + estado + '\'' +
                ", repartidor=" + repartidor +
                ", detalles=" + detalles +
                '}';
    }
}

