package com.nexo.gestion.services;

import com.nexo.gestion.dto.AsistenciaSocioIdDTO;
import com.nexo.gestion.entity.Asistencia;
import com.nexo.gestion.entity.AsistenciaSocioId;
import com.nexo.gestion.repository.AsistenciaRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AsistenciaService {
    private final AsistenciaRepository asistenciaRepository;

    public AsistenciaService(AsistenciaRepository asistenciaRepository){
        this.asistenciaRepository = asistenciaRepository;
    }

    private AsistenciaSocioIdDTO convertirAAsistenciaSocioIdDTO(AsistenciaSocioId a){
        return new AsistenciaSocioIdDTO(
                a.getDniSocio(),
                a.getFecha_hora()
        );
    }

    public List<AsistenciaSocioIdDTO> buscarAsistencias(){
        List<AsistenciaSocioIdDTO> asistencias = new ArrayList<>();
        for (Asistencia asistencia: asistenciaRepository.findAll()){
            AsistenciaSocioIdDTO asistenciaConvertida = convertirAAsistenciaSocioIdDTO(asistencia.getId_asistencia());
            asistencias.add(asistenciaConvertida);
        }

        return asistencias;
    }


}
