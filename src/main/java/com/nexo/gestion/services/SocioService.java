package com.nexo.gestion.services;

import com.nexo.gestion.dto.PagoCreateDTO;
import com.nexo.gestion.dto.SocioCreateDTO;
import com.nexo.gestion.dto.SocioPatchDTO;
import com.nexo.gestion.entity.Membresia;
import com.nexo.gestion.entity.Pago;
import com.nexo.gestion.entity.Socio;
import com.nexo.gestion.entity.SocioMembresia;
import com.nexo.gestion.exceptions.ObjetoDuplicadoException;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.repository.MembresiaRepository;
import com.nexo.gestion.repository.PagoRepository;
import com.nexo.gestion.repository.SocioMembresiaRepository;
import com.nexo.gestion.repository.SocioRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;

import java.time.LocalDate;
import java.util.List;

@Service
public class SocioService {
    private final SocioRepository socioRepository;
    private final MembresiaRepository membresiaRepository;
    private final SocioMembresiaRepository socioMembresiaRepository;
    private final PagoRepository pagoRepository;

    public SocioService(PagoRepository pagoRepository, SocioRepository socioRepository, MembresiaRepository membresiaRepository, SocioMembresiaRepository socioMembresiaRepository){
        this.socioRepository = socioRepository;
        this.membresiaRepository = membresiaRepository;
        this.socioMembresiaRepository = socioMembresiaRepository;
        this.pagoRepository = pagoRepository;

    }

    public Socio registrarSocio(SocioCreateDTO socioDTO){
        if (socioRepository.existsById(socioDTO.getDni())) {
            throw new ObjetoDuplicadoException(socioDTO.getDni());
        }

        Socio socio = new Socio(socioDTO.getDni(), socioDTO.getNombre(), socioDTO.getTelefono(), socioDTO.getEmail(), socioDTO.getFecha_nacimiento());
        return socioRepository.save(socio);
    }

    public Socio bajaSocio(String dni){
        Socio socio = socioRepository.findById(dni).orElseThrow(() -> new ObjetoNoEncontradoException("dni"));
        socio.setActivo(false);
        return socioRepository.save(socio);
    }

    public Socio patchSocio(String dni, SocioPatchDTO socioPatch){
        Socio socio = socioRepository.findById(dni).orElseThrow(() -> new ObjetoNoEncontradoException("dni"));

        if (socioPatch.getEmail() != null) { socio.setEmail(socioPatch.getEmail());}
        if (socioPatch.getTelefono() != null) { socio.setTelefono(socioPatch.getTelefono());}
        if (socioPatch.getActivo() != null) { socio.setActivo(socioPatch.getActivo());}

        return socioRepository.save(socio);
    }

    public Socio buscarSocioPorDni(String dni){
        return socioRepository.findById(dni).orElseThrow(() -> new ObjetoNoEncontradoException("dni"));
    }

    public List<Socio> buscarSocios(){
        return socioRepository.findAll();
    }

    public SocioMembresia asignarMembresia(String dni, Integer idMembresia){
        Socio socio = socioRepository.findById(dni).orElseThrow(()-> new ObjetoNoEncontradoException(dni));

        Membresia membresia = membresiaRepository.findById(idMembresia).orElseThrow(() -> new ObjetoNoEncontradoException(String.valueOf(idMembresia)));

        SocioMembresia socioMembresia = new SocioMembresia(membresia.getPrecio_sugerido(), socio, membresia);

        socio.agregarMembresia(socioMembresia);
        socioRepository.save(socio);
        membresia.agregarSocio(socioMembresia);
        membresiaRepository.save(membresia);

        return socioMembresiaRepository.save(socioMembresia);
    }

    public List<Pago> buscarPagosPorDni(String dni){
        if (!socioRepository.existsById(dni)){
            throw new ObjetoNoEncontradoException(dni);
        }

        return pagoRepository.buscarPagosPorSocio(dni);
    }












}
