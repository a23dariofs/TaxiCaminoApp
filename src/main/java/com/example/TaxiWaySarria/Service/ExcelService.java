package com.example.TaxiWaySarria.Service;

import com.example.TaxiWaySarria.DTOs.EtapaExcelDTO;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class ExcelService {

    public byte[] generarExcelRutaDiaria(String fecha, List<EtapaExcelDTO> etapas) throws IOException {

        XSSFWorkbook workbook = new XSSFWorkbook();
        XSSFSheet sheet = workbook.createSheet("Ruta Diaria");

        // ═══════════════════════════════════════════════════════════════════
        // CONFIGURAR ANCHOS DE COLUMNA
        // ═══════════════════════════════════════════════════════════════════
        sheet.setColumnWidth(0, 4 * 256);   // A - Checkbox (un pelín más ancho para el desplegable)
        sheet.setColumnWidth(1, 25 * 256);  // B - Origen
        sheet.setColumnWidth(2, 30 * 256);  // C - Nombre
        sheet.setColumnWidth(3, 8 * 256);   // D - Cant
        sheet.setColumnWidth(4, 8 * 256);   // E - Prec
        sheet.setColumnWidth(5, 25 * 256);  // F - Destino
        sheet.setColumnWidth(6, 20 * 256);  // G - Agencia
        sheet.setColumnWidth(7, 20 * 256);  // H - Empresa
        sheet.setColumnWidth(8, 12 * 256);  // I - Mochilas

        // ═══════════════════════════════════════════════════════════════════
        // ESTILOS
        // ═══════════════════════════════════════════════════════════════════
        XSSFCellStyle headerAzulStyle = workbook.createCellStyle();
        headerAzulStyle.setFillForegroundColor(new XSSFColor(new byte[]{23, 115, (byte)207}, null));
        headerAzulStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        XSSFFont fontBlanca = workbook.createFont();
        fontBlanca.setColor(IndexedColors.WHITE.getIndex());
        fontBlanca.setBold(true);
        fontBlanca.setFontHeightInPoints((short)12);
        fontBlanca.setFontName("Arial");
        headerAzulStyle.setFont(fontBlanca);
        headerAzulStyle.setAlignment(HorizontalAlignment.CENTER);
        headerAzulStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        headerAzulStyle.setBorderTop(BorderStyle.THIN);
        headerAzulStyle.setBorderBottom(BorderStyle.THIN);
        headerAzulStyle.setBorderLeft(BorderStyle.THIN);
        headerAzulStyle.setBorderRight(BorderStyle.THIN);

        XSSFCellStyle amarilloStyle = workbook.createCellStyle();
        amarilloStyle.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
        amarilloStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        XSSFFont fontNegra = workbook.createFont();
        fontNegra.setBold(true);
        fontNegra.setFontHeightInPoints((short)10);
        fontNegra.setFontName("Arial");
        amarilloStyle.setFont(fontNegra);
        amarilloStyle.setAlignment(HorizontalAlignment.CENTER);
        amarilloStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        amarilloStyle.setBorderTop(BorderStyle.THIN);
        amarilloStyle.setBorderBottom(BorderStyle.THIN);
        amarilloStyle.setBorderLeft(BorderStyle.THIN);
        amarilloStyle.setBorderRight(BorderStyle.THIN);

        XSSFCellStyle normalStyle = workbook.createCellStyle();
        XSSFFont fontNormal = workbook.createFont();
        fontNormal.setFontHeightInPoints((short)10);
        fontNormal.setFontName("Arial");
        normalStyle.setFont(fontNormal);
        normalStyle.setAlignment(HorizontalAlignment.CENTER);
        normalStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        normalStyle.setBorderTop(BorderStyle.THIN);
        normalStyle.setBorderBottom(BorderStyle.THIN);
        normalStyle.setBorderLeft(BorderStyle.THIN);
        normalStyle.setBorderRight(BorderStyle.THIN);

        XSSFCellStyle azulClaroStyle = workbook.createCellStyle();
        azulClaroStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte)173, (byte)216, (byte)230}, null));
        azulClaroStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        azulClaroStyle.setFont(fontNormal);
        azulClaroStyle.setAlignment(HorizontalAlignment.CENTER);
        azulClaroStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        azulClaroStyle.setBorderTop(BorderStyle.THIN);
        azulClaroStyle.setBorderBottom(BorderStyle.THIN);
        azulClaroStyle.setBorderLeft(BorderStyle.THIN);
        azulClaroStyle.setBorderRight(BorderStyle.THIN);

        XSSFCellStyle textoIzqStyle = workbook.createCellStyle();
        textoIzqStyle.setFont(fontNormal);
        textoIzqStyle.setAlignment(HorizontalAlignment.LEFT);
        textoIzqStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        textoIzqStyle.setWrapText(true);
        textoIzqStyle.setBorderTop(BorderStyle.THIN);
        textoIzqStyle.setBorderBottom(BorderStyle.THIN);
        textoIzqStyle.setBorderLeft(BorderStyle.THIN);
        textoIzqStyle.setBorderRight(BorderStyle.THIN);

        XSSFCellStyle textoIzqAzulStyle = workbook.createCellStyle();
        textoIzqAzulStyle.setFillForegroundColor(new XSSFColor(new byte[]{(byte)173, (byte)216, (byte)230}, null));
        textoIzqAzulStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        textoIzqAzulStyle.setFont(fontNormal);
        textoIzqAzulStyle.setAlignment(HorizontalAlignment.LEFT);
        textoIzqAzulStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        textoIzqAzulStyle.setWrapText(true);
        textoIzqAzulStyle.setBorderTop(BorderStyle.THIN);
        textoIzqAzulStyle.setBorderBottom(BorderStyle.THIN);
        textoIzqAzulStyle.setBorderLeft(BorderStyle.THIN);
        textoIzqAzulStyle.setBorderRight(BorderStyle.THIN);

        XSSFCellStyle rojoStyle = workbook.createCellStyle();
        rojoStyle.setFillForegroundColor(IndexedColors.RED.getIndex());
        rojoStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        XSSFFont fontBlancaBold = workbook.createFont();
        fontBlancaBold.setColor(IndexedColors.WHITE.getIndex());
        fontBlancaBold.setBold(true);
        fontBlancaBold.setFontHeightInPoints((short)10);
        fontBlancaBold.setFontName("Arial");
        rojoStyle.setFont(fontBlancaBold);
        rojoStyle.setAlignment(HorizontalAlignment.CENTER);
        rojoStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        rojoStyle.setBorderTop(BorderStyle.THIN);
        rojoStyle.setBorderBottom(BorderStyle.THIN);
        rojoStyle.setBorderLeft(BorderStyle.THIN);
        rojoStyle.setBorderRight(BorderStyle.THIN);

        XSSFCellStyle amarilloLugoStyle = workbook.createCellStyle();
        amarilloLugoStyle.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
        amarilloLugoStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        amarilloLugoStyle.setFont(fontNegra);
        amarilloLugoStyle.setAlignment(HorizontalAlignment.CENTER);
        amarilloLugoStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        amarilloLugoStyle.setBorderTop(BorderStyle.THIN);
        amarilloLugoStyle.setBorderBottom(BorderStyle.THIN);
        amarilloLugoStyle.setBorderLeft(BorderStyle.THIN);
        amarilloLugoStyle.setBorderRight(BorderStyle.THIN);

        XSSFCellStyle logoStyle = workbook.createCellStyle();
        logoStyle.cloneStyleFrom(headerAzulStyle);
        XSSFFont fontLogo = workbook.createFont();
        fontLogo.setColor(IndexedColors.YELLOW.getIndex());
        fontLogo.setBold(true);
        fontLogo.setFontHeightInPoints((short)18);
        fontLogo.setFontName("Arial");
        logoStyle.setFont(fontLogo);

        // ═══════════════════════════════════════════════════════════════════
        // FILA 1-2: HEADER CON LOGO
        // ═══════════════════════════════════════════════════════════════════
        XSSFRow row1 = sheet.createRow(0);
        row1.setHeightInPoints(25);
        XSSFRow row2 = sheet.createRow(1);
        row2.setHeightInPoints(25);

        for (int r = 0; r <= 1; r++) {
            XSSFRow row = sheet.getRow(r);
            for (int c = 0; c <= 2; c++) {
                row.createCell(c).setCellStyle(logoStyle);
            }
        }
        row1.getCell(0).setCellValue("TAXICAMINO");
        sheet.addMergedRegion(new CellRangeAddress(0, 1, 0, 2));

        for(int c = 3; c <= 5; c++) row1.createCell(c).setCellStyle(amarilloStyle);
        row1.getCell(3).setCellValue("FECHA");
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 3, 5));

        for(int c = 6; c <= 8; c++) row1.createCell(c).setCellStyle(amarilloStyle);
        row1.getCell(6).setCellValue("REPARTIDOR");
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 6, 8));

        for(int c = 3; c <= 5; c++) row2.createCell(c).setCellStyle(normalStyle);
        row2.getCell(3).setCellValue(fecha);
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 3, 5));

        for(int c = 6; c <= 8; c++) row2.createCell(c).setCellStyle(normalStyle);
        row2.getCell(6).setCellValue("NELI");
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 6, 8));

        // Separación
        sheet.createRow(2).setHeightInPoints(5);
        sheet.createRow(3).setHeightInPoints(10);

        // ═══════════════════════════════════════════════════════════════════
        // FILA 5: HEADERS DE TABLA
        // ═══════════════════════════════════════════════════════════════════
        XSSFRow row5 = sheet.createRow(4);
        String[] headers = {"", "ORIGEN", "NOMBRE", "CANT", "PREC", "DESTINO", "AGENCIA", "EMPRESA", "MOCHILAS"};
        for (int i = 0; i < headers.length; i++) {
            XSSFCell cell = row5.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(amarilloStyle);
        }

        // ═══════════════════════════════════════════════════════════════════
        // FILAS 6+: DATOS DE ETAPAS
        // ═══════════════════════════════════════════════════════════════════
        int filaActual = 5;
        XSSFDataFormat format = workbook.createDataFormat();
        DataValidationHelper validationHelper = sheet.getDataValidationHelper();
        DataValidationConstraint constraint = validationHelper.createExplicitListConstraint(new String[]{"☐", "☑"});

        for (EtapaExcelDTO etapa : etapas) {
            XSSFRow row = sheet.createRow(filaActual);
            row.setHeightInPoints(30);

            // A - Checkbox Funcional (Validación de Datos)
            XSSFCell checkCell = row.createCell(0);
            checkCell.setCellValue("☐");
            checkCell.setCellStyle(azulClaroStyle);

            CellRangeAddressList addressList = new CellRangeAddressList(filaActual, filaActual, 0, 0);
            DataValidation validation = validationHelper.createValidation(constraint, addressList);
            validation.setSuppressDropDownArrow(false);
            sheet.addValidationData(validation);

            // B - Origen
            String origenTexto = (etapa.getOrigenNombre() != null ? etapa.getOrigenNombre() : "") +
                    (etapa.getOrigenCiudad() != null ? "\n" + etapa.getOrigenCiudad() : "");
            XSSFCell origenCell = row.createCell(1);
            origenCell.setCellValue(origenTexto);
            origenCell.setCellStyle(textoIzqAzulStyle);

            // C - Cliente
            String clienteTexto = (etapa.getClienteNombre() != null ? etapa.getClienteNombre() : "") +
                    (etapa.getClienteApellidos() != null ? " " + etapa.getClienteApellidos() : "") +
                    (etapa.getClienteTelefono() != null ? "\n" + etapa.getClienteTelefono() : "");
            XSSFCell clienteCell = row.createCell(2);
            clienteCell.setCellValue(clienteTexto);
            clienteCell.setCellStyle(textoIzqStyle);

            // D - Cant
            XSSFCell cantCell = row.createCell(3);
            cantCell.setCellValue(etapa.getCantidadMochilas() != null ? etapa.getCantidadMochilas() : 0);
            cantCell.setCellStyle(azulClaroStyle);

            // E - Precio
            XSSFCell precioCell = row.createCell(4);
            precioCell.setCellValue(etapa.getPrecioTotal() != null ? etapa.getPrecioTotal() : 0.0);
            XSSFCellStyle precioNumStyle = workbook.createCellStyle();
            precioNumStyle.cloneStyleFrom(normalStyle);
            precioNumStyle.setDataFormat(format.getFormat("#,##0.00"));
            precioCell.setCellStyle(precioNumStyle);

            // F - Destino
            String destinoTexto = (etapa.getDestinoNombre() != null ? etapa.getDestinoNombre() : "") +
                    (etapa.getDestinoCiudad() != null ? "\n" + etapa.getDestinoCiudad() : "");
            XSSFCell destinoCell = row.createCell(5);
            destinoCell.setCellValue(destinoTexto);
            destinoCell.setCellStyle(textoIzqAzulStyle);

            // G - Agencia
            row.createCell(6).setCellValue(etapa.getAgenciaNombre() != null ? etapa.getAgenciaNombre() : "");
            row.getCell(6).setCellStyle(normalStyle);

            // H - Empresa
            XSSFCell empresaCell = row.createCell(7);
            String empresa = etapa.getEmpresaNombre() != null ? etapa.getEmpresaNombre() : "TAXICAMINO";
            empresaCell.setCellValue(empresa);
            if (empresa.toUpperCase().contains("JACOTRANS")) empresaCell.setCellStyle(rojoStyle);
            else if (empresa.toUpperCase().contains("LUGO")) empresaCell.setCellStyle(amarilloLugoStyle);
            else empresaCell.setCellStyle(normalStyle);

            // I - Mochilas
            XSSFCell mochilasRowCell = row.createCell(8);
            mochilasRowCell.setCellValue(etapa.getCantidadMochilas() != null ? etapa.getCantidadMochilas() : 0);
            mochilasRowCell.setCellStyle(azulClaroStyle);

            filaActual++;
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();
        return outputStream.toByteArray();
    }
}