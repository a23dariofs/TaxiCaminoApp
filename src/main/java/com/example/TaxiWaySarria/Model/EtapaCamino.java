package com.example.TaxiWaySarria.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "etapas_camino")
public class EtapaCamino {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ CRÍTICO: fetch = FetchType.EAGER para cargar la reserva
    // ✅ NO USES @JsonBackReference aquí
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reserva_id")
    @JsonIgnore
    private Reserva reserva;

    private LocalDate fecha;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "alojamiento_salida_id")
    private Albergue alojamientoSalida;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "alojamiento_destino_id")
    private Albergue alojamientoDestino;

    private Integer cantidadMochilas;

    @Column(name = "precio_unitario")
    private Double precioUnitario;

    @Column(name = "precio_total")
    private Double precioTotal;

    private String comentarios;
    private Integer orden;

    @Column(name = "estado")
    private String estado = "Pendiente";

    // CONSTRUCTORES

    public EtapaCamino() {
    }

    // GETTERS Y SETTERS

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

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    @Override
    public String toString() {
        return "EtapaCamino{" +
                "id=" + id +
                ", reserva=" + reserva +
                ", fecha=" + fecha +
                ", alojamientoSalida=" + alojamientoSalida +
                ", alojamientoDestino=" + alojamientoDestino +
                ", cantidadMochilas=" + cantidadMochilas +
                ", precioUnitario=" + precioUnitario +
                ", precioTotal=" + precioTotal +
                ", comentarios='" + comentarios + '\'' +
                ", orden=" + orden +
                ", estado='" + estado + '\'' +
                '}';
    }
}