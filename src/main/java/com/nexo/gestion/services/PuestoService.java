package com.nexo.gestion.services;

import com.nexo.gestion.dto.EmpleadoDTO;
import com.nexo.gestion.dto.PuestoDTO;
import com.nexo.gestion.entity.Empleado;
import com.nexo.gestion.entity.Puesto;
import com.nexo.gestion.exceptions.ObjetoDuplicadoException;
import com.nexo.gestion.repository.PuestoRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PuestoService {
    private final PuestoRepository puestoRepository;

    public PuestoService(PuestoRepository puestoRepository){
        this.puestoRepository = puestoRepository;
    }

    private PuestoDTO convertirAPuestoDTO(Puesto puesto) {
        return new PuestoDTO(
                puesto.getId_puesto(),
                puesto.getNombre()
        );
    }

    public PuestoDTO registrarPuesto(PuestoDTO puestoDTO){
        if (puestoRepository.existsByNombre(puestoDTO.nombre())){
            throw new ObjetoDuplicadoException(puestoDTO.nombre());
        }

        Puesto puesto = new Puesto(puestoDTO.nombre());

        Puesto guardado = puestoRepository.save(puesto);
        return convertirAPuestoDTO(guardado);
    }

    public List<PuestoDTO> buscarPuestos(){
        List<PuestoDTO> puestos = new ArrayList<>();
        for (Puesto puesto: puestoRepository.findAll()){
            PuestoDTO puestoDTO = convertirAPuestoDTO(puesto);
            puestos.add(puestoDTO);
        }

        return puestos;

    }




}
