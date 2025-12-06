package com.nexo.gestion.services;

import com.nexo.gestion.dto.MembresiaCreateDTO;
import com.nexo.gestion.dto.MembresiaPatchDTO;
import com.nexo.gestion.entity.Membresia;
import com.nexo.gestion.exceptions.ObjetoDuplicadoException;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.repository.MembresiaRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MembresiaService {
    private final MembresiaRepository membresiaRepository;

    public MembresiaService(MembresiaRepository membresiaRepository){
        this.membresiaRepository = membresiaRepository;
    }

    public Membresia registrarMembresia(MembresiaCreateDTO membresiaCreateDTO){
        Membresia membresia = new Membresia(membresiaCreateDTO.getNombre(), membresiaCreateDTO.getDuracion_dias(), membresiaCreateDTO.getPrecio_sugerido());
        return membresiaRepository.save(membresia);
    }

    public Membresia bajaMembresia(Integer id){
        Membresia membresia = membresiaRepository.findById(id).orElseThrow(() -> new ObjetoNoEncontradoException("id"));
        membresia.setActivo(false);
        return membresiaRepository.save(membresia);
    }

    public Membresia patchMembresia(Integer id, MembresiaPatchDTO membresiaPatchDTO){
        Membresia membresia = membresiaRepository.findById(id).orElseThrow(()-> new ObjetoNoEncontradoException(String.valueOf(id)));

        if (membresiaPatchDTO.getActivo() != null){membresia.setActivo(membresiaPatchDTO.getActivo());}
        if (membresiaPatchDTO.getDuracion_dias() != null) {membresia.setDuracion_dias(membresiaPatchDTO.getDuracion_dias());}
        if (membresiaPatchDTO.getNombre() != null){membresia.setNombre(membresiaPatchDTO.getNombre());}
        if (membresiaPatchDTO.getPrecio_sugerido() != null){membresia.setPrecio_sugerido(membresiaPatchDTO.getPrecio_sugerido());}

        return membresiaRepository.save(membresia);
    }

    public Membresia buscarMembresiaPorId(Integer id){
        return membresiaRepository.findById(id).orElseThrow(() -> new ObjetoNoEncontradoException(String.valueOf(id)));
    }

    public List<Membresia> mostrarMembresias(){
        return membresiaRepository.findAll();
    }













}
