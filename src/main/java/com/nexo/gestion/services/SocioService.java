package com.nexo.gestion.services;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.entity.*;
import com.nexo.gestion.exceptions.*;
import com.nexo.gestion.repository.*;
import com.nexo.gestion.repository.AsistenciaRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class SocioService {
    private final SocioRepository socioRepository;
    private final MembresiaRepository membresiaRepository;
    private final SocioMembresiaRepository socioMembresiaRepository;
    private final PagoRepository pagoRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final RutinaRepository rutinaRepository;

    public SocioService(AsistenciaRepository asistenciaRepository, PagoRepository pagoRepository,
            SocioRepository socioRepository, MembresiaRepository membresiaRepository,
            SocioMembresiaRepository socioMembresiaRepository, RutinaRepository rutinaRepository) {
        this.socioRepository = socioRepository;
        this.membresiaRepository = membresiaRepository;
        this.socioMembresiaRepository = socioMembresiaRepository;
        this.pagoRepository = pagoRepository;
        this.asistenciaRepository = asistenciaRepository;
        this.rutinaRepository = rutinaRepository;
    }

    private AsistenciaSocioIdDTO convertirAAsistenciaSocioIdDTO(AsistenciaSocioId a) {
        return new AsistenciaSocioIdDTO(
                a.getDniSocio(),
                a.getFechaHora());
    }

    private SocioDTO convertirASocioDTO(Socio socio) {
        RutinaDTO rutinaActiva = null;
        var rutinaOpt = rutinaRepository.findFirstBySocioDniOrderByIdRutinaDesc(socio.getDni());
        if (rutinaOpt.isPresent()) {
            Rutina rutina = rutinaOpt.get();
            rutinaActiva = new RutinaDTO(
                    rutina.getIdRutina(),
                    rutina.getNombre(),
                    rutina.getDescripcion(),
                    rutina.getEmpleado().getDni(),
                    rutina.getEmpleado().getNombre(),
                    rutina.getSocio() != null ? rutina.getSocio().getDni() : null,
                    rutina.getSocio() != null ? rutina.getSocio().getNombre() : null,
                    rutina.getFecha(),
                    null);
        }
        return new SocioDTO(
                socio.getDni(),
                socio.getNombre(),
                socio.getTelefono(),
                socio.getEmail(),
                socio.getFechaNacimiento(),
                socio.isActivo(),
                rutinaActiva);
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
        return convertirASocioDTO(guardado);
    }

    public SocioDTO bajaSocio(String dni) {
        Socio socio = socioRepository.findById(dni).orElseThrow(() -> new ObjetoNoEncontradoException("dni"));
        socio.setActivo(false);
        Socio guardado = socioRepository.save(socio);
        return convertirASocioDTO(guardado);
    }

    public SocioDTO patchSocio(String dni, SocioPatchDTO socioPatch) {
        Socio socio = socioRepository.findById(dni).orElseThrow(() -> new ObjetoNoEncontradoException("dni"));

        if (socioPatch.getDni() != null) {
            socio.setDni(socioPatch.getDni());
        }

        if (socioPatch.getNombre() != null) {
            socio.setNombre(socioPatch.getNombre());
        }

        if (socioPatch.getEmail() != null) {
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
        List<SocioDTO> sociosDTO = new ArrayList<>();

        for (Socio socio : socios) {
            SocioDTO socioConvertido = convertirASocioDTO(socio);
            sociosDTO.add(socioConvertido);
        }

        return sociosDTO;
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
        socio.setActivo(true);

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

        if (!socioMembresiaRepository.estaActivoHoy(dni)) {
            Asistencia nuevaAsistencia = new Asistencia(socio, false);
            Asistencia guardada = asistenciaRepository.save(nuevaAsistencia);
            return convertirAAsistenciaSocioIdDTO(guardada.getIdAsistencia());
        }

        if (asistenciaRepository.socioVinoHoy(socio.getDni())) {
            throw new AsistenciaDiariaException();
        }

        if (socioMembresiaRepository.estaActivoHoy(dni) && asistenciasDisponibles(dni) == 0) {
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
        List<SocioDTO> socios = new ArrayList<>();

        String q = "%" + dniOrNombre.trim().toLowerCase() + "%";

        for (Socio socio : socioRepository.buscarPorNombreODni(q)) {
            SocioDTO socioDTO = convertirASocioDTO(socio);
            socios.add(socioDTO);
        }

        return socios;
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
        for (String dni : dnis) {
            if (socioMembresiaRepository.estaActivoEnElMesActual(dni)) {
                resultado.put(dni, true);
            } else {
                resultado.put(dni, false);
            }
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

        List<SocioDTO> content = pageResult.getContent()
                .stream()
                .map(this::convertirASocioDTO)
                .toList();

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
                null);
    }
}
