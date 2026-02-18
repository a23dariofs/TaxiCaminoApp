package com.example.TaxiWaySarria.DTOs;

import java.time.LocalDate;

public class EtapaCaminoDTO {

    private LocalDate fecha;
    private String alojamientoSalidaNombre;   // ← Cambio: nombre en vez de ID
    private String alojamientoDestinoNombre;  // ← Cambio: nombre en vez de ID
    private Integer cantidadMochilas;
    private Double precioUnitario;  // ← NUEVO: precio editable
    private String comentarios;
    private Integer orden;

    // GETTERS Y SETTERS

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public String getAlojamientoSalidaNombre() {
        return alojamientoSalidaNombre;
    }

    public void setAlojamientoSalidaNombre(String alojamientoSalidaNombre) {
        this.alojamientoSalidaNombre = alojamientoSalidaNombre;
    }

    public String getAlojamientoDestinoNombre() {
        return alojamientoDestinoNombre;
    }

    public void setAlojamientoDestinoNombre(String alojamientoDestinoNombre) {
        this.alojamientoDestinoNombre = alojamientoDestinoNombre;
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