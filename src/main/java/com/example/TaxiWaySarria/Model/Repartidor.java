package com.example.TaxiWaySarria.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "repartidores")
public class Repartidor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String telefono;
    private String email;

    @ManyToMany(mappedBy = "repartidoresAsignados")
    @JsonIgnore
    private List<Reserva> reservas;

    @OneToMany(mappedBy = "repartidor")
    private List<RutaDiaria> rutasDiarias;

    public Repartidor() {
    }

    public Repartidor(String nombre, String telefono, String email, List<Reserva> reservas, List<RutaDiaria> rutasDiarias) {
        this.nombre = nombre;
        this.telefono = telefono;
        this.email = email;
        this.reservas = reservas;
        this.rutasDiarias = rutasDiarias;
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

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public List<RutaDiaria> getRutasDiarias() {
        return rutasDiarias;
    }

    public void setRutasDiarias(List<RutaDiaria> rutasDiarias) {
        this.rutasDiarias = rutasDiarias;
    }

    public List<Reserva> getReservas() {
        return reservas;
    }

    public void setReservas(List<Reserva> reservas) {
        this.reservas = reservas;
    }

    @Override
    public String toString() {
        return "Repartidor{" +
                "id=" + id +
                ", nombre='" + nombre + '\'' +
                ", telefono='" + telefono + '\'' +
                ", email='" + email + '\'' +
                ", reservas=" + reservas +
                ", rutasDiarias=" + rutasDiarias +
                '}';
    }
}

