package com.example.TaxiWaySarria.Model;

import jakarta.persistence.*;

@Entity
@Table(name = "presupuesto_detalles")
public class PresupuestoDetalle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "presupuesto_id")
    private Presupuesto presupuesto;

    @ManyToOne
    @JoinColumn(name = "albergue_id")
    private Albergue albergue;

    private Integer orden; // orden de visita en la ruta


    public PresupuestoDetalle() {
    }

    public PresupuestoDetalle(Presupuesto presupuesto, Albergue albergue, Integer orden) {
        this.presupuesto = presupuesto;
        this.albergue = albergue;
        this.orden = orden;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Presupuesto getPresupuesto() {
        return presupuesto;
    }

    public void setPresupuesto(Presupuesto presupuesto) {
        this.presupuesto = presupuesto;
    }

    public Albergue getAlbergue() {
        return albergue;
    }

    public void setAlbergue(Albergue albergue) {
        this.albergue = albergue;
    }

    public Integer getOrden() {
        return orden;
    }

    public void setOrden(Integer orden) {
        this.orden = orden;
    }

    @Override
    public String toString() {
        return "PresupuestoDetalle{" +
                "id=" + id +
                ", presupuesto=" + presupuesto +
                ", albergue=" + albergue +
                ", orden=" + orden +
                '}';
    }
}

