package com.nexo.gestion.services;

import com.nexo.gestion.dto.RutinaDetalleImportDTO;
import com.nexo.gestion.dto.RutinaImportDTO;
import com.nexo.gestion.entity.*;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RutinaImportService {

    private final RutinaRepository rutinaRepository;
    private final EjercicioRepository ejercicioRepository;
    private final RutinaDetalleRepository rutinaDetalleRepository;
    private final EmpleadoRepository empleadoRepository;
    private final SocioRepository socioRepository;
    private final GrupoMuscularRepository grupoMuscularRepository;

    public RutinaImportService(RutinaRepository rutinaRepository,
            EjercicioRepository ejercicioRepository,
            RutinaDetalleRepository rutinaDetalleRepository,
            EmpleadoRepository empleadoRepository,
            SocioRepository socioRepository,
            GrupoMuscularRepository grupoMuscularRepository) {
        this.rutinaRepository = rutinaRepository;
        this.ejercicioRepository = ejercicioRepository;
        this.rutinaDetalleRepository = rutinaDetalleRepository;
        this.empleadoRepository = empleadoRepository;
        this.socioRepository = socioRepository;
        this.grupoMuscularRepository = grupoMuscularRepository;
    }

    @Transactional
    public Integer importarRutinasDesdeExcel(MultipartFile file, String dniEmpleado, String dniSocio) {
        try {
            InputStream is = file.getInputStream();
            Workbook workbook = WorkbookFactory.create(is);
            Sheet sheet = workbook.getSheetAt(0);

            RutinaImportDTO rutinaImport = parsearExcel(sheet);
            rutinaImport = new RutinaImportDTO(
                    rutinaImport.nombre(),
                    dniEmpleado,
                    dniSocio,
                    rutinaImport.descripcion(),
                    rutinaImport.detalles());

            // Crear rutina en BD
            Integer idRutina = crearRutinaDesdeImport(rutinaImport);

            workbook.close();
            return idRutina;

        } catch (Exception e) {
            throw new RuntimeException("Error al importar Excel: " + e.getMessage(), e);
        }
    }

    private RutinaImportDTO parsearExcel(Sheet sheet) {
        String nombre = "";
        String descripcion = "";
        Map<Integer, RutinaDetalleImportDTO> detallesMap = new LinkedHashMap<>();
        int diaActual = 1;
        int ordenGlobal = 1;
        String ultimasReps = "";
        String ultimasSeries = "";

        for (Row row : sheet) {
            String primeraColumna = getCellValueAsString(row.getCell(0));

            // Fila 1: Nombre del profesor
            if (row.getRowNum() == 0) {
                nombre = getCellValueAsString(row.getCell(1));
                continue;
            }

            // Fila 2: Fecha o descripción
            if (row.getRowNum() == 1) {
                descripcion = getCellValueAsString(row.getCell(1));
                continue;
            }

            // Detectar cambio de día: "Dia 1", "Dia 2", etc
            if (primeraColumna.matches("Dia\\s+\\d+")) {
                diaActual = Integer.parseInt(primeraColumna.replaceAll("\\D+", ""));
                continue;
            }

            // Fila de encabezados: "Ejercicio", "Reps", "Series", etc
            if (primeraColumna.equalsIgnoreCase("Ejercicio")) {
                continue;
            }

            // Fila de datos de ejercicio
            if (!primeraColumna.trim().isEmpty() && !primeraColumna.equalsIgnoreCase("Dia")) {
                RutinaDetalleImportDTO detalle = parsearFilaEjercicio(row, diaActual, ordenGlobal, ultimasReps,
                        ultimasSeries);
                if (detalle != null) {
                    detallesMap.put(ordenGlobal, detalle);
                    // Actualizar últimas reps/series si esta fila las tiene
                    String repsActual = getCellValueAsString(row.getCell(1));
                    String seriesActual = getCellValueAsString(row.getCell(2));
                    if (!repsActual.trim().isEmpty() && !repsActual.equals(".-")) {
                        ultimasReps = repsActual;
                    }
                    if (!seriesActual.trim().isEmpty() && !seriesActual.equals(".-")) {
                        ultimasSeries = seriesActual;
                    }
                    ordenGlobal++;
                }
            }
        }

        List<RutinaDetalleImportDTO> detalles = new ArrayList<>(detallesMap.values());

        return new RutinaImportDTO(nombre, null, null, descripcion, detalles);
    }

    private RutinaDetalleImportDTO parsearFilaEjercicio(Row row, int dia, int orden, String ultimasReps,
            String ultimasSeries) {
        String nombreEjercicio = getCellValueAsString(row.getCell(0));

        if (nombreEjercicio.trim().isEmpty()) {
            return null;
        }

        String repeticiones = getCellValueAsString(row.getCell(1));
        String series = getCellValueAsString(row.getCell(2));

        // Si no tiene reps, usar las últimas
        if (repeticiones.trim().isEmpty() || repeticiones.equals(".-")) {
            repeticiones = ultimasReps;
        }

        // Si no tiene series, usar las últimas
        if (series.trim().isEmpty() || series.equals(".-")) {
            series = ultimasSeries;
        }

        // Cargas: columnas 3-8 (Kg 1-6)
        List<String> cargas = new ArrayList<>();
        for (int colIdx = 3; colIdx <= 8; colIdx++) {
            String valor = getCellValueAsString(row.getCell(colIdx));
            if (!valor.trim().isEmpty() && !valor.equals(".-")) {
                cargas.add(valor);
            }
        }

        // Buscar ejercicio en BD por nombre
        Ejercicio ejercicio = ejercicioRepository.findAll().stream()
                .filter(e -> e.getNombre().equalsIgnoreCase(nombreEjercicio))
                .findFirst()
                .orElse(null);

        Integer idEjercicio = ejercicio != null ? ejercicio.getIdEjercicio() : null;

        return new RutinaDetalleImportDTO(
                idEjercicio,
                nombreEjercicio,
                series,
                repeticiones,
                cargas,
                dia,
                orden);
    }

    @Transactional
    public Integer crearRutinaDesdeImport(RutinaImportDTO dto) {
        // Validar empleado
        Empleado empleado = empleadoRepository.findById(dto.dniEmpleado())
                .orElseThrow(() -> new ObjetoNoEncontradoException("Empleado no encontrado: " + dto.dniEmpleado()));

        // Obtener socio si se proporcionó
        Socio socio = null;
        if (dto.dniSocio() != null && !dto.dniSocio().isBlank()) {
            socio = socioRepository.findById(dto.dniSocio())
                    .orElseThrow(() -> new ObjetoNoEncontradoException("Socio no encontrado: " + dto.dniSocio()));
        }

        // Crear rutina
        Rutina rutina = new Rutina(dto.nombre(), dto.descripcion(), empleado, socio);

        // Agregar detalles
        if (dto.detalles() != null) {
            for (RutinaDetalleImportDTO detalle : dto.detalles()) {
                Ejercicio ejercicio;

                // Si el ejercicio no existe en BD, crearlo automáticamente
                if (detalle.idEjercicio() == null) {
                    // Obtener o crear grupo muscular "General"
                    GrupoMuscular grupoGeneral = grupoMuscularRepository.findAll().stream()
                            .filter(g -> "General".equalsIgnoreCase(g.getNombre()))
                            .findFirst()
                            .orElseGet(() -> {
                                GrupoMuscular nuevo = new GrupoMuscular("General");
                                return grupoMuscularRepository.save(nuevo);
                            });

                    ejercicio = new Ejercicio();
                    ejercicio.setNombre(detalle.nombreEjercicio());
                    ejercicio.setDescripcion("Ejercicio importado desde rutina Excel");
                    ejercicio.setGrupoMuscular(grupoGeneral);
                    ejercicio = ejercicioRepository.save(ejercicio);
                } else {
                    ejercicio = ejercicioRepository.findById(detalle.idEjercicio())
                            .orElseThrow(() -> new ObjetoNoEncontradoException(
                                    "Ejercicio no encontrado: " + detalle.idEjercicio()));
                }

                RutinaDetalle rutinaDetalle = new RutinaDetalle(
                        rutina,
                        ejercicio,
                        detalle.orden(),
                        detalle.series(),
                        detalle.repeticiones(),
                        null, // carga inicial vacía, se llena con cargas
                        null, // descanso
                        null, // observación
                        detalle.dia());

                // Agregar cargas
                if (detalle.cargas() != null && !detalle.cargas().isEmpty()) {
                    rutinaDetalle.setCargas(new ArrayList<>(detalle.cargas()));
                    // Usar la primera carga como carga principal
                    rutinaDetalle.setCarga(detalle.cargas().get(0));
                }

                rutina.agregarDetalle(rutinaDetalle);
            }
        }

        Rutina guardada = rutinaRepository.save(rutina);
        return guardada.getIdRutina();
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return "";
        }

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                double value = cell.getNumericCellValue();
                if (value == (long) value) {
                    return String.valueOf((long) value);
                } else {
                    return String.valueOf(value);
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return "";
        }
    }
}
