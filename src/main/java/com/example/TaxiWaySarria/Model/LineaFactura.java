package com.example.TaxiWaySarria.Model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "lineas_factura")
public class LineaFactura {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String concepto;
    private Double importe;

    @ManyToOne
    @JoinColumn(name = "factura_id")
    @JsonBackReference
    private Factura factura;


    public LineaFactura() {
    }

    public LineaFactura(String concepto, Double importe, Factura factura) {
        this.concepto = concepto;
        this.importe = importe;
        this.factura = factura;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getConcepto() {
        return concepto;
    }

    public void setConcepto(String concepto) {
        this.concepto = concepto;
    }

    public Double getImporte() {
        return importe;
    }

    public void setImporte(Double importe) {
        this.importe = importe;
    }

    public Factura getFactura() {
        return factura;
    }

    public void setFactura(Factura factura) {
        this.factura = factura;
    }

    @Override
    public String toString() {
        return "LineaFactura{" +
                "id=" + id +
                ", concepto='" + concepto + '\'' +
                ", importe=" + importe +
                ", factura=" + factura +
                '}';
    }
}

