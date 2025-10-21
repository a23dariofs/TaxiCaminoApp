package com.example.TaxiWaySarria.Model;

import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "albergues")
public class Albergue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String direccion;
    private String ciudad;
    private String provincia;

    @OneToMany(mappedBy = "albergue")
    private List<RutaDetalle> rutasDetalles;

    public Albergue() {
    }

    public Albergue(String nombre, String direccion, String ciudad, String provincia, List<RutaDetalle> rutasDetalles) {
        this.nombre = nombre;
        this.direccion = direccion;
        this.ciudad = ciudad;
        this.provincia = provincia;
        this.rutasDetalles = rutasDetalles;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getCiudad() {
        return ciudad;
    }

    public void setCiudad(String ciudad) {
        this.ciudad = ciudad;
    }

    public String getProvincia() {
        return provincia;
    }

    public void setProvincia(String provincia) {
        this.provincia = provincia;
    }

    public List<RutaDetalle> getRutasDetalles() {
        return rutasDetalles;
    }

    public void setRutasDetalles(List<RutaDetalle> rutasDetalles) {
        this.rutasDetalles = rutasDetalles;
    }

    @Override
    public String toString() {
        return "Albergue{" +
                "id=" + id +
                ", nombre='" + nombre + '\'' +
                ", direccion='" + direccion + '\'' +
                ", ciudad='" + ciudad + '\'' +
                ", provincia='" + provincia + '\'' +
                '}';
    }
}

