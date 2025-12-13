package com.nexo.gestion.services;

import com.nexo.gestion.dto.EmpleadoDTO;
import com.nexo.gestion.dto.MedioPagoDTO;
import com.nexo.gestion.entity.Empleado;
import com.nexo.gestion.entity.MedioPago;
import com.nexo.gestion.exceptions.ObjetoDuplicadoException;
import com.nexo.gestion.repository.MedioPagoRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class MedioPagoService {
    private final MedioPagoRepository medioPagoRepository;

    public MedioPagoService(MedioPagoRepository medioPagoRepository){
        this.medioPagoRepository = medioPagoRepository;
    }

    private MedioPagoDTO convertirAMedioPagoDTO(MedioPago medioPago) {
        return new MedioPagoDTO(
                medioPago.getId_medioPago(),
                medioPago.getNombre()
        );
    }

    public MedioPagoDTO registrarMedioPago(MedioPagoDTO medioPagoDTO){
        if(medioPagoRepository.existsByNombre(medioPagoDTO.nombre())){
            throw new ObjetoDuplicadoException(medioPagoDTO.nombre());
        }

        MedioPago medioPago = new MedioPago(medioPagoDTO.nombre());
        MedioPago guardado = medioPagoRepository.save(medioPago);
        return convertirAMedioPagoDTO(guardado);
    }

    public List<MedioPagoDTO> buscarMediosDePago(){
        List<MedioPagoDTO> mediosdepago = new ArrayList<>();
        for (MedioPago medioPago: medioPagoRepository.findAll()){
            MedioPagoDTO medioConvertido = convertirAMedioPagoDTO(medioPago);
            mediosdepago.add(medioConvertido);
        }

        return mediosdepago;
    }





}
