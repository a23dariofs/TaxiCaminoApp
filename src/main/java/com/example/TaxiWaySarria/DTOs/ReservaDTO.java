package com.example.TaxiWaySarria.DTOs;

import com.example.TaxiWaySarria.DTOs.EtapaCaminoDTO;

import java.util.List;

public class ReservaDTO {

    // Datos del cliente
    private String clienteEmail;
    private String clienteTelefono;
    private String clienteNombre;
    private String clienteApellidos;

    // Datos de la reserva
    private String agenciaNombre;
    private String empresaNombre;  // ← NUEVO
    private Long repartidorId;     // ← NUEVO
    private String observaciones;
    private String estado;
    private List<EtapaCaminoDTO> etapas;

    // GETTERS Y SETTERS

    public String getClienteEmail() {
        return clienteEmail;
    }

    public void setClienteEmail(String clienteEmail) {
        this.clienteEmail = clienteEmail;
    }

    public String getClienteTelefono() {
        return clienteTelefono;
    }

    public void setClienteTelefono(String clienteTelefono) {
        this.clienteTelefono = clienteTelefono;
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

    public Long getRepartidorId() {
        return repartidorId;
    }

    public void setRepartidorId(Long repartidorId) {
        this.repartidorId = repartidorId;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public List<EtapaCaminoDTO> getEtapas() {
        return etapas;
    }

    public void setEtapas(List<EtapaCaminoDTO> etapas) {
        this.etapas = etapas;
    }
}