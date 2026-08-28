package com.nexo.gestion.services;

import com.nexo.gestion.config.MembresiaConfig;
import com.nexo.gestion.dto.*;
import com.nexo.gestion.entity.*;
import com.nexo.gestion.exceptions.*;
import com.nexo.gestion.repository.*;
import com.nexo.gestion.repository.AsistenciaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;
import java.sql.SQLException;

@Service
@Transactional(readOnly = true)
public class SocioService {
    private static final Logger log = LoggerFactory.getLogger(SocioService.class);
    private final SocioRepository socioRepository;
    private final MembresiaRepository membresiaRepository;
    private final SocioMembresiaRepository socioMembresiaRepository;
    private final PagoRepository pagoRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final RutinaRepository rutinaRepository;
    private final MembresiaConfig membresiaConfig;

    public SocioService(AsistenciaRepository asistenciaRepository, PagoRepository pagoRepository,
            SocioRepository socioRepository, MembresiaRepository membresiaRepository,
            SocioMembresiaRepository socioMembresiaRepository, RutinaRepository rutinaRepository,
            MembresiaConfig membresiaConfig) {
        this.socioRepository = socioRepository;
        this.membresiaRepository = membresiaRepository;
        this.socioMembresiaRepository = socioMembresiaRepository;
        this.pagoRepository = pagoRepository;
        this.asistenciaRepository = asistenciaRepository;
        this.rutinaRepository = rutinaRepository;
        this.membresiaConfig = membresiaConfig;
    }

    private AsistenciaSocioIdDTO convertirAAsistenciaSocioIdDTO(AsistenciaSocioId a) {
        return new AsistenciaSocioIdDTO(
                a.getDniSocio(),
                a.getFechaHora());
    }

    private SocioDTO convertirASocioDTO(Socio socio, Rutina rutina, boolean isActivo) {
        RutinaDTO rutinaActiva = null;
        if (rutina != null) {
            rutinaActiva = new RutinaDTO(
                    rutina.getIdRutina(),
                    rutina.getNombre(),
                    rutina.getDescripcion(),
                    rutina.getEmpleado().getDni(),
                    rutina.getEmpleado().getNombre(),
                    rutina.getSocio() != null ? rutina.getSocio().getDni() : null,
                    rutina.getSocio() != null ? rutina.getSocio().getNombre() : null,
                    rutina.getFecha(),
                    rutina.getPersonalizada() != null ? rutina.getPersonalizada() : false,
                    null);
        }

        SocioMembresia membresiaActual = socioMembresiaRepository.findActivaBySocio(socio.getDni()).orElse(null);
        Integer diasRestantes = null;
        Integer diasVencidos = null;
        LocalDate fechaVencimientoMembresia = null;
        LocalDate ultimaMembresiaVencimiento = null;
        boolean tieneMembresiaVigente = false;
        String nombreMembresia = null;

        if (membresiaActual != null) {
            tieneMembresiaVigente = true;
            LocalDate ultimoVencimientoVigente = socioMembresiaRepository.findUltimoVencimientoVigente(socio.getDni());
            fechaVencimientoMembresia = (ultimoVencimientoVigente != null) ? ultimoVencimientoVigente : membresiaActual.getFechaHasta();
            if (fechaVencimientoMembresia != null) {
                diasRestantes = Math.max(0, (int) java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), fechaVencimientoMembresia));
            }
            if (membresiaActual.getMembresia() != null) {
                nombreMembresia = membresiaActual.getMembresia().getNombre();
            }
        } else {
            ultimaMembresiaVencimiento = socioMembresiaRepository.findUltimoVencimientoGeneral(socio.getDni());
            if (ultimaMembresiaVencimiento != null) {
                if (ultimaMembresiaVencimiento.isBefore(LocalDate.now())) {
                    diasVencidos = Math.max(0, (int) java.time.temporal.ChronoUnit.DAYS.between(ultimaMembresiaVencimiento, LocalDate.now()));
                } else {
                    // Si el vencimiento es hoy o a futuro, la membresía está vigente
                    tieneMembresiaVigente = true;
                    fechaVencimientoMembresia = ultimaMembresiaVencimiento;
                    diasRestantes = Math.max(0, (int) java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), ultimaMembresiaVencimiento));
                    List<SocioMembresia> membresias = socioMembresiaRepository.findBySocioDniOrderByFechaInicioAsc(socio.getDni());
                    if (!membresias.isEmpty() && membresias.get(membresias.size() - 1).getMembresia() != null) {
                        nombreMembresia = membresias.get(membresias.size() - 1).getMembresia().getNombre();
                    }
                }
            }
        }

        return new SocioDTO(
                socio.getDni(),
                socio.getNombre(),
                socio.getTelefono(),
                socio.getEmail(),
                socio.getFechaNacimiento(),
                isActivo,
                diasRestantes,
                diasVencidos,
                fechaVencimientoMembresia,
                ultimaMembresiaVencimiento,
                tieneMembresiaVigente,
                nombreMembresia,
                rutinaActiva);
    }

    private SocioDTO convertirASocioDTO(Socio socio) {
        Rutina rutina = rutinaRepository.findFirstBySocioDniOrderByIdRutinaDesc(socio.getDni()).orElse(null);
        boolean isActivo = socioMembresiaRepository.estaActivoHoy(socio.getDni());
        return convertirASocioDTO(socio, rutina, isActivo);
    }

    private SocioMembresiaDTO convertirASocioMembresiaDTO(SocioMembresia socioMembresia) {
        return new SocioMembresiaDTO(
                socioMembresia.getIdSm(),
                socioMembresia.getFechaInicio(),
                socioMembresia.getFechaHasta(),
                socioMembresia.getPrecio());
    }

    private MembresiaDTO convertirAMembresiaDTO(Membresia membresia) {
        return new MembresiaDTO(
                membresia.getIdMembresia(),
                membresia.getDuracionDias(),
                membresia.getPrecioSugerido(),
                membresia.getNombre(),
                membresia.getTipoMembresia(),
                membresia.getAsistenciasPorSemana(),
                membresia.isActivo());
    }

    private DetallePagoDTO convertirDetallePagoADTO(DetallePago detallePago) {

        Integer idProducto = null;
        Integer idMembresia = null;
        String tipo = null;
        String nombre = null;

        if (detallePago.getProducto() != null) {
            idProducto = detallePago.getProducto().getIdProducto();
            tipo = "Producto";
            nombre = detallePago.getProducto().getNombre();
        } else if (detallePago.getSocioMembresia() != null) {
            idMembresia = detallePago.getSocioMembresia()
                    .getMembresia()
                    .getIdMembresia();
            tipo = "Membresía";
            nombre = detallePago.getSocioMembresia().getMembresia().getNombre();
        }

        return new DetallePagoDTO(
                tipo,
                nombre,
                detallePago.getCantidad(),
                detallePago.getPrecioUnitario(),
                idProducto,
                idMembresia);
    }

    private PagoDTO convertirAPagoDTO(Pago pago) {
        List<DetallePago> detalle = pago.getDetalles();
        List<DetallePagoDTO> detalleDTO = new ArrayList<>();

        for (DetallePago d : detalle) {
            detalleDTO.add(convertirDetallePagoADTO(d));

        }

        String dniSocio = null;
        String nombreSocio = null;
        if (pago.getSocio() != null) {
            dniSocio = pago.getSocio().getDni();
            nombreSocio = pago.getSocio().getNombre();
        }

        return new PagoDTO(
                pago.getIdPago(),
                pago.getEstado(),
                pago.getFecha(),
                pago.getMonto(),
                detalleDTO,
                dniSocio,
                nombreSocio);
    }

    @Transactional
    public SocioDTO registrarSocio(SocioCreateDTO socioDTO) {
        if (socioRepository.existsById(socioDTO.getDni())) {
            throw new ObjetoDuplicadoException("El dni " + socioDTO.getDni() + " ");
        }

        if (socioRepository.existsByEmail(socioDTO.getEmail())) {
            throw new ObjetoDuplicadoException("El email " + socioDTO.getEmail() + " ");
        }

        Socio socio = new Socio(socioDTO.getDni(), socioDTO.getNombre(), socioDTO.getTelefono(), socioDTO.getEmail(),
                socioDTO.getFechaNacimiento());
        Socio guardado = socioRepository.save(socio);
        return convertirASocioDTO(guardado, null, false);
    }

    @Transactional
    public SocioDTO bajaSocio(String dni) {
        Socio socio = socioRepository.findById(dni).orElseThrow(() -> new ObjetoNoEncontradoException("socio con DNI " + dni));
        socio.setActivo(false);
        // También dar de baja todas las membresías vigentes/futuras para que dinámicamente quede inactivo
        List<SocioMembresia> membresias = socioMembresiaRepository.findBySocioDniOrderByFechaInicioAsc(dni);
        for (SocioMembresia sm : membresias) {
            if (sm.isActivo() && (sm.getFechaHasta() == null || !sm.getFechaHasta().isBefore(LocalDate.now()))) {
                sm.setActivo(false);
                socioMembresiaRepository.save(sm);
            }
        }
        Socio guardado = socioRepository.save(socio);
        return convertirASocioDTO(guardado, null, false);
    }

    @Transactional
    public SocioDTO patchSocio(String dni, SocioPatchDTO socioPatch) {
        String dniActual = dni;
        Socio socio = socioRepository.findById(dni).orElseThrow(() -> new ObjetoNoEncontradoException("socio con DNI " + dni));

        String dniNuevo = socioPatch.getNuevoDni();
        if (dniNuevo != null && !dniNuevo.isBlank() && !dniNuevo.equals(dniActual)) {
            if (socioRepository.existsById(dniNuevo)) {
                throw new ObjetoDuplicadoException("El DNI " + dniNuevo + " ya pertenece a otro socio");
            }
            // Actualizar en DB directo para que salten los CASCADE
            socioRepository.actualizarDni(dniActual, dniNuevo);
            // Hacer flush para que el EntityManager limpie el contexto y buscar el nuevo
            socioRepository.flush();
            String finalDni = dniNuevo;
            socio = socioRepository.findById(finalDni).orElseThrow(() -> new ObjetoNoEncontradoException("socio con DNI " + finalDni));
            dniActual = finalDni; // Actualizar variable local
        }

        if (socioPatch.getNombre() != null) {
            socio.setNombre(socioPatch.getNombre());
        }

        if (socioPatch.getEmail() != null) {
            if (!socio.getEmail().equals(socioPatch.getEmail()) && socioRepository.existsByEmail(socioPatch.getEmail())) {
                throw new ObjetoDuplicadoException("El email " + socioPatch.getEmail() + " ya existe");
            }
            socio.setEmail(socioPatch.getEmail());
        }
        if (socioPatch.getTelefono() != null) {
            socio.setTelefono(socioPatch.getTelefono());
        }
        if (socioPatch.getActivo() != null) {
            socio.setActivo(socioPatch.getActivo());
        }
        if (socioPatch.getFechaNacimiento() != null) {
            socio.setFechaNacimiento(socioPatch.getFechaNacimiento());
        }

        Socio guardado = socioRepository.save(socio);
        return convertirASocioDTO(guardado);
    }

    public SocioDTO buscarSocioPorDni(String dni) {
        Socio socio = socioRepository.findById(dni).orElseThrow(() -> new ObjetoNoEncontradoException("dni"));
        return convertirASocioDTO(socio);
    }

    public List<SocioDTO> buscarSocios() {
        List<Socio> socios = socioRepository.findAll();
        return mapearSociosADTOConRutinas(socios);
    }

    private List<SocioDTO> mapearSociosADTOConRutinas(List<Socio> socios) {
        if (socios.isEmpty()) return new ArrayList<>();

        List<String> dnis = socios.stream().map(Socio::getDni).toList();
        Map<String, Rutina> rutinasMap = rutinaRepository.findLatestBySocioDnis(dnis).stream()
                .collect(Collectors.toMap(r -> r.getSocio().getDni(), r -> r));

        List<String> dnisActivos = socioMembresiaRepository.findDnisActivosHoy(dnis);
        Set<String> activosSet = new HashSet<>(dnisActivos);

        return socios.stream()
                .map(s -> convertirASocioDTO(s, rutinasMap.get(s.getDni()), activosSet.contains(s.getDni())))
                .collect(Collectors.toList());
    }

    @Transactional
    public SocioMembresiaDTO asignarMembresia(String dni, Integer idMembresia) {
        Socio socio = socioRepository.findById(dni).orElseThrow(() -> new ObjetoNoEncontradoException(dni));

        Membresia membresia = membresiaRepository.findById(idMembresia)
                .orElseThrow(() -> new ObjetoNoEncontradoException(String.valueOf(idMembresia)));

        SocioMembresia socioMembresia = new SocioMembresia(socio, membresia);

        socio.agregarMembresia(socioMembresia);
        membresia.agregarSocio(socioMembresia);

        SocioMembresia guardada = socioMembresiaRepository.save(socioMembresia);

        return convertirASocioMembresiaDTO(guardada);
    }

    @Transactional(readOnly = true)
    public List<PagoDTO> buscarPagosPorDni(String dni) {
        if (!socioRepository.existsById(dni)) {
            throw new ObjetoNoEncontradoException(dni);
        }

        List<PagoDTO> pagos = new ArrayList<>();

        for (Pago pago : pagoRepository.buscarPagosPorSocio(dni)) {
            PagoDTO pagoConvertido = convertirAPagoDTO(pago);
            pagos.add(pagoConvertido);
        }

        return pagos;
    }

    @Transactional
    public AsistenciaSocioIdDTO registrarAsistencia(String dni) {
        Socio socio = socioRepository.findById(dni).orElseThrow(() -> new ObjetoNoEncontradoException(dni));

        // Verificar si ya asistió hoy (aplica para todos los casos)
        if (asistenciaRepository.socioVinoHoy(socio.getDni())) {
            throw new AsistenciaDiariaException();
        }

        int periodoGracia = membresiaConfig.getPeriodoGracia();
        boolean tieneMembresiasActiva = socioMembresiaRepository.estaActivoHoy(dni);
        boolean estaEnGracia = socioMembresiaRepository.estaEnPeriodoGracia(dni, periodoGracia);

        // Si no tiene membresía activa y no está en período de gracia
        if (!tieneMembresiasActiva && !estaEnGracia) {
            // Registrar como pendiente
            Asistencia nuevaAsistencia = new Asistencia(socio, false);
            return guardarAsistencia(nuevaAsistencia);
        }

        // Si está en período de gracia (membresía vencida pero dentro del período)
        if (!tieneMembresiasActiva && estaEnGracia) {
            // Registrar como pendiente (período de gracia = asistencia válida pero sin consumir de membresía nueva)
            Asistencia nuevaAsistencia = new Asistencia(socio, false);
            return guardarAsistencia(nuevaAsistencia);
        }

        // Si tiene membresía activa pero no tiene asistencias disponibles
        if (tieneMembresiasActiva && asistenciasDisponibles(dni) == 0) {
            throw new SocioSinAsistenciasDisponiblesException();
        }

        Asistencia nuevaAsistencia = new Asistencia(socio, true);
        return guardarAsistencia(nuevaAsistencia);
    }

    /**
     * Guarda una asistencia y atrapa la violación de constraint único (dni + fecha)
     * que puede ocurrir por concurrencia o problemas de red.
     */
    private AsistenciaSocioIdDTO guardarAsistencia(Asistencia asistencia) {
        try {
            Asistencia guardada = asistenciaRepository.saveAndFlush(asistencia);
            return convertirAAsistenciaSocioIdDTO(guardada.getIdAsistencia());
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            Throwable rootCause = e.getMostSpecificCause();
            boolean isUniqueConstraintViolation = false;

            if (rootCause instanceof SQLException) {
                String sqlState = ((SQLException) rootCause).getSQLState();
                if ("23505".equals(sqlState)) {
                    isUniqueConstraintViolation = true;
                }
            }

            if (!isUniqueConstraintViolation && rootCause != null && rootCause.getMessage() != null) {
                // Fallback por nombre de constraint/índice en el mensaje de error
                if (rootCause.getMessage().contains("uq_asistencia_dni_fecha")) {
                    isUniqueConstraintViolation = true;
                }
            }

            if (isUniqueConstraintViolation) {
                throw new AsistenciaDiariaException();
            }

            // Para otras violaciones de integridad, re-lanzamos la excepción original
            throw e;
        }
    }

    private SocioMembresia membresiaVigente(Socio socio) {
        LocalDate hoy = LocalDate.now();

        SocioMembresia socioMembresia = socioMembresiaRepository
                .findActivaBySocio(socio.getDni())
                .orElseThrow(MembresiaVencidaException::new);

        if (!socioMembresia.cubre(hoy)) {
            throw new MembresiaVencidaException();
        }

        return socioMembresia;
    }

    public List<SocioDTO> buscarSocios(String dniOrNombre) {
        String q = "%" + dniOrNombre.trim().toLowerCase() + "%";
        List<Socio> socios = socioRepository.buscarPorNombreODni(q);
        return mapearSociosADTOConRutinas(socios);
    }

    public int asistenciasDisponibles(String dni) {
        Socio socio = socioRepository.findById(dni)
                .orElseThrow(() -> new ObjetoNoEncontradoException(dni));

        SocioMembresia membresiaActual = membresiaVigente(socio);

        int asistenciasPorSemana = Optional.ofNullable(membresiaActual.getMembresia().getAsistenciasPorSemana())
                .orElse(0);
        
        if (asistenciasPorSemana == 0) {
            return Integer.MAX_VALUE; // Ilimitadas
        }

        int duracionDias = Optional.ofNullable(membresiaActual.getMembresia().getDuracionDias()).orElse(0);

        long diasAsistidos = Optional.ofNullable(
                socioRepository.diasAsistidos(membresiaActual.getIdSm(), socio.getDni())).orElse(0L);

        int cantidadAsistenciasMes = (int) Math.ceil(asistenciasPorSemana * (duracionDias / 7.0));

        return Math.toIntExact(Math.max(cantidadAsistenciasMes - diasAsistidos, 0));
    }

    public MembresiaVigenteDTO membresiaVigenteSocio(String dni) {
        Socio socio = socioRepository.findById(dni)
                .orElseThrow(() -> new ObjetoNoEncontradoException("No existe ningun socio con el dni " + dni));

        SocioMembresia suscripcionActiva = membresiaVigente(socio);

        LocalDate ultimoVencimiento = socioMembresiaRepository.findUltimoVencimientoVigente(dni);
        LocalDate fechaVencimiento = (ultimoVencimiento != null) ? ultimoVencimiento : suscripcionActiva.getFechaHasta();

        return new MembresiaVigenteDTO(suscripcionActiva.getMembresia().getNombre(),
                suscripcionActiva.getMembresia().getTipoMembresia(), fechaVencimiento);

    }

    private boolean socioAsistioHoy(String dni) {
        return socioRepository.asististenciasHoy(dni) > 0;
    }

    public Integer diasParaVencimientoMembresiaVigente(String dni) {
        Socio socio = socioRepository.findById(dni)
                .orElseThrow(() -> new ObjetoNoEncontradoException("No existe ningun socio con el dni " + dni));

        SocioMembresia suscripcionActiva = membresiaVigente(socio);

        LocalDate ultimoVencimiento = socioMembresiaRepository.findUltimoVencimientoVigente(dni);
        LocalDate fechaVencimiento = (ultimoVencimiento != null) ? ultimoVencimiento : suscripcionActiva.getFechaHasta();

        if (fechaVencimiento == null) {
            return 9999;
        }

        return Math.max(0, (int) java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), fechaVencimiento));
    }

    public Boolean socioActivoMes(String dni) {
        return socioMembresiaRepository.estaActivoEnElMesActual(dni);
    }

    public Map<String, Boolean> listadoSociosActivosEnELMes(List<String> dnis) {
        Map<String, Boolean> resultado = new HashMap<>();
        // Batch query: una sola consulta en vez de N queries individuales
        List<String> dnisActivos = socioMembresiaRepository.findDnisActivosEnElMes(dnis);
        Set<String> activosSet = new HashSet<>(dnisActivos);
        for (String dni : dnis) {
            resultado.put(dni, activosSet.contains(dni));
        }
        return resultado;
    }

    public List<SocioInactivoDTO> obtenerSociosInactivos(Integer dias) {
        List<Object[]> rows = socioMembresiaRepository.sociosActivosSinAsistencia(dias);
        List<SocioInactivoDTO> inactivos = new ArrayList<>();

        for (Object[] row : rows) {
            String dni = (String) row[0];
            String nombre = (String) row[1];
            String telefono = (String) row[2];
            Integer diasSinAsistir = ((Number) row[3]).intValue();
            LocalDate ultimaAsistencia = row[4] != null ? ((java.sql.Date) row[4]).toLocalDate() : null;

            inactivos.add(new SocioInactivoDTO(dni, nombre, telefono, diasSinAsistir, ultimaAsistencia));
        }

        return inactivos;
    }

    public PageResponseDTO<SocioDTO> buscarSociosPaginados(int page, int size, String q, String activo) {
        if (q != null && !q.trim().isEmpty()) {
            q = "%" + q.trim().toLowerCase() + "%";
        } else {
            q = null;
        }

        org.springframework.data.domain.Page<Socio> pageResult = socioRepository.buscarSociosPaginados(q, activo,
                org.springframework.data.domain.PageRequest.of(page, size));

        List<SocioDTO> dtos = mapearSociosADTOConRutinas(pageResult.getContent());

        return new PageResponseDTO<>(
                dtos,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages());
    }

    public RutinaDTO obtenerRutinaActivaDeSocio(String dni) {
        var rutinaOpt = rutinaRepository.findFirstBySocioDniOrderByIdRutinaDesc(dni);
        if (rutinaOpt.isEmpty()) {
            return null;
        }
        Rutina rutina = rutinaOpt.get();
        return new RutinaDTO(
                rutina.getIdRutina(),
                rutina.getNombre(),
                rutina.getDescripcion(),
                rutina.getEmpleado().getDni(),
                rutina.getEmpleado().getNombre(),
                rutina.getSocio() != null ? rutina.getSocio().getDni() : null,
                rutina.getSocio() != null ? rutina.getSocio().getNombre() : null,
                rutina.getFecha(),
                rutina.getPersonalizada() != null ? rutina.getPersonalizada() : false,
                null);
    }

    public PageResponseDTO<SocioListadoDTO> buscarSociosExtendidos(int page, int size, String q, String activo) {
        if (q != null && !q.trim().isEmpty()) {
            q = "%" + q.trim().toLowerCase() + "%";
        } else {
            q = null;
        }

        int offset = page * size;
        List<Object[]> rows = socioRepository.buscarSociosExtendidos(q, activo, size, offset);
        Long total = socioRepository.contarSociosExtendidos(q, activo);
        if (total == null) total = 0L;

        List<SocioListadoDTO> content = new ArrayList<>();
        for (Object[] row : rows) {
            try {
                String dni = (String) row[0];
                String nombre = (String) row[1];
                String telefono = (String) row[2];
                String email = (String) row[3];

                LocalDate fechaNacimiento = null;
                if (row[4] != null) {
                    if (row[4] instanceof java.sql.Date) {
                        fechaNacimiento = ((java.sql.Date) row[4]).toLocalDate();
                    } else if (row[4] instanceof java.time.LocalDate) {
                        fechaNacimiento = (java.time.LocalDate) row[4];
                    }
                }

                String nombreMembresia = (String) row[5];
                
                LocalDate fechaVencimiento = null;
                if (row[6] != null) {
                    if (row[6] instanceof java.sql.Date) {
                        fechaVencimiento = ((java.sql.Date) row[6]).toLocalDate();
                    } else if (row[6] instanceof java.time.LocalDate) {
                        fechaVencimiento = (java.time.LocalDate) row[6];
                    }
                }

                Integer diasRestantes = null;
                if (row[7] != null) {
                    diasRestantes = ((Number) row[7]).intValue();
                }

                LocalDateTime ultimaAsistencia = null;
                if (row[10] != null) {
                    if (row[10] instanceof java.sql.Timestamp) {
                        ultimaAsistencia = ((java.sql.Timestamp) row[10]).toLocalDateTime();
                    } else if (row[10] instanceof java.time.LocalDateTime) {
                        ultimaAsistencia = (java.time.LocalDateTime) row[10];
                    }
                }

                Integer diasSinAsistir = null;
                if (ultimaAsistencia != null) {
                    diasSinAsistir = (int) java.time.temporal.ChronoUnit.DAYS.between(ultimaAsistencia.toLocalDate(), LocalDate.now());
                }

                Boolean isActivo = fechaVencimiento != null;

                content.add(new SocioListadoDTO(
                        dni,
                        nombre,
                        telefono,
                        email,
                        fechaNacimiento,
                        isActivo,
                        nombreMembresia,
                        fechaVencimiento,
                        diasRestantes,
                        ultimaAsistencia,
                        diasSinAsistir
                ));
            } catch (Exception e) {
                System.err.println("Error mapping row: " + java.util.Arrays.toString(row));
                e.printStackTrace();
            }
        }

        int totalPages = (int) Math.ceil((double) total / size);

        return new PageResponseDTO<>(
                content,
                page,
                size,
                total,
                totalPages);
    }

    public SociosCategorizadosDTO buscarSociosCategorizados(int page, int size, String q, String activo) {
        if (q != null && !q.trim().isEmpty()) {
            q = "%" + q.trim().toLowerCase() + "%";
        } else {
            q = null;
        }
        long totalActivos = socioRepository.contarSociosActivosFiltrado(q);
        long totalVencidos = socioRepository.contarSociosVencidosFiltrado(q);
        long totalSinMembresia = socioRepository.contarSociosSinMembresiafiltrado(q);

        List<Socio> socios;
        long totalElements;

        if (activo == null || activo.isBlank() || "TODOS".equalsIgnoreCase(activo) || "ALL".equalsIgnoreCase(activo)) {
            socios = socioRepository.buscarSociosTodos(q, size, page * size);
            totalElements = socioRepository.contarSociosTodosFiltrado(q);
        } else if ("ACTIVOS".equalsIgnoreCase(activo) || "ACTIVO".equalsIgnoreCase(activo) || "TRUE".equalsIgnoreCase(activo)) {
            socios = socioRepository.buscarSociosActivosNative(q, size, page * size);
            totalElements = totalActivos;
        } else if ("VENCIDOS".equalsIgnoreCase(activo) || "VENCIDO".equalsIgnoreCase(activo) || "INACTIVOS".equalsIgnoreCase(activo) || "INACTIVO".equalsIgnoreCase(activo) || "FALSE".equalsIgnoreCase(activo)) {
            socios = socioRepository.buscarSociosVencidosNative(q, size, page * size);
            totalElements = totalVencidos;
        } else if ("SIN_MEMBRESIA".equalsIgnoreCase(activo) || "SIN_MEMBRESIAS".equalsIgnoreCase(activo) || "SIN-MEMBRESIA".equalsIgnoreCase(activo) || "SINMEMBRESIA".equalsIgnoreCase(activo)) {
            socios = socioRepository.buscarSociosSinMembresiaNative(q, size, page * size);
            totalElements = totalSinMembresia;
        } else {
            socios = socioRepository.buscarSociosTodos(q, size, page * size);
            totalElements = socioRepository.contarSociosTodosFiltrado(q);
        }

        List<SocioDTO> dtos = mapearSociosADTOConRutinas(socios);
        
        int totalPages = (int) Math.ceil((double) totalElements / size);
        return new SociosCategorizadosDTO(totalActivos, totalVencidos, totalSinMembresia, dtos, page, size, totalElements, totalPages);
    }

    public PageResponseDTO<SocioDTO> buscarSociosActivos(String q, int page, int size) {
        if (q != null && !q.trim().isEmpty()) {
            q = "%" + q.trim().toLowerCase() + "%";
        } else {
            q = null;
        }
        List<Socio> socios = socioRepository.buscarSociosActivosNative(q, size, page * size);
        long total = socioRepository.contarSociosActivosFiltrado(q);
        List<SocioDTO> dtos = mapearSociosADTOConRutinas(socios);
        int totalPages = (int) Math.ceil((double) total / size);
        return new PageResponseDTO<>(dtos, page, size, total, totalPages);
    }

    public PageResponseDTO<SocioDTO> buscarSociosVencidos(String q, int page, int size) {
        if (q != null && !q.trim().isEmpty()) {
            q = "%" + q.trim().toLowerCase() + "%";
        } else {
            q = null;
        }
        List<Socio> socios = socioRepository.buscarSociosVencidosNative(q, size, page * size);
        long total = socioRepository.contarSociosVencidosFiltrado(q);
        List<SocioDTO> dtos = mapearSociosADTOConRutinas(socios);
        int totalPages = (int) Math.ceil((double) total / size);
        return new PageResponseDTO<>(dtos, page, size, total, totalPages);
    }

    public PageResponseDTO<SocioDTO> buscarSociosSinMembresia(String q, int page, int size) {
        if (q != null && !q.trim().isEmpty()) {
            q = "%" + q.trim().toLowerCase() + "%";
        } else {
            q = null;
        }
        List<Socio> socios = socioRepository.buscarSociosSinMembresiaNative(q, size, page * size);
        long total = socioRepository.contarSociosSinMembresiafiltrado(q);
        List<SocioDTO> dtos = mapearSociosADTOConRutinas(socios);
        int totalPages = (int) Math.ceil((double) total / size);
        return new PageResponseDTO<>(dtos, page, size, total, totalPages);
    }

    public Map<String, Object> buscarSociosEstadisticas() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalActivos", socioRepository.contarSociosExtendidos(null, "ACTIVOS"));
        stats.put("totalVencidos", socioRepository.contarSociosExtendidos(null, "VENCIDOS"));
        stats.put("totalSinMembresia", socioRepository.contarSociosExtendidos(null, "SIN_MEMBRESIA"));
        return stats;
    }

    public Map<String, Object> obtenerUltimoVencimiento(String dni) {
        if (!socioRepository.existsById(dni)) {
            throw new ObjetoNoEncontradoException("socio con DNI " + dni);
        }

        LocalDate ultimoVencimientoGeneral = socioMembresiaRepository.findUltimoVencimientoGeneral(dni);
        LocalDate ultimoVencimientoVigente = socioMembresiaRepository.findUltimoVencimientoVigente(dni);

        // Asistencias pendientes del último mes (30 días)
        Integer pendientesCount = asistenciaRepository.asistenciasPendientesUltimoMes(dni);
        java.time.Instant primeraAsistenciaPendiente = null;
        if (pendientesCount != null && pendientesCount > 0) {
            primeraAsistenciaPendiente = asistenciaRepository.fechaPrimeraAsistenciaPendienteUltimoMes(dni);
        }

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("ultimoVencimiento", ultimoVencimientoGeneral);
        resultado.put("vigente", ultimoVencimientoVigente != null);
        resultado.put("asistenciasPendientes", pendientesCount != null ? pendientesCount : 0);
        resultado.put("primeraAsistenciaPendiente", primeraAsistenciaPendiente != null
                ? primeraAsistenciaPendiente.atZone(java.time.ZoneId.systemDefault()).toLocalDate().toString()
                : null);
        return resultado;
    }
}
