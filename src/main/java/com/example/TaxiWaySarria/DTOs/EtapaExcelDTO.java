package com.example.TaxiWaySarria.DTOs;


public class EtapaExcelDTO {
    private Long id;
    private String origenNombre;
    private String origenCiudad;
    private String destinoNombre;
    private String destinoCiudad;
    private String clienteNombre;
    private String clienteApellidos;
    private String clienteTelefono;
    private Integer cantidadMochilas;
    private Double precioTotal;
    private String agenciaNombre;
    private String empresaNombre;

    public EtapaExcelDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrigenNombre() { return origenNombre; }
    public void setOrigenNombre(String origenNombre) { this.origenNombre = origenNombre; }
    public String getOrigenCiudad() { return origenCiudad; }
    public void setOrigenCiudad(String origenCiudad) { this.origenCiudad = origenCiudad; }
    public String getDestinoNombre() { return destinoNombre; }
    public void setDestinoNombre(String destinoNombre) { this.destinoNombre = destinoNombre; }
    public String getDestinoCiudad() { return destinoCiudad; }
    public void setDestinoCiudad(String destinoCiudad) { this.destinoCiudad = destinoCiudad; }
    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }
    public String getClienteApellidos() { return clienteApellidos; }
    public void setClienteApellidos(String clienteApellidos) { this.clienteApellidos = clienteApellidos; }
    public String getClienteTelefono() { return clienteTelefono; }
    public void setClienteTelefono(String clienteTelefono) { this.clienteTelefono = clienteTelefono; }
    public Integer getCantidadMochilas() { return cantidadMochilas; }
    public void setCantidadMochilas(Integer cantidadMochilas) { this.cantidadMochilas = cantidadMochilas; }
    public Double getPrecioTotal() { return precioTotal; }
    public void setPrecioTotal(Double precioTotal) { this.precioTotal = precioTotal; }
    public String getAgenciaNombre() { return agenciaNombre; }
    public void setAgenciaNombre(String agenciaNombre) { this.agenciaNombre = agenciaNombre; }
    public String getEmpresaNombre() { return empresaNombre; }
    public void setEmpresaNombre(String empresaNombre) { this.empresaNombre = empresaNombre; }
}