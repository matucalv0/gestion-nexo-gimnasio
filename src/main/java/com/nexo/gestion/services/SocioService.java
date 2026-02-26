package com.nexo.gestion.services;

import com.nexo.gestion.config.MembresiaConfig;
import com.nexo.gestion.dto.*;
import com.nexo.gestion.entity.*;
import com.nexo.gestion.exceptions.*;
import com.nexo.gestion.repository.*;
import com.nexo.gestion.repository.AsistenciaRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
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
        return new SocioDTO(
                socio.getDni(),
                socio.getNombre(),
                socio.getTelefono(),
                socio.getEmail(),
                socio.getFechaNacimiento(),
                isActivo,
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

        return new PagoDTO(
                pago.getIdPago(),
                pago.getEstado(),
                pago.getFecha(),
                pago.getMonto(),
                detalleDTO);
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
        // También dar de baja la membresía vigente para que dinámicamente quede inactivo
        socioMembresiaRepository.findActivaBySocio(dni).ifPresent(sm -> {
            sm.setActivo(false);
            socioMembresiaRepository.save(sm);
        });
        Socio guardado = socioRepository.save(socio);
        return convertirASocioDTO(guardado, null, false);
    }

    @Transactional
    public SocioDTO patchSocio(String dni, SocioPatchDTO socioPatch) {
        Socio socio = socioRepository.findById(dni).orElseThrow(() -> new ObjetoNoEncontradoException("socio con DNI " + dni));

        if (socioPatch.getDni() != null && !socioPatch.getDni().equals(dni)) {
            throw new IllegalStateException("No se permite modificar el DNI de un socio existente");
        }

        if (socioPatch.getNombre() != null) {
            socio.setNombre(socioPatch.getNombre());
        }

        if (socioPatch.getEmail() != null) {
            if (socioRepository.existsByEmail(socioPatch.getEmail())) {
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

    public AsistenciaSocioIdDTO registrarAsistencia(String dni) {
        Socio socio = socioRepository.findById(dni).orElseThrow(() -> new ObjetoNoEncontradoException(dni));

        int periodoGracia = membresiaConfig.getPeriodoGracia();
        boolean tieneMembresiasActiva = socioMembresiaRepository.estaActivoHoy(dni);
        boolean estaEnGracia = socioMembresiaRepository.estaEnPeriodoGracia(dni, periodoGracia);

        // Si no tiene membresía activa y no está en período de gracia
        if (!tieneMembresiasActiva && !estaEnGracia) {
            // Registrar como pendiente
            Asistencia nuevaAsistencia = new Asistencia(socio, false);
            Asistencia guardada = asistenciaRepository.save(nuevaAsistencia);
            return convertirAAsistenciaSocioIdDTO(guardada.getIdAsistencia());
        }

        // Verificar si ya asistió hoy
        if (asistenciaRepository.socioVinoHoy(socio.getDni())) {
            throw new AsistenciaDiariaException();
        }

        // Si está en período de gracia (membresía vencida pero dentro del período)
        if (!tieneMembresiasActiva && estaEnGracia) {
            // Registrar como pendiente (período de gracia = asistencia válida pero sin consumir de membresía nueva)
            Asistencia nuevaAsistencia = new Asistencia(socio, false);
            Asistencia guardada = asistenciaRepository.save(nuevaAsistencia);
            return convertirAAsistenciaSocioIdDTO(guardada.getIdAsistencia());
        }

        // Si tiene membresía activa pero no tiene asistencias disponibles
        if (tieneMembresiasActiva && asistenciasDisponibles(dni) == 0) {
            throw new SocioSinAsistenciasDisponiblesException();
        }

        // SocioMembresia membresia = membresiaVigente(socio);

        Asistencia nuevaAsistencia = new Asistencia(socio, true);
        Asistencia guardada = asistenciaRepository.save(nuevaAsistencia);
        return convertirAAsistenciaSocioIdDTO(guardada.getIdAsistencia());
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
        int duracionDias = Optional.ofNullable(membresiaActual.getMembresia().getDuracionDias()).orElse(0);

        long diasAsistidos = Optional.ofNullable(
                socioRepository.diasAsistidos(membresiaActual.getIdSm(), socio.getDni())).orElse(0L);

        int cantidadAsistenciasMes = (int) Math.floor(asistenciasPorSemana * (duracionDias / 7.0));

        return Math.toIntExact(Math.max(cantidadAsistenciasMes - diasAsistidos, 0));
    }

    public MembresiaVigenteDTO membresiaVigenteSocio(String dni) {
        Socio socio = socioRepository.findById(dni)
                .orElseThrow(() -> new ObjetoNoEncontradoException("No existe ningun socio con el dni " + dni));

        SocioMembresia suscripcionActiva = membresiaVigente(socio);

        return new MembresiaVigenteDTO(suscripcionActiva.getMembresia().getNombre(),
                suscripcionActiva.getMembresia().getTipoMembresia(), suscripcionActiva.getFechaHasta());

    }

    private boolean socioAsistioHoy(String dni) {
        return socioRepository.asististenciasHoy(dni) > 0;
    }

    public Integer diasParaVencimientoMembresiaVigente(String dni) {
        Socio socio = socioRepository.findById(dni)
                .orElseThrow(() -> new ObjetoNoEncontradoException("No existe ningun socio con el dni " + dni));

        Integer idMembresiaVigente = membresiaVigente(socio).getIdSm();

        Integer dias = socioMembresiaRepository.cantidadDiasParaVencimiento(dni, idMembresiaVigente);

        return socioMembresiaRepository.cantidadDiasParaVencimiento(dni, idMembresiaVigente);
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

    public PageResponseDTO<SocioDTO> buscarSociosPaginados(int page, int size, String q, Boolean activo) {
        if (q != null && !q.trim().isEmpty()) {
            q = "%" + q.trim().toLowerCase() + "%";
        } else {
            q = null;
        }

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);

        org.springframework.data.domain.Page<Socio> pageResult = socioRepository.buscarSociosPaginados(q, activo,
                pageable);

        List<SocioDTO> content = mapearSociosADTOConRutinas(pageResult.getContent());

        return new PageResponseDTO<>(
                content,
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

    public PageResponseDTO<SocioListadoDTO> buscarSociosExtendidos(int page, int size, String q, Boolean activo) {
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

                Integer diasRestantes = row[7] != null ? ((Number) row[7]).intValue() : null;

                java.time.LocalDateTime ultimaAsistencia = null;
                Integer diasSinAsistir = null;
                if (row[8] != null) {
                    if (row[8] instanceof java.sql.Timestamp) {
                        ultimaAsistencia = ((java.sql.Timestamp) row[8]).toLocalDateTime();
                    } else if (row[8] instanceof java.time.OffsetDateTime) {
                        ultimaAsistencia = ((java.time.OffsetDateTime) row[8]).toLocalDateTime();
                    } else if (row[8] instanceof java.time.LocalDateTime) {
                        ultimaAsistencia = (java.time.LocalDateTime) row[8];
                    }
                    if (ultimaAsistencia != null) {
                        diasSinAsistir = (int) java.time.temporal.ChronoUnit.DAYS.between(
                            ultimaAsistencia.toLocalDate(), LocalDate.now());
                    }
                }

                boolean esActivo = nombreMembresia != null;

                content.add(new SocioListadoDTO(
                        dni, nombre, telefono, email, fechaNacimiento, esActivo,
                        nombreMembresia, fechaVencimiento, diasRestantes,
                        ultimaAsistencia, diasSinAsistir
                ));
            } catch (Exception e) {
                // Log error pero continuar con los demás registros
                log.error("Error procesando socio: {}", e.getMessage(), e);
            }
        }

        int totalPages = (int) Math.ceil((double) total / size);
        return new PageResponseDTO<>(content, page, size, total, totalPages);
    }

    public Map<String, Object> obtenerUltimoVencimiento(String dni) {
        if (!socioRepository.existsById(dni)) {
            throw new ObjetoNoEncontradoException("socio con DNI " + dni);
        }

        LocalDate ultimoVencimientoGeneral = socioMembresiaRepository.findUltimoVencimientoGeneral(dni);
        LocalDate ultimoVencimientoVigente = socioMembresiaRepository.findUltimoVencimientoVigente(dni);

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("ultimoVencimiento", ultimoVencimientoGeneral);
        resultado.put("vigente", ultimoVencimientoVigente != null);
        return resultado;
    }
}
