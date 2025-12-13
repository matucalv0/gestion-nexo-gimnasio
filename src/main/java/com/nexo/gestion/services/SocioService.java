package com.nexo.gestion.services;

import com.nexo.gestion.dto.*;
import com.nexo.gestion.entity.*;
import com.nexo.gestion.exceptions.ObjetoDuplicadoException;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class SocioService {
    private final SocioRepository socioRepository;
    private final MembresiaRepository membresiaRepository;
    private final SocioMembresiaRepository socioMembresiaRepository;
    private final PagoRepository pagoRepository;
    private final AsistenciaRepository asistenciaRepository;

    public SocioService(AsistenciaRepository asistenciaRepository ,PagoRepository pagoRepository, SocioRepository socioRepository, MembresiaRepository membresiaRepository, SocioMembresiaRepository socioMembresiaRepository){
        this.socioRepository = socioRepository;
        this.membresiaRepository = membresiaRepository;
        this.socioMembresiaRepository = socioMembresiaRepository;
        this.pagoRepository = pagoRepository;
        this.asistenciaRepository = asistenciaRepository;

    }

    private AsistenciaSocioIdDTO convertirAAsistenciaSocioIdDTO(AsistenciaSocioId a){
        return new AsistenciaSocioIdDTO(
                a.getDniSocio(),
                a.getFecha_hora()
        );
    }

    private SocioDTO convertirASocioDTO(Socio socio) {
        return new SocioDTO(
                socio.getDni(),
                socio.getNombre(),
                socio.getTelefono(),
                socio.getEmail(),
                socio.getFecha_nacimiento(),
                socio.isActivo()
        );
    }

    private SocioMembresiaDTO convertirASocioMembresiaDTO(SocioMembresia socioMembresia) {
        return new SocioMembresiaDTO(
                socioMembresia.getId_sm(),
                socioMembresia.getFecha_inicio(),
                socioMembresia.getFecha_hasta(),
                socioMembresia.getPrecio()
        );
    }

    private PagoDTO convertirAPagoDTO(Pago pago) {
        return new PagoDTO(
                pago.getId_pago(),
                pago.getEstado(),
                pago.getFecha(),
                pago.getMonto()
        );
    }

    public SocioDTO registrarSocio(SocioCreateDTO socioDTO){
        if (socioRepository.existsById(socioDTO.getDni())) {
            throw new ObjetoDuplicadoException(socioDTO.getDni());
        }

        Socio socio = new Socio(socioDTO.getDni(), socioDTO.getNombre(), socioDTO.getTelefono(), socioDTO.getEmail(), socioDTO.getFecha_nacimiento());
        Socio guardado = socioRepository.save(socio);
        return convertirASocioDTO(guardado);
    }

    public SocioDTO bajaSocio(String dni){
        Socio socio = socioRepository.findById(dni).orElseThrow(() -> new ObjetoNoEncontradoException("dni"));
        socio.setActivo(false);
        Socio guardado = socioRepository.save(socio);
        return convertirASocioDTO(guardado);
    }

    public SocioDTO patchSocio(String dni, SocioPatchDTO socioPatch){
        Socio socio = socioRepository.findById(dni).orElseThrow(() -> new ObjetoNoEncontradoException("dni"));

        if (socioPatch.getEmail() != null) { socio.setEmail(socioPatch.getEmail());}
        if (socioPatch.getTelefono() != null) { socio.setTelefono(socioPatch.getTelefono());}
        if (socioPatch.getActivo() != null) { socio.setActivo(socioPatch.getActivo());}

        Socio guardado = socioRepository.save(socio);
        return convertirASocioDTO(guardado);
    }

    public SocioDTO buscarSocioPorDni(String dni){
        Socio socio = socioRepository.findById(dni).orElseThrow(() -> new ObjetoNoEncontradoException("dni"));
        return convertirASocioDTO(socio);
    }

    public List<SocioDTO> buscarSocios(){
        List<Socio> socios = socioRepository.findAll();
        List<SocioDTO> sociosDTO = new ArrayList<>();

        for (Socio socio: socios){
            SocioDTO socioConvertido = convertirASocioDTO(socio);
            sociosDTO.add(socioConvertido);
        }

        return sociosDTO;
    }

    public SocioMembresiaDTO asignarMembresia(String dni, Integer idMembresia){
        Socio socio = socioRepository.findById(dni).orElseThrow(()-> new ObjetoNoEncontradoException(dni));

        Membresia membresia = membresiaRepository.findById(idMembresia).orElseThrow(() -> new ObjetoNoEncontradoException(String.valueOf(idMembresia)));

        SocioMembresia socioMembresia = new SocioMembresia(membresia.getPrecio_sugerido(), socio, membresia);

        socio.agregarMembresia(socioMembresia);
        socioRepository.save(socio);
        membresia.agregarSocio(socioMembresia);
        membresiaRepository.save(membresia);

        SocioMembresia guardada = socioMembresiaRepository.save(socioMembresia);
        return convertirASocioMembresiaDTO(guardada);
    }

    public List<PagoDTO> buscarPagosPorDni(String dni){
        if (!socioRepository.existsById(dni)){
            throw new ObjetoNoEncontradoException(dni);
        }

        List<PagoDTO> pagos = new ArrayList<>();

        for (Pago pago: pagoRepository.buscarPagosPorSocio(dni)){
            PagoDTO pagoConvertido = convertirAPagoDTO(pago);
            pagos.add(pagoConvertido);
        }

        return pagos;
    }

    public AsistenciaSocioIdDTO registrarAsistencia(String dni){
        Socio socio = socioRepository.findById(dni).orElseThrow(()-> new ObjetoNoEncontradoException(dni));

        Asistencia nuevaAsistencia = new Asistencia(socio);
        Asistencia guardada = asistenciaRepository.save(nuevaAsistencia);
        return convertirAAsistenciaSocioIdDTO(guardada.getId_asistencia());



    }












}
