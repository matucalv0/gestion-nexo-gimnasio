package com.nexo.gestion.services;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.entity.*;
import com.nexo.gestion.exceptions.MembresiaVencidaException;
import com.nexo.gestion.exceptions.ObjetoDuplicadoException;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.exceptions.SocioInactivoException;
import com.nexo.gestion.repository.*;
import com.nexo.gestion.repository.AsistenciaRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class SocioService {
    private final SocioRepository socioRepository;
    private final MembresiaRepository membresiaRepository;
    private final SocioMembresiaRepository socioMembresiaRepository;
    private final PagoRepository pagoRepository;
    private final AsistenciaRepository asistenciaRepository;

    public SocioService(AsistenciaRepository asistenciaRepository, PagoRepository pagoRepository, SocioRepository socioRepository, MembresiaRepository membresiaRepository, SocioMembresiaRepository socioMembresiaRepository) {
        this.socioRepository = socioRepository;
        this.membresiaRepository = membresiaRepository;
        this.socioMembresiaRepository = socioMembresiaRepository;
        this.pagoRepository = pagoRepository;
        this.asistenciaRepository = asistenciaRepository;

    }

    private AsistenciaSocioIdDTO convertirAAsistenciaSocioIdDTO(AsistenciaSocioId a) {
        return new AsistenciaSocioIdDTO(
                a.getDniSocio(),
                a.getFechaHora()
        );
    }

    private SocioDTO convertirASocioDTO(Socio socio) {
        return new SocioDTO(
                socio.getDni(),
                socio.getNombre(),
                socio.getTelefono(),
                socio.getEmail(),
                socio.getFechaNacimiento(),
                socio.isActivo()
        );
    }

    private SocioMembresiaDTO convertirASocioMembresiaDTO(SocioMembresia socioMembresia) {
        return new SocioMembresiaDTO(
                socioMembresia.getIdSm(),
                socioMembresia.getFechaInicio(),
                socioMembresia.getFechaHasta(),
                socioMembresia.getPrecio()
        );
    }

    private MembresiaDTO convertirAMembresiaDTO(Membresia membresia) {
        return new MembresiaDTO(
                membresia.getIdMembresia(),
                membresia.getDuracionDias(),
                membresia.getPrecioSugerido(),
                membresia.getNombre(),
                membresia.getTipoMembresia(),
                membresia.getAsistenciasPorSemana(),
                membresia.isActivo()
        );
    }

    private PagoDTO convertirAPagoDTO(Pago pago) {
        return new PagoDTO(
                pago.getIdPago(),
                pago.getEstado(),
                pago.getFecha(),
                pago.getMonto()
        );
    }

    @Transactional
    public SocioDTO registrarSocio(SocioCreateDTO socioDTO) {
        if (socioRepository.existsById(socioDTO.getDni())) {
            throw new ObjetoDuplicadoException("El dni " + socioDTO.getDni() + " ");
        }

        if (socioRepository.existsByEmail(socioDTO.getEmail())){
            throw new ObjetoDuplicadoException("El email " + socioDTO.getEmail() + " ");
        }

        Socio socio = new Socio(socioDTO.getDni(), socioDTO.getNombre(), socioDTO.getTelefono(), socioDTO.getEmail(), socioDTO.getFechaNacimiento());
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

        Membresia membresia = membresiaRepository.findById(idMembresia).orElseThrow(() -> new ObjetoNoEncontradoException(String.valueOf(idMembresia)));

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

        if (!Boolean.TRUE.equals(socio.isActivo())) {
            throw new SocioInactivoException();
        }


        SocioMembresia membresia = membresiaVigente(socio);


        Asistencia nuevaAsistencia = new Asistencia(socio);
        Asistencia guardada = asistenciaRepository.save(nuevaAsistencia);
        return convertirAAsistenciaSocioIdDTO(guardada.getIdAsistencia());
    }

    public SocioMembresia membresiaVigente(Socio socio) {
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

        for (Socio socio: socioRepository.buscarPorNombreODni(dniOrNombre)){
            SocioDTO socioDTO = convertirASocioDTO(socio);
            socios.add(socioDTO);
        }


        return socios;
    }

    public int asistenciasDisponibles(String dni){
        Socio socio = socioRepository.findById(dni)
                .orElseThrow(() -> new ObjetoNoEncontradoException(dni));

        SocioMembresia membresiaActual = membresiaVigente(socio);


        int asistenciasPorSemana = Optional.ofNullable(membresiaActual.getMembresia().getAsistenciasPorSemana()).orElse(0);
        int duracionDias = Optional.ofNullable(membresiaActual.getMembresia().getDuracionDias()).orElse(0);

        long diasAsistidos = Optional.ofNullable(
                socioRepository.diasAsistidos(membresiaActual.getIdSm(), socio.getDni())
        ).orElse(0L);

        int cantidadAsistenciasMes = (int) Math.round(asistenciasPorSemana * (duracionDias / 7.0));




        return Math.toIntExact(Math.max(cantidadAsistenciasMes - diasAsistidos, 0));
    }

    public MembresiaVigenteDTO membresiaVigenteSocio(String dni){
        Socio socio = socioRepository.findById(dni).orElseThrow(() -> new ObjetoNoEncontradoException("No existe ningun socio con el dni " + dni));

        SocioMembresia suscripcionActiva = membresiaVigente(socio);

        return new MembresiaVigenteDTO(suscripcionActiva.getMembresia().getNombre(), suscripcionActiva.getMembresia().getTipoMembresia(), suscripcionActiva.getFechaHasta());

    }

    private boolean socioAsistioHoy(String dni){
        return socioRepository.asististenciasHoy(dni) > 0;
    }



}
