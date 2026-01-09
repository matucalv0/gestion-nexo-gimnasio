package com.nexo.gestion.services;

import com.nexo.gestion.dto.MembresiaCreateDTO;
import com.nexo.gestion.dto.MembresiaDTO;
import com.nexo.gestion.dto.MembresiaPatchDTO;
import com.nexo.gestion.entity.Membresia;
import com.nexo.gestion.exceptions.ObjetoDuplicadoException;
import com.nexo.gestion.exceptions.ObjetoNoEncontradoException;
import com.nexo.gestion.repository.MembresiaRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class MembresiaService {
    private final MembresiaRepository membresiaRepository;

    public MembresiaService(MembresiaRepository membresiaRepository){
        this.membresiaRepository = membresiaRepository;
    }

    private MembresiaDTO convertirAMembresiaDTO(Membresia membresia) {
        return new MembresiaDTO(
                membresia.getId_membresia(),
                membresia.getDuracion_dias(),
                membresia.getPrecio_sugerido(),
                membresia.getNombre(),
                membresia.getAsistencias_por_semana(),
                membresia.isActivo()
        );
    }


    public MembresiaDTO registrarMembresia(MembresiaCreateDTO membresiaCreateDTO){
        Membresia membresia = new Membresia(membresiaCreateDTO.getNombre(), membresiaCreateDTO.getDuracion_dias(), membresiaCreateDTO.getPrecio_sugerido(), membresiaCreateDTO.getAsistencias_por_semana());
        Membresia guardada = membresiaRepository.save(membresia);
        return convertirAMembresiaDTO(guardada);
    }

    public MembresiaDTO bajaMembresia(Integer id){
        Membresia membresia = membresiaRepository.findById(id).orElseThrow(() -> new ObjetoNoEncontradoException("id"));
        membresia.setActivo(false);
        Membresia guardada = membresiaRepository.save(membresia);
        return convertirAMembresiaDTO(guardada);
    }

    public MembresiaDTO patchMembresia(Integer id, MembresiaPatchDTO membresiaPatchDTO){
        Membresia membresia = membresiaRepository.findById(id).orElseThrow(()-> new ObjetoNoEncontradoException(String.valueOf(id)));

        if (membresiaPatchDTO.getActivo() != null){membresia.setActivo(membresiaPatchDTO.getActivo());}
        if (membresiaPatchDTO.getDuracion_dias() != null) {membresia.setDuracion_dias(membresiaPatchDTO.getDuracion_dias());}
        if (membresiaPatchDTO.getNombre() != null){membresia.setNombre(membresiaPatchDTO.getNombre());}
        if (membresiaPatchDTO.getPrecio_sugerido() != null){membresia.setPrecio_sugerido(membresiaPatchDTO.getPrecio_sugerido());}

        Membresia guardada = membresiaRepository.save(membresia);
        return convertirAMembresiaDTO(guardada);
    }

    public MembresiaDTO buscarMembresiaPorId(Integer id){
        Membresia membresia =  membresiaRepository.findById(id).orElseThrow(() -> new ObjetoNoEncontradoException(String.valueOf(id)));
        return convertirAMembresiaDTO(membresia);
    }

    public List<MembresiaDTO> mostrarMembresias(){
        List<Membresia> membresias = membresiaRepository.findAll();
        List<MembresiaDTO> membresiasDTO = new ArrayList<>();

        for (Membresia membresia: membresias){
            MembresiaDTO membresiaConvertida = convertirAMembresiaDTO(membresia);
            membresiasDTO.add(membresiaConvertida);
        }

        return membresiasDTO;
    }













}
