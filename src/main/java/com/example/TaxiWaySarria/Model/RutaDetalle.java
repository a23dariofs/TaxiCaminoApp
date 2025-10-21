package com.example.TaxiWaySarria.Model;

import jakarta.persistence.*;

@Entity
@Table(name = "ruta_detalles")
public class RutaDetalle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer orden;

    @ManyToOne
    @JoinColumn(name = "ruta_id")
    private RutaDiaria rutaDiaria;

    @ManyToOne
    @JoinColumn(name = "albergue_id")
    private Albergue albergue;


    public RutaDetalle() {
    }

    public RutaDetalle(Integer orden, RutaDiaria rutaDiaria, Albergue albergue) {
        this.orden = orden;
        this.rutaDiaria = rutaDiaria;
        this.albergue = albergue;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getOrden() {
        return orden;
    }

    public void setOrden(Integer orden) {
        this.orden = orden;
    }

    public RutaDiaria getRutaDiaria() {
        return rutaDiaria;
    }

    public void setRutaDiaria(RutaDiaria rutaDiaria) {
        this.rutaDiaria = rutaDiaria;
    }

    public Albergue getAlbergue() {
        return albergue;
    }

    public void setAlbergue(Albergue albergue) {
        this.albergue = albergue;
    }

    @Override
    public String toString() {
        return "RutaDetalle{" +
                "id=" + id +
                ", orden=" + orden +
                ", rutaDiaria=" + rutaDiaria +
                ", albergue=" + albergue +
                '}';
    }
}

