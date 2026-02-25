package com.example.TaxiWaySarria.DTOs;

import java.time.LocalDate;

public class EtapaRutaDiariaDTO {

    private Long id;
    private LocalDate fecha;
    private Integer cantidadMochilas;
    private Double precioTotal;
    private String comentarios;
    private String estado;
    private Integer orden;

    // Datos del alojamiento de salida
    private String origenNombre;
    private String origenCiudad;

    // Datos del alojamiento de destino
    private String destinoNombre;
    private String destinoCiudad;

    // Datos del cliente
    private String clienteNombre;
    private String clienteApellidos;
    private String clienteTelefono;

    // Datos de la reserva
    private String agenciaNombre;
    private String empresaNombre;
    private String observaciones;

    // CONSTRUCTORES

    public EtapaRutaDiariaDTO() {
    }

    // GETTERS Y SETTERS

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

    public Integer getCantidadMochilas() {
        return cantidadMochilas;
    }

    public void setCantidadMochilas(Integer cantidadMochilas) {
        this.cantidadMochilas = cantidadMochilas;
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

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public Integer getOrden() {
        return orden;
    }

    public void setOrden(Integer orden) {
        this.orden = orden;
    }

    public String getOrigenNombre() {
        return origenNombre;
    }

    public void setOrigenNombre(String origenNombre) {
        this.origenNombre = origenNombre;
    }

    public String getOrigenCiudad() {
        return origenCiudad;
    }

    public void setOrigenCiudad(String origenCiudad) {
        this.origenCiudad = origenCiudad;
    }

    public String getDestinoNombre() {
        return destinoNombre;
    }

    public void setDestinoNombre(String destinoNombre) {
        this.destinoNombre = destinoNombre;
    }

    public String getDestinoCiudad() {
        return destinoCiudad;
    }

    public void setDestinoCiudad(String destinoCiudad) {
        this.destinoCiudad = destinoCiudad;
    }

    public String getClienteNombre() {
        return clienteNombre;
    }

    public void setClienteNombre(String clienteNombre) {
        this.clienteNombre = clienteNombre;
    }

    public String getClienteApellidos() {
        return clienteApellidos;
    }

    public void setClienteApellidos(String clienteApellidos) {
        this.clienteApellidos = clienteApellidos;
    }

    public String getClienteTelefono() {
        return clienteTelefono;
    }

    public void setClienteTelefono(String clienteTelefono) {
        this.clienteTelefono = clienteTelefono;
    }

    public String getAgenciaNombre() {
        return agenciaNombre;
    }

    public void setAgenciaNombre(String agenciaNombre) {
        this.agenciaNombre = agenciaNombre;
    }

    public String getEmpresaNombre() {
        return empresaNombre;
    }

    public void setEmpresaNombre(String empresaNombre) {
        this.empresaNombre = empresaNombre;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }
}