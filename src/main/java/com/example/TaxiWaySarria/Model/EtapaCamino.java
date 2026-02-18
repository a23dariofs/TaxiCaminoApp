package com.example.TaxiWaySarria.Model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "etapas_camino")
public class EtapaCamino {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "reserva_id", nullable = false)
    @JsonBackReference  // Evita recursión infinita en JSON
    private Reserva reserva;

    private LocalDate fecha;

    @ManyToOne
    @JoinColumn(name = "alojamiento_salida_id")
    private Albergue alojamientoSalida;

    @ManyToOne
    @JoinColumn(name = "alojamiento_destino_id")
    private Albergue alojamientoDestino;

    private Integer cantidadMochilas;

    private Double precioUnitario;  // Default 6.0€

    private Double precioTotal;  // cantidadMochilas × precioUnitario
// "Facturar 1", "Facturar 2", etc.

    @Column(columnDefinition = "TEXT")
    private String comentarios;

    private Integer orden;  // Para mantener el orden de las etapas

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTRUCTORES
    // ═══════════════════════════════════════════════════════════════════════════

    public EtapaCamino() {
    }

    public EtapaCamino(Reserva reserva, LocalDate fecha, Albergue alojamientoSalida,
                       Albergue alojamientoDestino, Integer cantidadMochilas,
                       Double precioUnitario, Integer orden) {
        this.reserva = reserva;
        this.fecha = fecha;
        this.alojamientoSalida = alojamientoSalida;
        this.alojamientoDestino = alojamientoDestino;
        this.cantidadMochilas = cantidadMochilas;
        this.precioUnitario = precioUnitario;
        this.precioTotal = cantidadMochilas * precioUnitario;
        this.orden = orden;
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

    public Reserva getReserva() {
        return reserva;
    }

    public void setReserva(Reserva reserva) {
        this.reserva = reserva;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public Albergue getAlojamientoSalida() {
        return alojamientoSalida;
    }

    public void setAlojamientoSalida(Albergue alojamientoSalida) {
        this.alojamientoSalida = alojamientoSalida;
    }

    public Albergue getAlojamientoDestino() {
        return alojamientoDestino;
    }

    public void setAlojamientoDestino(Albergue alojamientoDestino) {
        this.alojamientoDestino = alojamientoDestino;
    }

    public Integer getCantidadMochilas() {
        return cantidadMochilas;
    }

    public void setCantidadMochilas(Integer cantidadMochilas) {
        this.cantidadMochilas = cantidadMochilas;
    }

    public Double getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(Double precioUnitario) {
        this.precioUnitario = precioUnitario;
    }

    public Double getPrecioTotal() {
        return precioTotal;
    }

    public void setPrecioTotal(Double precioTotal) {
        this.precioTotal = precioTotal;
    }


    public String getComentarios() {
        return comentarios;
    }

    public void setComentarios(String comentarios) {
        this.comentarios = comentarios;
    }

    public Integer getOrden() {
        return orden;
    }

    public void setOrden(Integer orden) {
        this.orden = orden;
    }
}