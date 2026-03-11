package com.example.TaxiWaySarria.DTOs;

import java.util.List;

public class ExportarExcelRequest {
    private String fecha;
    private List<EtapaExcelDTO> etapas;

    public ExportarExcelRequest() {}

    public ExportarExcelRequest(String fecha, List<EtapaExcelDTO> etapas) {
        this.fecha = fecha;
        this.etapas = etapas;
    }

    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }
    public List<EtapaExcelDTO> getEtapas() { return etapas; }
    public void setEtapas(List<EtapaExcelDTO> etapas) { this.etapas = etapas; }
}